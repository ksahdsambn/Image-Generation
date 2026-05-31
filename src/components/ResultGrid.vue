<script setup lang="ts">
import { useGenerationStore } from '@/stores/generation'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { generateFilename } from '@/utils/image-utils'
import { Download, Copy, X as XIcon, DownloadCloud, AlertCircle, ImageIcon } from '@lucide/vue'

const generationStore = useGenerationStore()
const paramsStore = useGenerationParamsStore()

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
      new ClipboardItem({ [result.mimeType]: result.blob })
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
  <div class="result-grid" data-testid="result-grid" aria-label="生成结果">
    <div v-if="generationStore.error" class="p-3 rounded-lg border border-red-200 bg-red-50/95 text-red-700 text-sm shadow-sm" data-testid="error-state">
      <div class="flex min-w-0 items-start gap-2">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" />
        <span class="min-w-0 break-words">{{ generationStore.error.userMessage }}</span>
      </div>
    </div>

    <div v-if="generationStore.storageWarning" class="p-3 rounded-lg border border-amber-200 bg-amber-50/95 text-amber-800 text-sm mb-3 shadow-sm" data-testid="storage-warning">
      <div class="flex min-w-0 items-start gap-2">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" />
        <span class="min-w-0 break-words">{{ generationStore.storageWarning.userMessage }}</span>
      </div>
    </div>

    <div v-else-if="generationStore.isGenerating" class="flex min-h-[300px] flex-col items-center justify-center py-12 text-stone-500" data-testid="loading-state">
      <div class="w-9 h-9 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_24px_rgb(18_126_115_/_0.18)]"></div>
      <p class="px-3 text-center text-sm font-medium">图片生成中，请稍候...</p>
    </div>

    <div v-else-if="!generationStore.hasResults" class="flex min-h-[300px] flex-col items-center justify-center py-12 text-stone-500" data-testid="empty-state">
      <div class="mb-3 rounded-lg border border-stone-200 bg-stone-50/90 p-3 shadow-sm">
        <ImageIcon :size="32" class="text-teal-700" />
      </div>
      <p class="px-3 text-center text-sm font-semibold text-stone-700">暂无生成结果</p>
      <p class="mt-1 px-3 text-center text-xs text-stone-500">输入 Prompt 并点击生成按钮开始</p>
    </div>

    <template v-else>
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
        <h2 class="min-w-0 text-sm font-semibold text-stone-700">
          生成结果 ({{ generationStore.currentResults.length }})
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="downloadAll()"
            class="flex min-h-11 items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white/80 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 shadow-sm lg:min-h-8"
            type="button"
            data-testid="download-all-btn"
            aria-label="下载全部结果"
          >
            <DownloadCloud :size="14" />
            下载全部
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
            :alt="'生成结果 ' + (index + 1)"
            class="w-full aspect-square object-contain bg-[linear-gradient(135deg,#f7f1e7,#edf4f1)]"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-950/72 to-transparent p-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            <div class="flex items-center justify-center sm:justify-end gap-1">
              <button
                @click="downloadImage(index)"
                class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="'下载结果 ' + (index + 1)"
                data-testid="download-result-btn"
              >
                <Download :size="14" />
              </button>
              <button
                @click="copyImage(index)"
                class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="'复制结果 ' + (index + 1)"
                data-testid="copy-result-btn"
              >
                <Copy :size="14" />
              </button>
              <button
                @click="generationStore.removeResult(index)"
                class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fffdfa]/95 text-stone-700 hover:bg-white shadow lg:h-8 lg:w-8"
                type="button"
                :aria-label="'移除结果 ' + (index + 1)"
                data-testid="remove-result-btn"
              >
                <XIcon :size="14" />
              </button>
            </div>
          </div>
          <p v-if="result.revisedPrompt" class="border-t border-stone-100 px-2.5 py-1.5 text-xs text-stone-500 truncate" :title="result.revisedPrompt">
            {{ result.revisedPrompt }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
