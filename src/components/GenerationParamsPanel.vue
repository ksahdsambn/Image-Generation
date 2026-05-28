<script setup lang="ts">
import { RotateCcw, Send, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useGenerationParamsStore } from '@/stores/generationParamsStore'
import {
  MAX_IMAGE_COUNT,
  MIN_IMAGE_COUNT,
  SUPPORTED_BACKGROUNDS,
  SUPPORTED_IMAGE_QUALITIES,
  SUPPORTED_IMAGE_SIZES,
  SUPPORTED_OUTPUT_FORMATS,
  supportsOutputCompression,
  type NormalizedGenerationParams,
} from '@/types/generation'

const emit = defineEmits<{
  submit: [params: NormalizedGenerationParams]
}>()

const paramsStore = useGenerationParamsStore()
const imageUrlDraft = ref('')

const compressionEnabled = computed(() => supportsOutputCompression(paramsStore.outputFormat))

function handleSubmit() {
  const validation = paramsStore.validation
  if (!validation.ok) {
    return
  }

  emit('submit', validation.params)
}

function handleReferenceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  files.forEach((file) => paramsStore.addReferenceImage(file))
  input.value = ''
}

function handleMaskInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  paramsStore.setMaskImage(file)
  input.value = ''
}

function addImageUrl() {
  paramsStore.addImageUrl(imageUrlDraft.value)
  imageUrlDraft.value = ''
}
</script>

<template>
  <form class="space-y-5" aria-label="Generation parameters" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <label class="text-sm font-medium text-slate-900" for="prompt-input">Prompt</label>
      <textarea
        id="prompt-input"
        class="min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        :value="paramsStore.prompt"
        aria-label="Prompt"
        placeholder="Describe the image to generate"
        @input="paramsStore.setPrompt(($event.target as HTMLTextAreaElement).value)"
      />
      <p v-if="!paramsStore.trimmedPrompt" class="text-xs text-amber-800">Prompt is required before submitting.</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <label class="space-y-2 text-sm font-medium text-slate-900">
        <span>Size</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          :value="paramsStore.size"
          aria-label="Image size"
          @change="paramsStore.setSize(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="size in SUPPORTED_IMAGE_SIZES" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>

      <label class="space-y-2 text-sm font-medium text-slate-900">
        <span>Count</span>
        <input
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          type="number"
          :min="MIN_IMAGE_COUNT"
          :max="MAX_IMAGE_COUNT"
          :value="paramsStore.count"
          aria-label="Image count"
          @input="paramsStore.setCount(Number(($event.target as HTMLInputElement).value))"
        />
      </label>

      <label class="space-y-2 text-sm font-medium text-slate-900">
        <span>Quality</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          :value="paramsStore.quality"
          aria-label="Image quality"
          @change="paramsStore.setQuality(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="quality in SUPPORTED_IMAGE_QUALITIES" :key="quality" :value="quality">{{ quality }}</option>
        </select>
      </label>

      <label class="space-y-2 text-sm font-medium text-slate-900">
        <span>Background</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          :value="paramsStore.background"
          aria-label="Image background"
          @change="paramsStore.setBackground(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="background in SUPPORTED_BACKGROUNDS" :key="background" :value="background">
            {{ background }}
          </option>
        </select>
      </label>

      <label class="space-y-2 text-sm font-medium text-slate-900">
        <span>Output format</span>
        <select
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          :value="paramsStore.outputFormat"
          aria-label="Output format"
          @change="paramsStore.setOutputFormat(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="format in SUPPORTED_OUTPUT_FORMATS" :key="format" :value="format">{{ format }}</option>
        </select>
      </label>

      <label class="space-y-2 text-sm font-medium text-slate-900" :class="{ 'opacity-60': !compressionEnabled }">
        <span>Compression</span>
        <input
          class="w-full accent-emerald-700"
          type="range"
          min="0"
          max="100"
          :disabled="!compressionEnabled"
          :value="paramsStore.outputCompression ?? 0"
          aria-label="Output compression"
          @input="paramsStore.setOutputCompression(Number(($event.target as HTMLInputElement).value))"
        />
        <span class="block text-xs text-slate-600">{{ compressionEnabled ? paramsStore.outputCompression : 'Disabled' }}</span>
      </label>
    </div>

    <div class="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <label class="block text-sm font-medium text-slate-900" for="reference-input">Local reference images</label>
      <input
        id="reference-input"
        class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:text-white"
        type="file"
        accept="image/*"
        multiple
        aria-label="Reference images"
        @change="handleReferenceInput"
      />
      <ul v-if="paramsStore.referenceImages.length" class="space-y-2">
        <li v-for="image in paramsStore.referenceImages" :key="image.id" class="flex items-center justify-between gap-2 text-sm text-slate-700">
          <span class="min-w-0 truncate">{{ image.name }}</span>
          <button
            class="inline-grid size-8 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700"
            type="button"
            :aria-label="`Remove ${image.name}`"
            @click="paramsStore.removeReferenceImage(image.id)"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>

    <div class="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <label class="block text-sm font-medium text-slate-900" for="image-url-input">Web image URLs</label>
      <div class="flex min-w-0 gap-2">
        <input
          id="image-url-input"
          v-model="imageUrlDraft"
          class="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          type="url"
          aria-label="Image URL"
          placeholder="https://example.com/image.png"
        />
        <button class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700" type="button" @click="addImageUrl">
          Add
        </button>
      </div>
      <ul v-if="paramsStore.imageUrls.length" class="space-y-2">
        <li v-for="url in paramsStore.imageUrls" :key="url" class="flex items-center justify-between gap-2 text-sm text-slate-700">
          <span class="min-w-0 truncate">{{ url }}</span>
          <button
            class="inline-grid size-8 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700"
            type="button"
            :aria-label="`Remove ${url}`"
            @click="paramsStore.removeImageUrl(url)"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>

    <div class="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <label class="block text-sm font-medium text-slate-900" for="mask-input">Mask</label>
      <input
        id="mask-input"
        class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:text-white"
        type="file"
        accept="image/*"
        aria-label="Mask image"
        @change="handleMaskInput"
      />
      <input
        class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
        type="url"
        :value="paramsStore.maskImageUrl"
        aria-label="Mask URL"
        placeholder="Optional mask URL"
        @input="paramsStore.setMaskImageUrl(($event.target as HTMLInputElement).value)"
      />
      <p v-if="paramsStore.maskImage" class="truncate text-sm text-slate-700">Local mask: {{ paramsStore.maskImage.name }}</p>
    </div>

    <div v-if="!paramsStore.validation.ok" class="rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="status">
      {{ paramsStore.validation.errors[0] }}
    </div>

    <div class="flex flex-col gap-2 sm:flex-row">
      <button
        class="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        type="submit"
        :disabled="!paramsStore.canSubmit"
      >
        <Send class="size-4" aria-hidden="true" />
        Generate
      </button>
      <button
        class="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        type="button"
        aria-label="Reset parameters"
        @click="paramsStore.resetParams()"
      >
        <RotateCcw class="size-4" aria-hidden="true" />
        Reset
      </button>
    </div>
  </form>
</template>
