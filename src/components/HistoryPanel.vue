<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
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
const fullImageUrl = ref('')

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

function revokeThumbnailUrls() {
  for (const url of thumbnailUrls.value.values()) {
    URL.revokeObjectURL(url)
  }
  thumbnailUrls.value.clear()
}

function revokeFullImageUrl() {
  if (fullImageUrl.value) {
    URL.revokeObjectURL(fullImageUrl.value)
    fullImageUrl.value = ''
  }
}

async function loadHistory() {
  loading.value = true
  try {
    revokeThumbnailUrls()
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
  revokeFullImageUrl()
  fullImageRecord.value = full
  fullImageUrl.value = URL.createObjectURL(full.imageBlob)
  showFullImage.value = true
}

function closeFullImage() {
  showFullImage.value = false
  fullImageRecord.value = null
  revokeFullImageUrl()
}

async function downloadFullImage() {
  if (!fullImageRecord.value) return
  await downloadHistoryImage(fullImageRecord.value)
  closeFullImage()
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onBeforeUnmount(() => {
  revokeThumbnailUrls()
  revokeFullImageUrl()
})
</script>

<template>
  <div class="history-panel" data-testid="history-panel" aria-label="本地历史">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="text-sm font-semibold text-stone-700">本地历史</h2>
      <button
        v-if="historyResult.total > 0"
        @click="confirmClearAll()"
        class="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
        type="button"
        data-testid="clear-all-btn"
        aria-label="清空全部历史"
      >
        <Trash :size="12" />
        清空
      </button>
    </div>

    <div v-if="storageAvailable === false" class="p-2 rounded-lg border border-amber-200 bg-amber-50/90 text-amber-800 text-xs" data-testid="storage-unavailable">
      <div class="flex items-start gap-1.5">
        <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
        <span>{{ storageMessage }}</span>
      </div>
    </div>

    <template v-else>
      <div class="space-y-2.5 mb-3">
        <div class="flex gap-1.5">
          <div class="relative flex-1">
            <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索 Prompt..."
              class="w-full rounded-lg border border-stone-300 pl-8 pr-2 py-2 text-xs focus:outline-none focus:ring-0 shadow-sm"
              data-testid="search-input"
              @keydown.enter="searchHistory()"
            />
          </div>
          <button
            @click="searchHistory()"
            class="px-2.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-sm"
            type="button"
            aria-label="搜索"
          >搜索</button>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <input
            v-model="startDate"
            type="date"
            class="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="start-date"
            @change="searchHistory()"
          />
          <input
            v-model="endDate"
            type="date"
            class="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="end-date"
            @change="searchHistory()"
          />
        </div>
      </div>

      <p class="text-xs font-medium text-stone-400 mb-2">图片仅保存在当前浏览器本地</p>

      <div v-if="loading && historyResult.records.length === 0" class="py-8 text-center text-stone-500 text-xs" data-testid="history-loading">
        <div class="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        加载中...
      </div>

      <div v-else-if="historyResult.records.length === 0" class="py-8 text-center text-stone-500" data-testid="history-empty">
        <ImageIcon :size="24" class="mx-auto mb-1 text-teal-700" />
        <p class="text-xs font-medium">暂无历史记录</p>
      </div>

      <div v-else class="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1" data-testid="history-list">
        <div
          v-for="record in historyResult.records"
          :key="record.id"
          class="flex gap-2 p-2 rounded-lg border border-stone-200 bg-[#fffdfa]/80 hover:border-teal-700/35 hover:bg-white cursor-pointer shadow-sm"
          @click="selectedRecord = record"
          :class="{ 'border-teal-700/50 bg-teal-50/70 shadow-[0_10px_24px_rgb(18_126_115_/_0.12)]': selectedRecord?.id === record.id }"
          data-testid="history-item"
        >
          <div
            v-if="record.thumbnailBlob"
            class="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200"
            @click.stop="viewFullImage(record)"
          >
            <img :src="getThumbnailUrl(record)" alt="" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-stone-700 truncate" :title="record.prompt">{{ record.prompt }}</p>
            <p class="text-xs text-stone-400 mt-0.5">{{ formatDate(record.createdAt) }} · {{ record.size }}</p>
            <div class="flex items-center gap-1 mt-1">
              <button
                @click.stop="reloadParams(record)"
                class="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                type="button"
                :aria-label="'重新载入参数'"
                data-testid="reload-params-btn"
                title="载入参数"
              >
                <RotateCcw :size="10" />
              </button>
              <button
                @click.stop="downloadHistoryImage(record)"
                class="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                type="button"
                :aria-label="'下载图片'"
                data-testid="download-history-btn"
                title="下载"
              >
                <Download :size="10" />
              </button>
              <button
                @click.stop="confirmDelete(record.id!)"
                class="p-1 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-600"
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
          class="w-full rounded-lg border border-stone-200 bg-white/70 py-2 text-xs font-medium text-teal-700 hover:bg-stone-100 hover:text-teal-800 flex items-center justify-center gap-1"
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
        class="fixed inset-0 z-50 bg-stone-950/76 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="closeFullImage()"
        data-testid="image-modal"
      >
        <div class="relative max-w-4xl max-h-[90vh] bg-[#fffdfa] rounded-lg overflow-hidden shadow-2xl">
          <img
            :src="fullImageUrl"
            alt="历史图片"
            class="max-w-full max-h-[80vh] object-contain"
          />
          <div class="absolute top-2 right-2 flex gap-1">
            <button
              @click="downloadFullImage()"
              class="p-2 rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow"
              type="button"
              aria-label="下载图片"
            >
              <Download :size="16" />
            </button>
            <button
              @click="closeFullImage()"
              class="p-2 rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow"
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
