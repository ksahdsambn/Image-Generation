<script setup lang="ts">
import { ref } from 'vue'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { validateImageFile, validateImageUrl } from '@/services/image-api'
import { Upload, X as XIcon, Link, Plus, AlertTriangle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { AppError } from '@/types/errors'

const store = useGenerationParamsStore()
const { t } = useI18n()
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
  <div class="reference-images min-w-0 space-y-3.5" data-testid="reference-images" :aria-label="t('reference.ariaLabel')">
    <h3 class="text-sm font-semibold text-stone-700">{{ t('reference.title') }}</h3>

    <div v-if="store.hasMixedRefSources" class="flex min-w-0 items-center gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50/90 text-amber-800 text-xs" data-testid="mix-conflict-warning" role="alert" aria-live="polite">
      <AlertTriangle :size="14" class="shrink-0" aria-hidden="true" />
      <span class="min-w-0 break-words">{{ t('reference.mixConflictWarning') }}</span>
    </div>

    <div v-if="validationError" class="p-2 rounded-lg border border-red-200 bg-red-50/90 text-red-700 text-xs break-words" data-testid="validation-error" role="alert" aria-live="assertive">
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
        :aria-label="t('reference.fileInputAriaLabel')"
      />
      <button
        @click="fileInputRef?.click()"
        :disabled="store.hasWebImageUrls"
        class="w-full flex min-h-11 items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-stone-300 text-sm font-medium text-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        data-testid="upload-btn"
        :aria-label="t('reference.uploadAriaLabel')"
      >
        <Upload :size="16" aria-hidden="true" />
        {{ t('reference.uploadButton') }}
      </button>
    </div>

    <div v-if="store.localImages.length > 0" class="flex flex-wrap gap-2.5" data-testid="local-image-previews">
      <div
        v-for="(img, index) in store.localImages"
        :key="index"
        class="relative group w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shadow-sm"
      >
        <img
          :src="img.previewUrl"
          :alt="t('reference.previewAlt', { index: index + 1 })"
          width="64"
          height="64"
          decoding="async"
          loading="lazy"
          class="w-full h-full object-cover"
        />
        <button
          @click="removeImage(index)"
          class="absolute top-0.5 right-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-stone-950/70 text-white opacity-100 transition-opacity lg:h-7 lg:w-7 lg:opacity-0 lg:group-hover:opacity-100"
          type="button"
          :aria-label="t('reference.removeAriaLabel', { index: index + 1 })"
        >
          <XIcon :size="12" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="border-t border-stone-200/80 pt-3">
      <p class="text-xs font-medium text-stone-600 mb-2">{{ t('reference.webUrlSection') }}</p>
      <div class="flex min-w-0 gap-1.5">
        <input
          v-model="urlInput"
          type="url"
          :placeholder="t('reference.urlPlaceholder')"
          :disabled="store.hasLocalImages"
          class="flex-1 min-w-0 rounded-lg border border-stone-300 px-2.5 py-2 text-xs focus:outline-none focus:ring-0 disabled:opacity-50 shadow-sm"
          data-testid="url-input"
          :aria-label="t('reference.urlAriaLabel')"
          @keydown.enter.prevent="addUrl"
        />
        <button
          @click="addUrl"
          :disabled="!urlInput.trim() || store.hasLocalImages"
          class="min-h-11 min-w-11 px-2.5 py-2 rounded-lg border border-stone-300 bg-white/80 text-xs text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm lg:min-h-10"
          type="button"
          data-testid="add-url-btn"
          :aria-label="t('reference.addUrlAriaLabel')"
        >
          <Plus :size="14" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="store.webImageUrls.length > 0" class="space-y-1.5" data-testid="web-url-list">
      <div
        v-for="(item, index) in store.webImageUrls"
        :key="index"
        class="flex min-w-0 items-center gap-1.5 text-xs text-stone-600 bg-stone-50/90 rounded-lg border border-stone-200 px-2 py-1.5"
      >
        <Link :size="10" class="shrink-0 text-teal-700" aria-hidden="true" />
        <span class="truncate flex-1 min-w-0" :title="item.url">{{ item.url }}</span>
        <button
          @click="removeUrl(index)"
          class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-200 text-stone-600 hover:text-stone-800 shrink-0 lg:h-7 lg:w-7"
          type="button"
          :aria-label="t('reference.removeUrlAriaLabel', { index: index + 1 })"
        >
          <XIcon :size="12" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
