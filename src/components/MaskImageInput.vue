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
  <div class="mask-image-input space-y-3" data-testid="mask-image-input" aria-label="遮罩图">
    <h3 class="text-sm font-semibold text-stone-700">遮罩图 (可选)</h3>

    <div v-if="validationError" class="p-2 rounded-lg border border-red-200 bg-red-50/90 text-red-700 text-xs" data-testid="mask-validation-error">
      {{ validationError.userMessage }}
    </div>

    <div v-if="store.maskImage" class="flex items-center gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50/90" data-testid="mask-preview">
      <template v-if="store.maskImage.previewUrl">
        <img :src="store.maskImage.previewUrl" alt="遮罩图预览" class="w-10 h-10 object-cover rounded-md border border-stone-200" />
      </template>
      <template v-else-if="store.maskImage.url">
        <span class="text-xs text-stone-600 truncate flex-1">{{ store.maskImage.url }}</span>
      </template>
      <button
        @click="clearMask()"
        class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-stone-200 text-stone-400 hover:text-stone-700 shrink-0"
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
      <div class="flex flex-col sm:flex-row gap-2">
        <button
          @click="fileInputRef?.click()"
          class="flex min-h-10 items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-stone-300 bg-white/80 text-xs font-medium text-stone-600 hover:bg-stone-100 shadow-sm"
          type="button"
          data-testid="upload-mask-btn"
          aria-label="上传遮罩图"
        >
          <Upload :size="12" />
          上传
        </button>
        <div class="flex gap-1.5 flex-1">
          <input
            v-model="maskUrlInput"
            type="url"
            placeholder="或输入 URL"
            class="flex-1 min-w-0 rounded-lg border border-stone-300 px-2.5 py-2 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="mask-url-input"
            @keydown.enter.prevent="setMaskUrl()"
          />
          <button
            @click="setMaskUrl()"
            :disabled="!maskUrlInput.trim()"
            class="min-w-12 px-2.5 py-2 rounded-lg border border-stone-300 bg-white/80 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
