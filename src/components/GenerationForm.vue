<script setup lang="ts">
import { useGenerationParamsStore } from '@/stores/generation-params'
import { RotateCcw } from '@lucide/vue'
import {
  IMAGE_SIZE_OPTIONS,
  IMAGE_QUALITIES,
  IMAGE_BACKGROUNDS,
  OUTPUT_FORMATS,
  MAX_IMAGE_COUNT,
  MIN_IMAGE_COUNT,
} from '@/types/generation'

const store = useGenerationParamsStore()

const qualityLabels: Record<string, string> = {
  auto: '自动',
  low: '低清',
  medium: '中等',
  high: '高清',
}
</script>

<template>
  <div class="generation-form space-y-4" data-testid="generation-form" aria-label="生成参数表单">
    <div>
      <label for="prompt-input" class="block text-sm font-semibold text-stone-700 mb-1.5">
        Prompt <span class="text-red-500">*</span>
      </label>
      <textarea
        id="prompt-input"
        :value="store.prompt"
        @input="store.prompt = ($event.target as HTMLTextAreaElement).value"
        placeholder="描述你想生成的图片..."
        rows="3"
        class="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm leading-6 focus:outline-none focus:ring-0 resize-y shadow-sm"
        data-testid="prompt-input"
      />
      <p v-if="store.promptError && store.prompt.length > 0" class="mt-1.5 text-xs font-medium text-red-600" data-testid="prompt-error">
        {{ store.promptError }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="size-select" class="block text-xs font-semibold text-stone-600 mb-1.5">尺寸</label>
        <select
          id="size-select"
          :value="store.size"
          @change="store.setSize(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="size-select"
        >
          <option v-for="option in IMAGE_SIZE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label for="count-input" class="block text-xs font-semibold text-stone-600 mb-1.5">数量 ({{ MIN_IMAGE_COUNT }}-{{ MAX_IMAGE_COUNT }})</label>
        <div class="flex items-center gap-1.5">
          <button
            @click="store.setCount(Math.max(MIN_IMAGE_COUNT, store.n - 1))"
            :disabled="store.n <= MIN_IMAGE_COUNT"
            class="h-9 w-9 rounded-lg border border-stone-300 bg-white/80 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            aria-label="减少数量"
          >-</button>
          <span class="min-w-10 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-center text-sm font-semibold text-stone-800" data-testid="count-display">{{ store.n }}</span>
          <button
            @click="store.setCount(Math.min(MAX_IMAGE_COUNT, store.n + 1))"
            :disabled="store.n >= MAX_IMAGE_COUNT"
            class="h-9 w-9 rounded-lg border border-stone-300 bg-white/80 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            aria-label="增加数量"
          >+</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="quality-select" class="block text-xs font-semibold text-stone-600 mb-1.5">质量</label>
        <select
          id="quality-select"
          :value="store.quality"
          @change="store.setQuality(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="quality-select"
        >
          <option v-for="q in IMAGE_QUALITIES" :key="q" :value="q">{{ qualityLabels[q] }}</option>
        </select>
      </div>

      <div>
        <label for="background-select" class="block text-xs font-semibold text-stone-600 mb-1.5">背景</label>
        <select
          id="background-select"
          :value="store.background"
          @change="store.setBackground(($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm"
          data-testid="background-select"
        >
          <option v-for="b in IMAGE_BACKGROUNDS" :key="b" :value="b">{{ b === 'auto' ? '自动' : b === 'transparent' ? '透明' : '不透明' }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="format-select" class="block text-xs font-semibold text-stone-600 mb-1.5">输出格式</label>
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
        <label for="compression-input" class="block text-xs font-semibold text-stone-600 mb-1.5">压缩 (0-100)</label>
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
        class="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        type="button"
        data-testid="reset-params-btn"
        aria-label="重置参数"
      >
        <RotateCcw :size="12" />
        重置参数
      </button>
    </div>
  </div>
</template>
