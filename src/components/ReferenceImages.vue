<script setup lang="ts">
import { ref } from 'vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { validateImageFile, validateImageUrl } from '@/services/image-api'
import { Upload, X as XIcon, Link, Plus, AlertTriangle } from '@lucide/vue'
import type { AppError } from '@/types/errors'

const store = useGenerationParamsStore()
const urlInput = ref('')
const validationError = ref<AppError | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  for (const file of Array.from(input.files)) {
    const err = validateImageFile(file)
    if (err) {
      validationError.value = err
      return
    }
    const previewUrl = URL.createObjectURL(file)
    store.addLocalImage({ file, previewUrl })
  }
  validationError.value = null
  input.value = ''
}

function removeImage(index: number) {
  const img = store.localImages[index]
  if (img.previewUrl) {
    URL.revokeObjectURL(img.previewUrl)
  }
  store.removeLocalImage(index)
}

function addUrl() {
  const url = urlInput.value.trim()
  if (!url) return
  const err = validateImageUrl(url)
  if (err) {
    validationError.value = err
    return
  }
  store.addWebImageUrl(url)
  urlInput.value = ''
  validationError.value = null
}

function removeUrl(index: number) {
  store.removeWebImageUrl(index)
}
</script>

<template>
  <div class="reference-images space-y-3" data-testid="reference-images" aria-label="参考图和网页图片">
    <h3 class="text-sm font-medium text-gray-700">参考图</h3>

    <div v-if="store.hasMixedRefSources" class="flex items-center gap-2 p-2 rounded-md bg-amber-50 text-amber-700 text-xs" data-testid="mix-conflict-warning">
      <AlertTriangle :size="14" class="shrink-0" />
      <span>不能同时使用本地上传和网页图片 URL，请选择其中一种</span>
    </div>

    <div v-if="validationError" class="p-2 rounded-md bg-red-50 text-red-600 text-xs" data-testid="validation-error">
      {{ validationError.userMessage }}
    </div>

    <div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        class="hidden"
        @change="handleFileSelect"
        data-testid="file-input"
      />
      <button
        @click="fileInputRef?.click()"
        :disabled="store.hasWebImageUrls"
        class="w-full flex items-center justify-center gap-2 py-2 rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        data-testid="upload-btn"
        aria-label="上传本地参考图"
      >
        <Upload :size="16" />
        上传参考图
      </button>
    </div>

    <div v-if="store.localImages.length > 0" class="flex flex-wrap gap-2" data-testid="local-image-previews">
      <div
        v-for="(img, index) in store.localImages"
        :key="index"
        class="relative group w-16 h-16 rounded-md overflow-hidden border border-gray-200"
      >
        <img :src="img.previewUrl" alt="参考图预览" class="w-full h-full object-cover" />
        <button
          @click="removeImage(index)"
          class="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
          :aria-label="'移除参考图 ' + (index + 1)"
        >
          <XIcon :size="10" />
        </button>
      </div>
    </div>

    <div class="border-t border-gray-100 pt-3">
      <p class="text-xs text-gray-500 mb-2">或使用网页图片 URL</p>
      <div class="flex gap-1">
        <input
          v-model="urlInput"
          type="url"
          placeholder="https://example.com/image.png"
          :disabled="store.hasLocalImages"
          class="flex-1 min-w-0 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          data-testid="url-input"
          @keydown.enter.prevent="addUrl"
        />
        <button
          @click="addUrl"
          :disabled="!urlInput.trim() || store.hasLocalImages"
          class="px-2 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          data-testid="add-url-btn"
          aria-label="添加图片 URL"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>

    <div v-if="store.webImageUrls.length > 0" class="space-y-1" data-testid="web-url-list">
      <div
        v-for="(item, index) in store.webImageUrls"
        :key="index"
        class="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
      >
        <Link :size="10" class="shrink-0 text-gray-400" />
        <span class="truncate flex-1 min-w-0">{{ item.url }}</span>
        <button
          @click="removeUrl(index)"
          class="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0"
          type="button"
          :aria-label="'移除 URL ' + (index + 1)"
        >
          <XIcon :size="10" />
        </button>
      </div>
    </div>
  </div>
</template>
