<script setup lang="ts">
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'
import CurrentResultsPanel from '@/components/CurrentResultsPanel.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import GenerationParamsPanel from '@/components/GenerationParamsPanel.vue'
import LocalHistoryPanel from '@/components/LocalHistoryPanel.vue'
import { getRuntimeConfig } from '@/config/appConfig'
import { isAppError } from '@/services/imageApi'
import { runGenerationWorkflow } from '@/services/generationWorkflow'
import { createImageApiClient } from '@/services/imageApi'
import { onMounted, ref } from 'vue'
import { useApiKeyStore } from '@/stores/apiKeyStore'
import { useGenerationParamsStore } from '@/stores/generationParamsStore'
import {
  clearHistory,
  deleteHistoryRecord,
  getHistoryRecord,
  isHistoryDbAvailable,
  listHistory,
  saveGeneratedImagesToHistory,
} from '@/storage/historyDb'
import type { NormalizedGenerationParams } from '@/types/generation'
import type { ImageHistoryListItem } from '@/types/history'
import { downloadBlob, type ConvertedImageResult } from '@/utils/imageResult'

const runtimeConfig = getRuntimeConfig()
const appTitle = runtimeConfig.config.appTitle
const currentResults = ref<ConvertedImageResult[]>([])
const isGenerating = ref(false)
const historyItems = ref<ImageHistoryListItem[]>([])
const historyUnavailable = ref(false)
const historySearch = ref('')
const historyDate = ref('')
const resultError = ref('')
const statusNotice = ref('')
const apiKeyStore = useApiKeyStore()
const paramsStore = useGenerationParamsStore()

function removeCurrentResult(id: string) {
  currentResults.value = currentResults.value.filter((image) => image.id !== id)
}

async function handleGenerate(params: NormalizedGenerationParams) {
  if (!runtimeConfig.ok || !apiKeyStore.hasApiKey || isGenerating.value) {
    return
  }

  isGenerating.value = true
  resultError.value = ''
  statusNotice.value = ''

  try {
    const client = createImageApiClient({
      baseUrl: runtimeConfig.config.sub2ApiBaseUrl,
      apiKey: apiKeyStore.apiKey,
    })
    const result = await runGenerationWorkflow({
      client,
      params,
      saveHistory: (images, normalizedParams) => saveGeneratedImagesToHistory(images, normalizedParams),
    })

    currentResults.value = result.images
    if (result.historyError) {
      statusNotice.value = result.historyError.message
    } else {
      statusNotice.value = 'Images saved to local history.'
      await loadHistory()
    }
  } catch (error) {
    resultError.value = isAppError(error) ? error.message : '生成失败，请稍后重试。'
  } finally {
    isGenerating.value = false
  }
}

async function loadHistory() {
  if (historyUnavailable.value) {
    return
  }

  historyItems.value = await listHistory({
    search: historySearch.value,
    date: historyDate.value,
  })
}

async function initializeHistory() {
  historyUnavailable.value = !(await isHistoryDbAvailable())
  if (!historyUnavailable.value) {
    await loadHistory()
  }
}

async function handleHistorySearch(value: string) {
  historySearch.value = value
  await loadHistory()
}

async function handleHistoryDate(value: string) {
  historyDate.value = value
  await loadHistory()
}

function reloadHistoryParams(item: ImageHistoryListItem) {
  paramsStore.loadSerializedParams(item.params)
}

async function downloadHistoryImage(item: ImageHistoryListItem) {
  const record = await getHistoryRecord(item.id)
  if (!record) {
    return
  }

  downloadBlob(record.imageBlob, `gpt-image-2-history-${record.createdAt}.${record.outputFormat}`)
}

async function removeHistoryItem(id: string) {
  await deleteHistoryRecord(id)
  await loadHistory()
}

async function clearLocalHistory() {
  await clearHistory()
  historyItems.value = []
}

onMounted(() => {
  void initializeHistory()
})
</script>

<template>
  <main class="min-h-screen bg-stone-50 text-slate-950">
    <section class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sub2API Workspace</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{{ appTitle }}</h1>
        </div>
        <ApiKeyPanel
          :remember-key-enabled="runtimeConfig.config.rememberKeyEnabled"
          :sub2-api-base-url="runtimeConfig.config.sub2ApiBaseUrl"
          :can-test-connection="runtimeConfig.ok"
        />
      </header>

      <section v-if="!runtimeConfig.ok" class="mt-5">
        <ErrorAlert title="Configuration error" :message="runtimeConfig.errors.join(' ')" />
      </section>

      <div class="grid flex-1 gap-6 py-6 lg:grid-cols-[360px_1fr_320px]">
        <aside class="rounded-md border border-slate-200 bg-white p-4">
          <h2 class="text-base font-semibold text-slate-900">Generation parameters</h2>
          <div class="mt-4">
            <GenerationParamsPanel
              :can-generate="apiKeyStore.hasApiKey && runtimeConfig.ok"
              :is-generating="isGenerating"
              @submit="handleGenerate"
            />
          </div>
        </aside>

        <section class="min-h-96 rounded-md border border-slate-200 bg-white p-4">
          <CurrentResultsPanel
            :images="currentResults"
            :loading="isGenerating"
            :error-message="resultError"
            @remove="removeCurrentResult"
            @clear="currentResults = []"
          />
          <p v-if="statusNotice" class="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
            {{ statusNotice }}
          </p>
        </section>

        <aside class="rounded-md border border-slate-200 bg-white p-4">
          <LocalHistoryPanel
            :items="historyItems"
            :unavailable="historyUnavailable"
            :search="historySearch"
            :date="historyDate"
            @search="handleHistorySearch"
            @date="handleHistoryDate"
            @reload="reloadHistoryParams"
            @download="downloadHistoryImage"
            @delete="removeHistoryItem"
            @clear="clearLocalHistory"
          />
        </aside>
      </div>
    </section>
  </main>
</template>
