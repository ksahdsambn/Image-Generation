<script setup lang="ts">
import { ref } from 'vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { validateImageFile, validateImageUrl } from '@/services/image-api'
import { Upload, X as XIcon } from '@lucide/vue'
import type { AppError } from '@/types/errors'

const store = useGenerationParamsStore()
const maskUrlInput = ref('')
const validationError = ref<AppError | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const err = validateImageFile(file)
  if (err) {
    validationError.value = err
    return
  }
  const previewUrl = URL.createObjectURL(file)
  store.setMaskImage({ file, previewUrl })
  validationError.value = null
  input.value = ''
}

function setMaskUrl() {
  const url = maskUrlInput.value.trim()
  if (!url) return
  const err = validateImageUrl(url)
  if (err) {
    validationError.value = err
    return
  }
  store.setMaskImage({ url })
  maskUrlInput.value = ''
  validationError.value = null
}

function clearMask() {
  if (store.maskImage?.previewUrl) {
    URL.revokeObjectURL(store.maskImage.previewUrl)
  }
  store.setMaskImage(null)
  validationError.value = null
}
</script>

<template>
  <div class="mask-image-input space-y-2" data-testid="mask-image-input" aria-label="遮罩图">
    <h3 class="text-sm font-medium text-gray-700">遮罩图 (可选)</h3>

    <div v-if="validationError" class="p-2 rounded-md bg-red-50 text-red-600 text-xs" data-testid="mask-validation-error">
      {{ validationError.userMessage }}
    </div>

    <div v-if="store.maskImage" class="flex items-center gap-2 p-2 rounded-md bg-gray-50" data-testid="mask-preview">
      <template v-if="store.maskImage.previewUrl">
        <img :src="store.maskImage.previewUrl" alt="遮罩图预览" class="w-10 h-10 object-cover rounded" />
      </template>
      <template v-else-if="store.maskImage.url">
        <span class="text-xs text-gray-600 truncate flex-1">{{ store.maskImage.url }}</span>
      </template>
      <button
        @click="clearMask()"
        class="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0"
        type="button"
        aria-label="移除遮罩图"
        data-testid="clear-mask-btn"
      >
        <XIcon :size="14" />
      </button>
    </div>

    <template v-if="!store.maskImage">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        class="hidden"
        @change="handleFileSelect"
        data-testid="mask-file-input"
      />
      <div class="flex gap-2">
        <button
          @click="fileInputRef?.click()"
          class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-gray-300 text-xs text-gray-500 hover:bg-gray-50"
          type="button"
          data-testid="upload-mask-btn"
          aria-label="上传遮罩图"
        >
          <Upload :size="12" />
          上传
        </button>
        <div class="flex gap-1 flex-1">
          <input
            v-model="maskUrlInput"
            type="url"
            placeholder="或输入 URL"
            class="flex-1 min-w-0 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="mask-url-input"
            @keydown.enter.prevent="setMaskUrl()"
          />
          <button
            @click="setMaskUrl()"
            :disabled="!maskUrlInput.trim()"
            class="px-2 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            data-testid="set-mask-url-btn"
          >
            确定
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
