<script setup lang="ts">
import { useGenerationStore } from '@/stores/generation'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { generateFilename } from '@/utils/image-utils'
import { Download, Copy, X as XIcon, DownloadCloud, AlertCircle, ImageIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const generationStore = useGenerationStore()
const paramsStore = useGenerationParamsStore()
const { t } = useI18n()

function downloadImage(index: number) {
  const result = generationStore.currentResults[index]
  if (!result) return
  const filename = generateFilename(paramsStore.outputFormat, index)
  const a = document.createElement('a')
  a.href = result.objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function copyImage(index: number) {
  const result = generationStore.currentResults[index]
  if (!result) return
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [result.mimeType]: result.blob }),
    ])
  } catch {
    try {
      await navigator.clipboard.writeText(result.objectUrl)
    } catch {
      // silent fail
    }
  }
}

function downloadAll() {
  for (let i = 0; i < generationStore.currentResults.length; i++) {
    setTimeout(() => downloadImage(i), i * 200)
  }
}
</script>

<template>
  <div class="result-grid" data-testid="result-grid" :aria-label="t('result.ariaLabel')">
    <div v-if="generationStore.error" class="p-3 rounded-lg border border-red-200 bg-red-50/95 text-red-700 text-sm shadow-sm" data-testid="error-state" role="alert" aria-live="assertive">
      <div class="flex min-w-0 items-start gap-2">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" aria-hidden="true" />
        <span class="min-w-0 break-words">{{ generationStore.error.userMessage }}</span>
      </div>
    </div>

    <div v-if="generationStore.storageWarning" class="p-3 rounded-lg border border-amber-200 bg-amber-50/95 text-amber-800 text-sm mb-3 shadow-sm" data-testid="storage-warning" role="alert" aria-live="polite">
      <div class="flex min-w-0 items-start gap-2">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" aria-hidden="true" />
        <span class="min-w-0 break-words">{{ generationStore.storageWarning.userMessage }}</span>
      </div>
    </div>

    <div v-if="generationStore.isGenerating && !generationStore.hasResults" class="flex min-h-[300px] flex-col items-center justify-center py-12 text-stone-600" data-testid="loading-state" role="status" aria-live="polite" aria-busy="true">
      <div class="w-9 h-9 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_24px_rgb(18_126_115_/_0.18)]" aria-hidden="true"></div>
      <p class="px-3 text-center text-sm font-medium">{{ generationStore.loadingMessage }}</p>
    </div>

    <div v-else-if="!generationStore.hasResults" class="flex min-h-[300px] flex-col items-center justify-center py-12 text-stone-600" data-testid="empty-state">
      <div class="mb-3 rounded-lg border border-stone-200 bg-stone-50/90 p-3 shadow-sm">
        <ImageIcon :size="32" class="text-teal-700" aria-hidden="true" />
      </div>
      <p class="px-3 text-center text-sm font-semibold text-stone-700">{{ t('result.emptyTitle') }}</p>
      <p class="mt-1 px-3 text-center text-xs text-stone-600">{{ t('result.emptyHint') }}</p>
    </div>

    <template v-else>
      <div v-if="generationStore.isGenerating" class="mb-3 flex min-w-0 items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/90 px-3 py-2 text-sm font-medium text-teal-800 shadow-sm" data-testid="loading-progress" role="status" aria-live="polite" aria-busy="true">
        <div class="h-4 w-4 shrink-0 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" aria-hidden="true"></div>
        <span class="min-w-0 break-words">{{ generationStore.loadingMessage }}</span>
      </div>

      <div class="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
        <h2 class="min-w-0 text-sm font-semibold text-stone-700">
          {{ t('result.countLabel', { count: generationStore.currentResults.length }) }}
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="downloadAll()"
            class="flex min-h-11 items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white/80 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 shadow-sm lg:min-h-8"
            type="button"
            data-testid="download-all-btn"
            :aria-label="t('result.downloadAllAriaLabel')"
          >
            <DownloadCloud :size="14" aria-hidden="true" />
            {{ t('result.downloadAll') }}
          </button>
        </div>
      </div>

      <div class="grid gap-3.5" data-testid="result-images">
        <div
          v-for="(result, index) in generationStore.currentResults"
          :key="index"
          class="relative group rounded-lg overflow-hidden border border-stone-200 bg-[#fffdfa] shadow-[0_14px_32px_rgb(54_44_32_/_0.10)]"
        >
          <img
            :src="result.objectUrl"
            :alt="t('result.resultAlt', { index: index + 1 })"
            width="1024"
            height="1024"
            decoding="async"
            loading="lazy"
            class="w-full aspect-square object-contain bg-[linear-gradient(135deg,#f7f1e7,#edf4f1)]"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-950/72 to-transparent p-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            <div class="flex items-center justify-center sm:justify-end gap-1">
              <button
                @click="downloadImage(index)"
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="t('result.downloadAriaLabel', { index: index + 1 })"
                data-testid="download-result-btn"
              >
                <Download :size="14" aria-hidden="true" />
              </button>
              <button
                @click="copyImage(index)"
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="t('result.copyAriaLabel', { index: index + 1 })"
                data-testid="copy-result-btn"
              >
                <Copy :size="14" aria-hidden="true" />
              </button>
              <button
                @click="generationStore.removeResult(index)"
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="t('result.removeAriaLabel', { index: index + 1 })"
                data-testid="remove-result-btn"
              >
                <XIcon :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p v-if="result.revisedPrompt" class="border-t border-stone-100 px-2.5 py-1.5 text-xs text-stone-600 truncate" :title="result.revisedPrompt">
            {{ result.revisedPrompt }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
