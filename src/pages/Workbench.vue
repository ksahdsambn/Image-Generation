<script setup lang="ts">
import { computed } from 'vue'
import { loadConfig } from '@/utils/config'
import { useApiKeyStore } from '@/stores/api-key'
import { useGenerationParamsStore } from '@/stores/generation-params'
import { useGenerationStore } from '@/stores/generation'
import ApiKeyInput from '@/components/ApiKeyInput.vue'
import GenerationForm from '@/components/GenerationForm.vue'
import ReferenceImages from '@/components/ReferenceImages.vue'
import MaskImageInput from '@/components/MaskImageInput.vue'
import ResultGrid from '@/components/ResultGrid.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import { Loader2, Sparkles } from '@lucide/vue'

const config = loadConfig()
const apiKeyStore = useApiKeyStore()
const paramsStore = useGenerationParamsStore()
const generationStore = useGenerationStore()

const canGenerate = computed(() => {
  return apiKeyStore.hasKey && paramsStore.canSubmit && !generationStore.isGenerating
})

async function handleGenerate() {
  await generationStore.generate(apiKeyStore, paramsStore)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
    <header v-if="config.configError" class="border-b border-red-200 bg-red-50 px-4 py-3">
      <p class="text-sm text-red-700 text-center">{{ config.configError }}</p>
    </header>

    <header v-else class="border-b border-gray-200 bg-white px-4 py-5">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-lg font-semibold text-gray-900 shrink-0">{{ config.appTitle }}</h1>
      </div>
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full p-4">
      <div class="lg:grid lg:grid-cols-[360px_minmax(0,1fr)_320px] xl:grid-cols-[360px_minmax(0,1fr)_340px] lg:gap-4">
        <section class="space-y-4 mb-4 lg:mb-0" aria-label="生成配置">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <GenerationForm />
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <ReferenceImages />
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <MaskImageInput />
          </div>
          <button
            @click="handleGenerate()"
            :disabled="!canGenerate"
            class="w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
            :class="canGenerate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'"
            data-testid="generate-btn"
            :aria-label="generationStore.isGenerating ? '正在生成' : '生成图片'"
          >
            <Loader2 v-if="generationStore.isGenerating" :size="18" class="animate-spin" />
            <Sparkles v-else :size="18" />
            {{ generationStore.isGenerating ? '生成中...' : '生成图片' }}
          </button>
        </section>

        <section class="mb-4 lg:mb-0" aria-label="生成结果">
          <div class="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px]">
            <ResultGrid />
          </div>
        </section>

        <section class="space-y-4" aria-label="密钥和本地历史" data-testid="right-rail">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <ApiKeyInput />
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <HistoryPanel />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
