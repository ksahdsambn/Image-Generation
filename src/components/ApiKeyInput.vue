<script setup lang="ts">
import { useApiKeyStore } from '@/stores/api-key'
import { useConnectionStore } from '@/stores/connection'
import { Eye, EyeOff, X as XIcon, KeyRound, Wifi, WifiOff, Loader2, CheckCircle2 } from '@lucide/vue'
import { loadConfig } from '@/utils/config'
import { useI18n } from 'vue-i18n'

const apiKeyStore = useApiKeyStore()
const connectionStore = useConnectionStore()
const config = loadConfig()
const rememberEnabled = config.rememberKeyEnabled
const { t } = useI18n()

async function handleTestConnection() {
  if (!apiKeyStore.hasKey) return
  await connectionStore.runTest(apiKeyStore.apiKey)
}
</script>

<template>
  <div class="api-key-area min-w-0" data-testid="api-key-area" :aria-label="t('apikey.areaAriaLabel')">
    <div class="flex min-w-0 items-center gap-2">
      <KeyRound :size="16" class="text-teal-700 shrink-0" aria-hidden="true" />
      <div class="relative flex-1 min-w-0">
        <input
          ref="_inputRef"
          :type="apiKeyStore.visible ? 'text' : 'password'"
          :value="apiKeyStore.apiKey"
          @input="apiKeyStore.setApiKey(($event.target as HTMLInputElement).value); connectionStore.reset()"
          :placeholder="t('apikey.placeholder')"
          class="w-full rounded-lg border border-stone-300 bg-stone-50/80 px-3 py-2 pr-24 text-sm focus:outline-none focus:ring-0 shadow-sm lg:pr-16"
          data-testid="api-key-input"
          :aria-label="t('apikey.inputAriaLabel')"
        />
        <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            @click="apiKeyStore.toggleVisible()"
            class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-200/80 text-stone-600 hover:text-stone-900 lg:h-7 lg:w-7"
            :aria-label="apiKeyStore.visible ? t('apikey.toggleVisibleHide') : t('apikey.toggleVisibleShow')"
            data-testid="toggle-visible-btn"
            type="button"
          >
            <EyeOff v-if="apiKeyStore.visible" :size="14" aria-hidden="true" />
            <Eye v-else :size="14" aria-hidden="true" />
          </button>
          <button
            v-if="apiKeyStore.hasKey"
            @click="apiKeyStore.clearApiKey(); connectionStore.reset()"
            class="flex h-11 w-11 items-center justify-center rounded-md hover:bg-stone-200/80 text-stone-600 hover:text-stone-900 lg:h-7 lg:w-7"
            :aria-label="t('apikey.clear')"
            data-testid="clear-key-btn"
            type="button"
          >
            <XIcon :size="14" aria-hidden="true" />
          </button>
        </div>
      </div>
      <button
        v-if="apiKeyStore.hasKey"
        @click="handleTestConnection()"
        :disabled="connectionStore.status === 'testing'"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white/80 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm lg:h-10 lg:w-10"
        :aria-label="connectionStore.status === 'testing' ? t('apikey.testConnectionInProgress') : t('apikey.testConnection')"
        data-testid="test-connection-btn"
        type="button"
      >
        <Loader2 v-if="connectionStore.status === 'testing'" :size="14" class="animate-spin text-teal-700" aria-hidden="true" />
        <CheckCircle2 v-else-if="connectionStore.status === 'connected'" :size="14" class="text-green-700" aria-hidden="true" />
        <WifiOff v-else-if="connectionStore.status === 'error'" :size="14" class="text-red-700" aria-hidden="true" />
        <Wifi v-else :size="14" class="text-stone-600" aria-hidden="true" />
      </button>
    </div>
    <div v-if="connectionStore.status === 'connected'" class="mt-2 rounded-md border border-green-200 bg-green-50/90 px-2 py-1 text-xs font-medium text-green-800 break-words" data-testid="connection-ok" role="status" aria-live="polite">
      {{ t('apikey.connected') }}
    </div>
    <div v-if="connectionStore.status === 'error' && connectionStore.error" class="mt-2 rounded-md border border-red-200 bg-red-50/90 px-2 py-1 text-xs font-medium text-red-700 break-words" data-testid="connection-error" role="alert" aria-live="assertive">
      {{ connectionStore.error.userMessage }}
    </div>
    <div v-if="rememberEnabled" class="mt-2 flex flex-wrap items-center gap-2">
      <label class="flex min-h-11 min-w-0 items-center gap-1.5 text-xs font-medium text-stone-600 cursor-pointer lg:min-h-8">
        <input
          type="checkbox"
          :checked="apiKeyStore.rememberKey"
          @change="apiKeyStore.setRememberKey(($event.target as HTMLInputElement).checked)"
          class="h-5 w-5 rounded border-stone-300 text-teal-700 focus:ring-teal-700"
          data-testid="remember-key-checkbox"
        />
        {{ t('apikey.rememberKey') }}
      </label>
      <span
        v-if="apiKeyStore.rememberKey"
        class="min-w-0 text-xs font-medium text-amber-800 break-words"
        data-testid="remember-risk-hint"
        role="status"
        aria-live="polite"
      >
        {{ t('apikey.riskHint') }}
      </span>
    </div>
  </div>
</template>
