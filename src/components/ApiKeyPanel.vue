<script setup lang="ts">
import { Eye, EyeOff, PlugZap, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useApiKeyStore } from '@/stores/apiKeyStore'
import { createAppError } from '@/errors/appError'
import { createImageApiClient, isAppError } from '@/services/imageApi'

const props = defineProps<{
  rememberKeyEnabled: boolean
  sub2ApiBaseUrl?: string
  canTestConnection?: boolean
}>()

const apiKeyStore = useApiKeyStore()
const connectionStatus = ref<'idle' | 'checking' | 'success' | 'error'>('idle')
const connectionMessage = ref('尚未测试连接。')
const connectionMessageClass = computed(() => {
  if (connectionStatus.value === 'success') {
    return 'bg-emerald-50 text-emerald-900'
  }

  if (connectionStatus.value === 'error') {
    return 'bg-rose-50 text-rose-900'
  }

  return 'bg-slate-100 text-slate-700'
})

onMounted(() => {
  apiKeyStore.hydrate()
})

watch(
  () => apiKeyStore.apiKey,
  () => {
    connectionStatus.value = 'idle'
    connectionMessage.value = 'API Key 已修改，请重新测试连接。'
  },
)

async function testConnection() {
  if (connectionStatus.value === 'checking') {
    return
  }

  connectionStatus.value = 'checking'
  connectionMessage.value = '正在测试 Sub2API 连接。'

  try {
    if (!props.canTestConnection || !props.sub2ApiBaseUrl || !apiKeyStore.hasApiKey) {
      throw createAppError('validation')
    }

    const client = createImageApiClient({
      baseUrl: props.sub2ApiBaseUrl,
      apiKey: apiKeyStore.apiKey,
    })

    await client.checkConnection()
    connectionStatus.value = 'success'
    connectionMessage.value = '连接正常。此检查仅验证后端、CORS 和 API Key，不代表图片权限或额度已验证。'
  } catch (error) {
    connectionStatus.value = 'error'
    connectionMessage.value = isAppError(error) ? error.message : '连接测试失败，请稍后重试。'
  }
}
</script>

<template>
  <section class="w-full rounded-md border border-slate-200 bg-white p-4 md:max-w-xl" aria-label="API Key 配置">
    <div class="flex flex-col gap-3">
      <label class="text-sm font-medium text-slate-900" for="api-key-input">Sub2API API Key</label>
      <div class="flex min-w-0 gap-2">
        <input
          id="api-key-input"
          class="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          :type="apiKeyStore.isKeyVisible ? 'text' : 'password'"
          :value="apiKeyStore.apiKey"
          autocomplete="off"
          aria-label="Sub2API API Key"
          placeholder="输入你的 Sub2API API Key"
          @input="apiKeyStore.setApiKey(($event.target as HTMLInputElement).value)"
        />
        <button
          class="inline-grid size-10 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100"
          type="button"
          :aria-label="apiKeyStore.isKeyVisible ? '隐藏 API Key' : '显示 API Key'"
          @click="apiKeyStore.toggleKeyVisibility()"
        >
          <EyeOff v-if="apiKeyStore.isKeyVisible" class="size-4" aria-hidden="true" />
          <Eye v-else class="size-4" aria-hidden="true" />
        </button>
        <button
          class="inline-grid size-10 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100"
          type="button"
          aria-label="清除 API Key"
          @click="apiKeyStore.clearApiKey()"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </button>
      </div>

      <label v-if="rememberKeyEnabled" class="flex items-start gap-2 text-sm text-slate-700">
        <input
          class="mt-1 size-4 rounded border-slate-300 text-emerald-700"
          type="checkbox"
          :checked="apiKeyStore.rememberKey"
          aria-label="记住密钥"
          @change="apiKeyStore.setRememberKey(($event.target as HTMLInputElement).checked)"
        />
        <span>记住密钥</span>
      </label>

      <p v-if="rememberKeyEnabled && apiKeyStore.rememberKey" class="text-xs text-amber-800">
        密钥会保存在此浏览器的 localStorage。仅在私人设备上使用。
      </p>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="button"
          :disabled="connectionStatus === 'checking' || !apiKeyStore.hasApiKey || !canTestConnection"
          aria-label="测试 Sub2API 连接"
          @click="testConnection"
        >
          <PlugZap class="size-4" aria-hidden="true" />
          <span>{{ connectionStatus === 'checking' ? '测试中...' : '测试连接' }}</span>
        </button>
        <p class="rounded-md px-3 py-2 text-xs" :class="connectionMessageClass" role="status">
          {{ connectionMessage }}
        </p>
      </div>
    </div>
  </section>
</template>
