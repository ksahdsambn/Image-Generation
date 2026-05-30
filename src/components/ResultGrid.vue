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
    <div v-if="generationStore.error" class="p-3 rounded-md bg-red-50 text-red-700 text-sm" data-testid="error-state">
      <div class="flex items-start gap-2">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" />
        <span>{{ generationStore.error.userMessage }}</span>
      </div>
    </div>

    <div v-else-if="generationStore.isGenerating" class="flex flex-col items-center justify-center py-12 text-gray-400" data-testid="loading-state">
      <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm">图片生成中，请稍候...</p>
    </div>

    <div v-else-if="!generationStore.hasResults" class="flex flex-col items-center justify-center py-12 text-gray-400" data-testid="empty-state">
      <ImageIcon :size="32" class="mb-2" />
      <p class="text-sm">暂无生成结果</p>
      <p class="text-xs mt-1">输入 Prompt 并点击生成按钮开始</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-medium text-gray-700">
          生成结果 ({{ generationStore.currentResults.length }})
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="downloadAll()"
            class="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 hover:bg-gray-100"
            type="button"
            data-testid="download-all-btn"
            aria-label="下载全部结果"
          >
            <DownloadCloud :size="14" />
            下载全部
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="result-images">
        <div
          v-for="(result, index) in generationStore.currentResults"
          :key="index"
          class="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
        >
          <img
            :src="result.objectUrl"
            :alt="'生成结果 ' + (index + 1)"
            class="w-full aspect-square object-contain bg-gray-50"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="flex items-center justify-end gap-1">
              <button
                @click="downloadImage(index)"
                class="p-1.5 rounded-md bg-white/90 text-gray-700 hover:bg-white"
                type="button"
                :aria-label="'下载结果 ' + (index + 1)"
                data-testid="download-result-btn"
              >
                <Download :size="14" />
              </button>
              <button
                @click="copyImage(index)"
                class="p-1.5 rounded-md bg-white/90 text-gray-700 hover:bg-white"
                type="button"
                :aria-label="'复制结果 ' + (index + 1)"
                data-testid="copy-result-btn"
              >
                <Copy :size="14" />
              </button>
              <button
                @click="generationStore.removeResult(index)"
                class="p-1.5 rounded-md bg-white/90 text-gray-700 hover:bg-white"
                type="button"
                :aria-label="'移除结果 ' + (index + 1)"
                data-testid="remove-result-btn"
              >
                <XIcon :size="14" />
              </button>
            </div>
          </div>
          <p v-if="result.revisedPrompt" class="px-2 py-1 text-xs text-gray-500 truncate" :title="result.revisedPrompt">
            {{ result.revisedPrompt }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
