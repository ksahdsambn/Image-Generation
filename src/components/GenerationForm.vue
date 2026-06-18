<script setup lang="ts">
import { useGenerationParamsStore } from '@/stores/generation-params'
import { RotateCcw } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_QUALITIES,
  IMAGE_BACKGROUNDS,
  OUTPUT_FORMATS,
  MAX_IMAGE_COUNT,
  MIN_IMAGE_COUNT,
} from '@/types/generation'
import SkillSelector from '@/components/SkillSelector.vue'

const store = useGenerationParamsStore()
const { t } = useI18n()

function qualityLabel(q: string): string {
  return t(`form.qualityOptions.${q}`)
}

function backgroundLabel(b: string): string {
  return t(`form.backgroundOptions.${b}`)
}
</script>

<template>
  <div class="generation-form min-w-0 space-y-4" data-testid="generation-form" :aria-label="t('form.ariaLabel')">
    <div>
      <label for="prompt-input" class="block text-sm font-semibold text-stone-700 mb-1.5">
        {{ t('form.promptLabel') }} <span class="text-red-700">*</span>
      </label>
      <textarea
        id="prompt-input"
        :value="store.prompt"
        @input="store.prompt = ($event.target as HTMLTextAreaElement).value"
        :placeholder="t('form.promptPlaceholder')"
        rows="3"
        class="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm leading-6 focus:outline-none focus:ring-0 resize-y shadow-sm"
        data-testid="prompt-input"
      />
      <p v-if="store.promptError && store.prompt.length > 0" class="mt-1.5 text-xs font-medium text-red-600 break-words" data-testid="prompt-error">
        {{ store.promptError }}
      </p>
    </div>

    <SkillSelector />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="size-select" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.size') }}</label>
        <select
          id="size-select"
          :value="store.size"
          @change="store.setSize(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="size-select"
        >
          <option v-for="option in IMAGE_SIZE_OPTIONS" :key="option.value" :value="option.value">
            {{ t(`form.sizeOptions.${option.labelKey}`) }}
          </option>
        </select>
      </div>

      <div>
        <label for="count-input" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.count', { min: MIN_IMAGE_COUNT, max: MAX_IMAGE_COUNT }) }}</label>
        <div class="flex min-w-0 items-center gap-1.5">
          <button
            @click="store.setCount(Math.max(MIN_IMAGE_COUNT, store.n - 1))"
            :disabled="store.n <= MIN_IMAGE_COUNT"
            class="h-11 w-11 lg:h-10 lg:w-10 rounded-lg border border-stone-300 bg-white/80 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            :aria-label="t('form.countDecrement')"
          >-</button>
          <span class="min-h-11 min-w-11 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-center text-sm font-semibold text-stone-800 lg:min-h-10" data-testid="count-display">{{ store.n }}</span>
          <button
            @click="store.setCount(Math.min(MAX_IMAGE_COUNT, store.n + 1))"
            :disabled="store.n >= MAX_IMAGE_COUNT"
            class="h-11 w-11 lg:h-10 lg:w-10 rounded-lg border border-stone-300 bg-white/80 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            :aria-label="t('form.countIncrement')"
          >+</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="quality-select" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.quality') }}</label>
        <select
          id="quality-select"
          :value="store.quality"
          @change="store.setQuality(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="quality-select"
        >
          <option v-for="q in IMAGE_QUALITIES" :key="q" :value="q">{{ qualityLabel(q) }}</option>
        </select>
      </div>

      <div>
        <label for="background-select" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.background') }}</label>
        <select
          id="background-select"
          :value="store.background"
          @change="store.setBackground(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="background-select"
        >
          <option v-for="b in IMAGE_BACKGROUNDS" :key="b" :value="b">{{ backgroundLabel(b) }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="format-select" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.outputFormat') }}</label>
        <select
          id="format-select"
          :value="store.outputFormat"
          @change="store.setOutputFormat(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="format-select"
        >
          <option v-for="f in OUTPUT_FORMATS" :key="f" :value="f">{{ f.toUpperCase() }}</option>
        </select>
      </div>

      <div v-if="store.compressionEnabled">
        <label for="compression-input" class="block text-xs font-semibold text-stone-600 mb-1.5">{{ t('form.compression') }}</label>
        <input
          id="compression-input"
          type="number"
          min="0"
          max="100"
          :value="store.outputCompression ?? 80"
          @input="store.setOutputCompression(Number(($event.target as HTMLInputElement).value))"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-0 shadow-sm"
          data-testid="compression-input"
        />
      </div>
    </div>

    <div class="pt-1.5">
      <button
        @click="store.resetParams()"
        class="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 lg:min-h-8"
        type="button"
        data-testid="reset-params-btn"
        :aria-label="t('form.resetParamsAriaLabel')"
      >
        <RotateCcw :size="12" aria-hidden="true" />
        {{ t('form.resetParams') }}
      </button>
    </div>
  </div>
</template>
