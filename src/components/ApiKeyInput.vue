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
      <KeyRound :size="16" class="text-gray-400 shrink-0" aria-hidden="true" />
      <div class="relative flex-1 min-w-0">
        <input
          ref="_inputRef"
          :type="apiKeyStore.visible ? 'text' : 'password'"
          :value="apiKeyStore.apiKey"
          @input="apiKeyStore.setApiKey(($event.target as HTMLInputElement).value); connectionStore.reset()"
          placeholder="输入 API Key"
          class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          data-testid="api-key-input"
          aria-label="API 密钥"
        />
        <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            @click="apiKeyStore.toggleVisible()"
            class="p-1 rounded hover:bg-gray-200 text-gray-500"
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
            class="p-1 rounded hover:bg-gray-200 text-gray-500"
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
        class="shrink-0 p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        :aria-label="connectionStore.status === 'testing' ? '测试连接中' : '测试连接'"
        data-testid="test-connection-btn"
        type="button"
      >
        <Loader2 v-if="connectionStore.status === 'testing'" :size="14" class="animate-spin text-blue-500" />
        <CheckCircle2 v-else-if="connectionStore.status === 'connected'" :size="14" class="text-green-500" />
        <WifiOff v-else-if="connectionStore.status === 'error'" :size="14" class="text-red-500" />
        <Wifi v-else :size="14" class="text-gray-500" />
      </button>
    </div>
    <div v-if="connectionStore.status === 'connected'" class="mt-1 text-xs text-green-600" data-testid="connection-ok">
      连接正常
    </div>
    <div v-if="connectionStore.status === 'error' && connectionStore.error" class="mt-1 text-xs text-red-600" data-testid="connection-error">
      {{ connectionStore.error.userMessage }}
    </div>
    <div v-if="rememberEnabled" class="mt-1.5 flex items-center gap-2">
      <label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          :checked="apiKeyStore.rememberKey"
          @change="apiKeyStore.setRememberKey(($event.target as HTMLInputElement).checked)"
          class="rounded border-gray-300"
          data-testid="remember-key-checkbox"
        />
        记住密钥
      </label>
      <span
        v-if="apiKeyStore.rememberKey"
        class="text-xs text-amber-600"
        data-testid="remember-risk-hint"
      >
        密钥将保存到浏览器本地，请确保设备安全
      </span>
    </div>
  </div>
</template>
