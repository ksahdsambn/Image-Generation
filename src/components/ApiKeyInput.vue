<script setup lang="ts">
import { useApiKeyStore } from '@/stores/api-key'
import { useConnectionStore } from '@/stores/connection'
import { Eye, EyeOff, X as XIcon, KeyRound, Wifi, WifiOff, Loader2, CheckCircle2 } from '@lucide/vue'
import { loadConfig } from '@/utils/config'

const apiKeyStore = useApiKeyStore()
const connectionStore = useConnectionStore()
const config = loadConfig()
const rememberEnabled = config.rememberKeyEnabled

async function handleTestConnection() {
  if (!apiKeyStore.hasKey) return
  await connectionStore.runTest(apiKeyStore.apiKey)
}
</script>

<template>
  <div class="api-key-area" data-testid="api-key-area" aria-label="API 密钥配置">
    <div class="flex items-center gap-2">
      <KeyRound :size="16" class="text-teal-700 shrink-0" aria-hidden="true" />
      <div class="relative flex-1 min-w-0">
        <input
          ref="_inputRef"
          :type="apiKeyStore.visible ? 'text' : 'password'"
          :value="apiKeyStore.apiKey"
          @input="apiKeyStore.setApiKey(($event.target as HTMLInputElement).value); connectionStore.reset()"
          placeholder="输入 API Key"
          class="w-full rounded-lg border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-0 shadow-sm"
          data-testid="api-key-input"
          aria-label="API 密钥"
        />
        <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            @click="apiKeyStore.toggleVisible()"
            class="p-1 rounded-md hover:bg-stone-200/80 text-stone-500 hover:text-stone-800"
            :aria-label="apiKeyStore.visible ? '隐藏密钥' : '显示密钥'"
            data-testid="toggle-visible-btn"
            type="button"
          >
            <EyeOff v-if="apiKeyStore.visible" :size="14" />
            <Eye v-else :size="14" />
          </button>
          <button
            v-if="apiKeyStore.hasKey"
            @click="apiKeyStore.clearApiKey(); connectionStore.reset()"
            class="p-1 rounded-md hover:bg-stone-200/80 text-stone-500 hover:text-stone-800"
            aria-label="清除密钥"
            data-testid="clear-key-btn"
            type="button"
          >
            <XIcon :size="14" />
          </button>
        </div>
      </div>
      <button
        v-if="apiKeyStore.hasKey"
        @click="handleTestConnection()"
        :disabled="connectionStore.status === 'testing'"
        class="shrink-0 p-2 rounded-lg border border-stone-300 bg-white/80 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        :aria-label="connectionStore.status === 'testing' ? '测试连接中' : '测试连接'"
        data-testid="test-connection-btn"
        type="button"
      >
        <Loader2 v-if="connectionStore.status === 'testing'" :size="14" class="animate-spin text-teal-700" />
        <CheckCircle2 v-else-if="connectionStore.status === 'connected'" :size="14" class="text-green-500" />
        <WifiOff v-else-if="connectionStore.status === 'error'" :size="14" class="text-red-500" />
        <Wifi v-else :size="14" class="text-gray-500" />
      </button>
    </div>
    <div v-if="connectionStore.status === 'connected'" class="mt-2 rounded-md border border-green-200 bg-green-50/90 px-2 py-1 text-xs font-medium text-green-700" data-testid="connection-ok">
      连接正常
    </div>
    <div v-if="connectionStore.status === 'error' && connectionStore.error" class="mt-2 rounded-md border border-red-200 bg-red-50/90 px-2 py-1 text-xs font-medium text-red-700" data-testid="connection-error">
      {{ connectionStore.error.userMessage }}
    </div>
    <div v-if="rememberEnabled" class="mt-2 flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-1.5 text-xs font-medium text-stone-500 cursor-pointer">
        <input
          type="checkbox"
          :checked="apiKeyStore.rememberKey"
          @change="apiKeyStore.setRememberKey(($event.target as HTMLInputElement).checked)"
          class="rounded border-stone-300 text-teal-700 focus:ring-teal-700"
          data-testid="remember-key-checkbox"
        />
        记住密钥
      </label>
      <span
        v-if="apiKeyStore.rememberKey"
        class="text-xs font-medium text-amber-700"
        data-testid="remember-risk-hint"
      >
        密钥将保存到浏览器本地，请确保设备安全
      </span>
    </div>
  </div>
</template>
