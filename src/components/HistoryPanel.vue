<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { useGenerationStore } from '@/stores/generation'
import { useLocaleStore } from '@/stores/locale'
import { queryHistory, getHistoryById } from '@/storage/history-reader'
import { deleteHistoryRecord, clearAllHistory } from '@/storage/history-deleter'
import { checkStorageAvailability } from '@/storage/storage-availability'
import type { HistoryRecord, HistoryQueryResult } from '@/types/history'
import { Search, Download, Trash2, RotateCcw, Trash, ImageIcon, AlertTriangle, ChevronRight, X as XIcon } from '@lucide/vue'
import { generateFilename } from '@/utils/image-utils'
import { useI18n } from 'vue-i18n'

const paramsStore = useGenerationParamsStore()
const generationStore = useGenerationStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const storageAvailable = ref<boolean | null>(null)
const storageMessageKey = ref('')
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
  storageMessageKey.value = check.messageKey ?? ''
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
  if (!confirm(t('history.confirmDelete'))) return
  await deleteHistoryRecord(id)
  await loadHistory()
  if (selectedRecord.value?.id === id) {
    selectedRecord.value = null
  }
}

async function confirmClearAll() {
  if (!confirm(t('history.confirmClearAll'))) return
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
  return new Date(ts).toLocaleString(localeStore.currentLocale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onBeforeUnmount(() => {
  revokeThumbnailUrls()
  revokeFullImageUrl()
})
</script>

<template>
  <div class="history-panel" data-testid="history-panel" :aria-label="t('history.ariaLabel')">
    <div class="flex min-w-0 items-center justify-between gap-3 mb-3">
      <h2 class="min-w-0 text-sm font-semibold text-stone-700">{{ t('history.title') }}</h2>
      <button
        v-if="historyResult.total > 0"
        @click="confirmClearAll()"
        class="flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 hover:text-red-800 lg:min-h-8"
        type="button"
        data-testid="clear-all-btn"
        :aria-label="t('history.clearAllAriaLabel')"
      >
        <Trash :size="12" aria-hidden="true" />
        {{ t('history.clear') }}
      </button>
    </div>

    <div v-if="storageAvailable === false" class="p-2 rounded-lg border border-amber-200 bg-amber-50/90 text-amber-800 text-xs" data-testid="storage-unavailable" role="alert" aria-live="polite">
      <div class="flex min-w-0 items-start gap-1.5">
        <AlertTriangle :size="14" class="shrink-0 mt-0.5" aria-hidden="true" />
        <span class="min-w-0 break-words">{{ t(storageMessageKey) }}</span>
      </div>
    </div>

    <template v-else>
      <div class="space-y-2.5 mb-3">
        <div class="flex min-w-0 gap-1.5">
          <div class="relative min-w-0 flex-1">
            <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('history.searchPlaceholder')"
              class="w-full rounded-lg border border-stone-300 pl-8 pr-2 py-2 text-xs focus:outline-none focus:ring-0 shadow-sm"
              data-testid="search-input"
              :aria-label="t('history.searchAriaLabel')"
              @keydown.enter="searchHistory()"
            />
          </div>
          <button
            @click="searchHistory()"
            class="min-h-11 px-2.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-sm lg:min-h-10"
            type="button"
            data-testid="history-search-btn"
            :aria-label="t('common.search')"
          >{{ t('common.search') }}</button>
        </div>
        <div class="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
          <input
            v-model="startDate"
            type="date"
            class="min-h-11 rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm lg:min-h-9"
            data-testid="start-date"
            :aria-label="t('history.startDateAriaLabel')"
            @change="searchHistory()"
          />
          <input
            v-model="endDate"
            type="date"
            class="min-h-11 rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm lg:min-h-9"
            data-testid="end-date"
            :aria-label="t('history.endDateAriaLabel')"
            @change="searchHistory()"
          />
        </div>
      </div>

      <p class="text-xs font-medium text-stone-600 mb-2 break-words">{{ t('history.storageHint') }}</p>

      <div v-if="loading && historyResult.records.length === 0" class="py-8 text-center text-stone-600 text-xs" data-testid="history-loading" role="status" aria-live="polite" aria-busy="true">
        <div class="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" aria-hidden="true"></div>
        {{ t('history.loading') }}
      </div>

      <div v-else-if="historyResult.records.length === 0" class="py-8 text-center text-stone-600" data-testid="history-empty">
        <ImageIcon :size="24" class="mx-auto mb-1 text-teal-700" aria-hidden="true" />
        <p class="text-xs font-medium">{{ t('history.empty') }}</p>
      </div>

      <div v-else class="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1" data-testid="history-list">
        <div
          v-for="record in historyResult.records"
          :key="record.id"
          class="flex min-w-0 gap-2 p-2 rounded-lg border border-stone-200 bg-[#fffdfa]/80 hover:border-teal-700/35 hover:bg-white cursor-pointer shadow-sm"
          @click="selectedRecord = record"
          @keydown.enter.self.prevent="selectedRecord = record"
          @keydown.space.self.prevent="selectedRecord = record"
          :class="{
            'border-teal-700/50 bg-teal-50/70 shadow-[0_10px_24px_rgb(18_126_115_/_0.12)]': selectedRecord?.id === record.id,
            'is-selected': selectedRecord?.id === record.id,
          }"
          role="button"
          tabindex="0"
          :aria-pressed="selectedRecord?.id === record.id"
          :aria-label="t('history.selectAriaLabel', { prompt: record.prompt })"
          data-testid="history-item"
        >
          <div
            v-if="record.thumbnailBlob"
            class="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200"
            @click.stop="viewFullImage(record)"
            @keydown.enter.stop.prevent="viewFullImage(record)"
            @keydown.space.stop.prevent="viewFullImage(record)"
            role="button"
            tabindex="0"
            :aria-label="t('history.previewAriaLabel', { prompt: record.prompt })"
            data-testid="history-thumbnail"
          >
            <img
              :src="getThumbnailUrl(record)"
              alt=""
              width="48"
              height="48"
              decoding="async"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-stone-700 truncate" :title="record.prompt">{{ record.prompt }}</p>
            <p class="mt-0.5 truncate text-xs text-stone-600">{{ formatDate(record.createdAt) }} · {{ record.size }}</p>
            <div class="flex items-center gap-1 mt-1">
              <button
                @click.stop="reloadParams(record)"
                class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-100 text-stone-600 hover:text-stone-800 lg:h-7 lg:w-7"
                type="button"
                :aria-label="t('history.reloadParamsAriaLabel')"
                data-testid="reload-params-btn"
                :title="t('history.reloadParamsTitle')"
              >
                <RotateCcw :size="12" aria-hidden="true" />
              </button>
              <button
                @click.stop="downloadHistoryImage(record)"
                class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-100 text-stone-600 hover:text-stone-800 lg:h-7 lg:w-7"
                type="button"
                :aria-label="t('history.downloadAriaLabel')"
                data-testid="download-history-btn"
                :title="t('history.downloadTitle')"
              >
                <Download :size="12" aria-hidden="true" />
              </button>
              <button
                @click.stop="confirmDelete(record.id!)"
                class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-red-50 text-stone-600 hover:text-red-700 lg:h-7 lg:w-7"
                type="button"
                :aria-label="t('history.deleteAriaLabel')"
                data-testid="delete-history-btn"
                :title="t('history.deleteTitle')"
              >
                <Trash2 :size="12" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="historyResult.hasMore"
          @click="loadMore()"
          class="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white/70 py-2 text-xs font-medium text-teal-700 hover:bg-stone-100 hover:text-teal-800"
          type="button"
          data-testid="load-more-btn"
          :aria-label="t('history.loadMoreAriaLabel')"
        >
          {{ t('history.loadMore') }}
          <ChevronRight :size="12" class="rotate-90" aria-hidden="true" />
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="showFullImage && fullImageRecord"
        class="fixed inset-0 z-50 bg-stone-950/76 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        @click.self="closeFullImage()"
        @keydown.esc="closeFullImage()"
        data-testid="image-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('history.modalAriaLabel')"
        tabindex="-1"
      >
        <div class="relative max-h-[90vh] max-w-[calc(100vw-1rem)] bg-[#fffdfa] rounded-lg overflow-hidden shadow-2xl sm:max-w-4xl">
          <img
            :src="fullImageUrl"
            :alt="t('history.modalImgAlt')"
            decoding="async"
            class="max-w-full max-h-[80vh] object-contain"
          />
          <div class="absolute top-2 right-2 flex gap-1">
            <button
              @click="downloadFullImage()"
              class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-9 lg:w-9"
              type="button"
              :aria-label="t('history.downloadAriaLabel')"
            >
              <Download :size="16" aria-hidden="true" />
            </button>
            <button
              @click="closeFullImage()"
              class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-9 lg:w-9"
              type="button"
              :aria-label="t('common.close')"
            >
              <XIcon :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
