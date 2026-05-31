<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { useGenerationStore } from '@/stores/generation'
import { queryHistory, getHistoryById } from '@/storage/history-reader'
import { deleteHistoryRecord, clearAllHistory } from '@/storage/history-deleter'
import { checkStorageAvailability } from '@/storage/storage-availability'
import type { HistoryRecord, HistoryQueryResult } from '@/types/history'
import { Search, Download, Trash2, RotateCcw, Trash, ImageIcon, AlertTriangle, ChevronRight, X as XIcon } from '@lucide/vue'
import { generateFilename } from '@/utils/image-utils'

const paramsStore = useGenerationParamsStore()
const generationStore = useGenerationStore()

const storageAvailable = ref<boolean | null>(null)
const storageMessage = ref('')
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const historyResult = ref<HistoryQueryResult>({ records: [], total: 0, page: 1, pageSize: 20, hasMore: false })
const loading = ref(false)
const selectedRecord = ref<HistoryRecord | null>(null)
const showFullImage = ref(false)
const fullImageRecord = ref<HistoryRecord | null>(null)

const thumbnailUrls = ref<Map<number, string>>(new Map())

onMounted(async () => {
  const check = await checkStorageAvailability()
  storageAvailable.value = check.available
  storageMessage.value = check.message || ''
  if (check.available) {
    await loadHistory()
  }
})

watch(() => generationStore.lastGenerationTime, async (newVal) => {
  if (newVal && storageAvailable.value) {
    await loadHistory()
  }
})

function getThumbnailUrl(record: HistoryRecord): string {
  if (record.id == null || !record.thumbnailBlob) return ''
  if (!thumbnailUrls.value.has(record.id)) {
    thumbnailUrls.value.set(record.id, URL.createObjectURL(record.thumbnailBlob))
  }
  return thumbnailUrls.value.get(record.id)!
}

function getFullImageUrl(record: HistoryRecord): string {
  if (!record.imageBlob) return ''
  return URL.createObjectURL(record.imageBlob)
}

async function loadHistory() {
  loading.value = true
  try {
    const start = startDate.value ? new Date(startDate.value).getTime() : null
    const end = endDate.value ? new Date(endDate.value + 'T23:59:59').getTime() : null
    historyResult.value = await queryHistory({
      page: 1,
      pageSize: 20,
      searchText: searchQuery.value || undefined,
      startDate: start,
      endDate: end,
    })
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function searchHistory() {
  loadHistory()
}

function reloadParams(record: HistoryRecord) {
  paramsStore.prompt = record.prompt
  paramsStore.setSize(record.size)
  paramsStore.setQuality(record.quality)
  paramsStore.setBackground(record.background)
  paramsStore.setOutputFormat(record.outputFormat)
  if (record.outputCompression != null) {
    paramsStore.setOutputCompression(record.outputCompression)
  }
}

async function downloadHistoryImage(record: HistoryRecord) {
  const full = await getHistoryById(record.id!)
  if (!full) return
  const filename = generateFilename(full.outputFormat as any, 0)
  const url = URL.createObjectURL(full.imageBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function confirmDelete(id: number) {
  if (!confirm('确定要删除这条历史记录吗？')) return
  await deleteHistoryRecord(id)
  await loadHistory()
  if (selectedRecord.value?.id === id) {
    selectedRecord.value = null
  }
}

async function confirmClearAll() {
  if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return
  await clearAllHistory()
  await loadHistory()
  selectedRecord.value = null
}

async function loadMore() {
  loading.value = true
  try {
    const start = startDate.value ? new Date(startDate.value).getTime() : null
    const end = endDate.value ? new Date(endDate.value + 'T23:59:59').getTime() : null
    const next = await queryHistory({
      page: historyResult.value.page + 1,
      pageSize: 20,
      searchText: searchQuery.value || undefined,
      startDate: start,
      endDate: end,
    })
    historyResult.value = {
      ...next,
      records: [...historyResult.value.records, ...next.records],
    }
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

async function viewFullImage(record: HistoryRecord) {
  const full = await getHistoryById(record.id!)
  if (!full) return
  fullImageRecord.value = full
  showFullImage.value = true
}

function closeFullImage() {
  showFullImage.value = false
  fullImageRecord.value = null
}

async function downloadFullImage() {
  if (!fullImageRecord.value) return
  await downloadHistoryImage(fullImageRecord.value)
  closeFullImage()
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="history-panel" data-testid="history-panel" aria-label="本地历史">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-medium text-gray-700">本地历史</h2>
      <button
        v-if="historyResult.total > 0"
        @click="confirmClearAll()"
        class="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
        type="button"
        data-testid="clear-all-btn"
        aria-label="清空全部历史"
      >
        <Trash :size="12" />
        清空
      </button>
    </div>

    <div v-if="storageAvailable === false" class="p-2 rounded-md bg-amber-50 text-amber-700 text-xs" data-testid="storage-unavailable">
      <div class="flex items-start gap-1.5">
        <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
        <span>{{ storageMessage }}</span>
      </div>
    </div>

    <template v-else>
      <div class="space-y-2 mb-3">
        <div class="flex gap-1">
          <div class="relative flex-1">
            <Search :size="14" class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索 Prompt..."
              class="w-full rounded-md border border-gray-300 pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="search-input"
              @keydown.enter="searchHistory()"
            />
          </div>
          <button
            @click="searchHistory()"
            class="px-2 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700"
            type="button"
            aria-label="搜索"
          >搜索</button>
        </div>
        <div class="grid grid-cols-2 gap-1">
          <input
            v-model="startDate"
            type="date"
            class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="start-date"
            @change="searchHistory()"
          />
          <input
            v-model="endDate"
            type="date"
            class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="end-date"
            @change="searchHistory()"
          />
        </div>
      </div>

      <p class="text-xs text-gray-400 mb-2">图片仅保存在当前浏览器本地</p>

      <div v-if="loading && historyResult.records.length === 0" class="py-8 text-center text-gray-400 text-xs" data-testid="history-loading">
        <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        加载中...
      </div>

      <div v-else-if="historyResult.records.length === 0" class="py-8 text-center text-gray-400" data-testid="history-empty">
        <ImageIcon :size="24" class="mx-auto mb-1" />
        <p class="text-xs">暂无历史记录</p>
      </div>

      <div v-else class="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto" data-testid="history-list">
        <div
          v-for="record in historyResult.records"
          :key="record.id"
          class="flex gap-2 p-2 rounded-md border border-gray-100 hover:border-gray-200 bg-white cursor-pointer"
          @click="selectedRecord = record"
          :class="{ 'border-blue-300 bg-blue-50/30': selectedRecord?.id === record.id }"
          data-testid="history-item"
        >
          <div
            v-if="record.thumbnailBlob"
            class="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0"
            @click.stop="viewFullImage(record)"
          >
            <img :src="getThumbnailUrl(record)" alt="" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-700 truncate" :title="record.prompt">{{ record.prompt }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(record.createdAt) }} · {{ record.size }}</p>
            <div class="flex items-center gap-1 mt-1">
              <button
                @click.stop="reloadParams(record)"
                class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                type="button"
                :aria-label="'重新载入参数'"
                data-testid="reload-params-btn"
                title="载入参数"
              >
                <RotateCcw :size="10" />
              </button>
              <button
                @click.stop="downloadHistoryImage(record)"
                class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                type="button"
                :aria-label="'下载图片'"
                data-testid="download-history-btn"
                title="下载"
              >
                <Download :size="10" />
              </button>
              <button
                @click.stop="confirmDelete(record.id!)"
                class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                type="button"
                :aria-label="'删除记录'"
                data-testid="delete-history-btn"
                title="删除"
              >
                <Trash2 :size="10" />
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="historyResult.hasMore"
          @click="loadMore()"
          class="w-full py-1.5 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
          type="button"
          data-testid="load-more-btn"
        >
          加载更多
          <ChevronRight :size="12" class="rotate-90" />
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="showFullImage && fullImageRecord"
        class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        @click.self="closeFullImage()"
        data-testid="image-modal"
      >
        <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <img
            :src="getFullImageUrl(fullImageRecord)"
            alt="历史图片"
            class="max-w-full max-h-[80vh] object-contain"
          />
          <div class="absolute top-2 right-2 flex gap-1">
            <button
              @click="downloadFullImage()"
              class="p-2 rounded-md bg-white/90 text-gray-700 hover:bg-white shadow"
              type="button"
              aria-label="下载图片"
            >
              <Download :size="16" />
            </button>
            <button
              @click="closeFullImage()"
              class="p-2 rounded-md bg-white/90 text-gray-700 hover:bg-white shadow"
              type="button"
              aria-label="关闭"
            >
              <XIcon :size="16" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
