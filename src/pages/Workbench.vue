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
  <div class="studio-shell min-h-screen text-stone-950 flex flex-col">
    <header v-if="config.configError" class="border-b border-red-200 bg-red-50/95 px-4 py-3 shadow-sm">
      <p class="text-sm font-medium text-red-700 text-center break-words">{{ config.configError }}</p>
    </header>

    <header v-else class="studio-topbar sticky top-0 z-20 border-b px-4 py-4">
      <div class="max-w-7xl mx-auto flex min-w-0 items-center justify-between gap-4">
        <h1 class="studio-title min-w-0 flex-1 truncate text-lg sm:flex-none sm:text-xl font-semibold">{{ config.appTitle }}</h1>
        <div class="hidden sm:flex items-center gap-2 text-xs font-medium text-stone-600">
          <span class="h-2 w-2 rounded-full bg-teal-600 shadow-[0_0_0_4px_rgb(18_126_115_/_0.12)]" aria-hidden="true"></span>
          GPT Image Studio
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-5">
      <div class="lg:grid lg:grid-cols-[360px_minmax(0,1fr)_320px] xl:grid-cols-[360px_minmax(0,1fr)_340px] lg:gap-5">
        <section class="space-y-4 mb-4 lg:mb-0 min-w-0" aria-label="生成配置">
          <div class="studio-card p-3.5 sm:p-4">
            <GenerationForm />
          </div>
          <div class="studio-card p-3.5 sm:p-4">
            <ReferenceImages />
          </div>
          <div class="studio-card p-3.5 sm:p-4">
            <MaskImageInput />
          </div>
          <button
            @click="handleGenerate()"
            :disabled="!canGenerate"
            class="studio-primary-button w-full min-h-11 py-2.5 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
            :class="[
              generationStore.isGenerating
                ? 'bg-[#d95c35] text-white cursor-progress border-[#d95c35]'
                : canGenerate
                  ? 'bg-[#d95c35] hover:bg-[#c84f2d]'
                  : 'bg-stone-300 text-stone-600 cursor-not-allowed border-stone-300',
              generationStore.isGenerating ? 'is-generating' : '',
            ]"
            data-testid="generate-btn"
            :aria-label="generationStore.isGenerating ? '正在生成' : '生成图片'"
          >
            <Loader2 v-if="generationStore.isGenerating" :size="18" class="animate-spin" aria-hidden="true" />
            <Sparkles v-else :size="18" aria-hidden="true" />
            {{ generationStore.isGenerating ? '生成中...' : '生成图片' }}
          </button>
        </section>

        <section class="mb-4 lg:mb-0 min-w-0" aria-label="生成结果">
          <div class="studio-card p-3.5 sm:p-4 min-h-[320px] sm:min-h-[360px] min-w-0">
            <ResultGrid />
          </div>
        </section>

        <section class="space-y-4 min-w-0" aria-label="密钥和本地历史" data-testid="right-rail">
          <div class="studio-card p-3.5 sm:p-4">
            <ApiKeyInput />
          </div>
          <div class="studio-card p-3.5 sm:p-4">
            <HistoryPanel />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
