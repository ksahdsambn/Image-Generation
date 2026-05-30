<script setup lang="ts">
import { Copy, Download, Images, Trash2 } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  copyImageToClipboard,
  createPreviewImages,
  downloadBlob,
  revokePreviewImages,
  type ConvertedImageResult,
  type PreviewImageResult,
} from '@/utils/imageResult'

const props = defineProps<{
  images: ConvertedImageResult[]
  loading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  remove: [id: string]
  clear: []
}>()

const previews = ref<PreviewImageResult[]>([])
const notice = ref('')

const hasImages = computed(() => previews.value.length > 0)

watch(
  () => props.images,
  (images) => {
    revokePreviewImages(previews.value)
    previews.value = createPreviewImages(images)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokePreviewImages(previews.value)
})

function downloadImage(image: PreviewImageResult) {
  downloadBlob(image.blob, image.fileName)
}

function downloadAll() {
  previews.value.forEach((image) => downloadImage(image))
  notice.value = 'Download started for all current results.'
}

async function copyImage(image: PreviewImageResult) {
  try {
    const mode = await copyImageToClipboard(image.blob)
    notice.value = mode === 'image' ? 'Image copied to clipboard.' : 'Data URL copied to clipboard.'
  } catch {
    notice.value = 'Clipboard is unavailable. Download the image instead.'
  }
}
</script>

<template>
  <section aria-labelledby="current-results-title">
    <div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id="current-results-title" class="text-base font-semibold text-slate-900">Current results</h2>
        <p class="mt-1 text-sm text-slate-600">Preview, copy, or download images from the latest successful request.</p>
      </div>
      <button
        class="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        :disabled="!hasImages"
        aria-label="Download all current results"
        @click="downloadAll"
      >
        <Images class="size-4" aria-hidden="true" />
        Download all
      </button>
    </div>

    <div v-if="loading" class="mt-4 grid min-h-72 place-items-center rounded-md bg-slate-100 px-4 text-center text-sm text-slate-700" role="status">
      Generating images...
    </div>

    <div v-else-if="errorMessage" class="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
      {{ errorMessage }}
    </div>

    <div v-else-if="!hasImages" class="mt-4 grid min-h-72 place-items-center rounded-md bg-slate-100 px-4 text-center text-sm text-slate-600">
      Generated images will appear here.
    </div>

    <div v-else class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="image in previews"
        :key="image.id"
        class="overflow-hidden rounded-md border border-slate-200 bg-white"
      >
        <div class="aspect-square bg-slate-100">
          <img class="size-full object-contain" :src="image.objectUrl" :alt="`Generated image ${image.id}`" />
        </div>
        <div class="space-y-3 p-3">
          <p v-if="image.revisedPrompt" class="line-clamp-2 text-xs text-slate-600">{{ image.revisedPrompt }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              class="inline-grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100"
              type="button"
              :aria-label="`Download ${image.fileName}`"
              @click="downloadImage(image)"
            >
              <Download class="size-4" aria-hidden="true" />
            </button>
            <button
              class="inline-grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100"
              type="button"
              :aria-label="`Copy ${image.fileName}`"
              @click="copyImage(image)"
            >
              <Copy class="size-4" aria-hidden="true" />
            </button>
            <button
              class="inline-grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100"
              type="button"
              :aria-label="`Remove ${image.fileName}`"
              @click="emit('remove', image.id)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <p v-if="notice" class="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
      {{ notice }}
    </p>
  </section>
</template>
