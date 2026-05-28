<script setup lang="ts">
import { Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useApiKeyStore } from '@/stores/apiKeyStore'

defineProps<{
  rememberKeyEnabled: boolean
}>()

const apiKeyStore = useApiKeyStore()

onMounted(() => {
  apiKeyStore.hydrate()
})
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
    </div>
  </section>
</template>
