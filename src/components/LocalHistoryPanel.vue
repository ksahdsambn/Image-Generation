<script setup lang="ts">
import { Download, RotateCcw, Search, Trash2 } from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'
import type { ImageHistoryListItem } from '@/types/history'

const props = defineProps<{
  items: ImageHistoryListItem[]
  unavailable?: boolean
  search?: string
  date?: string
}>()

const emit = defineEmits<{
  search: [value: string]
  date: [value: string]
  reload: [item: ImageHistoryListItem]
  download: [item: ImageHistoryListItem]
  delete: [id: string]
  clear: []
}>()

const thumbnailUrls = ref(new Map<string, string>())

watch(
  () => props.items,
  (items) => {
    thumbnailUrls.value.forEach((url) => URL.revokeObjectURL(url))
    thumbnailUrls.value = new Map(items.map((item) => [item.id, URL.createObjectURL(item.thumbnailBlob)]))
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  thumbnailUrls.value.forEach((url) => URL.revokeObjectURL(url))
})
</script>

<template>
  <section aria-labelledby="local-history-title">
    <div class="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
      <div>
        <h2 id="local-history-title" class="text-base font-semibold text-slate-900">Local history</h2>
        <p class="mt-1 text-sm text-slate-600">Images stay in this browser.</p>
      </div>
      <button
        class="inline-grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        aria-label="Clear local history"
        :disabled="unavailable || items.length === 0"
        @click="emit('clear')"
      >
        <Trash2 class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div v-if="unavailable" class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
      Local history is unavailable in this browser. Current results can still be previewed and downloaded.
    </div>

    <template v-else>
      <div class="mt-4 grid gap-2">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            class="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-950"
            type="search"
            :value="search"
            aria-label="Search local history"
            placeholder="Search prompt"
            @input="emit('search', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <input
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          type="date"
          :value="date"
          aria-label="Filter local history date"
          @input="emit('date', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div v-if="items.length === 0" class="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        No local images yet.
      </div>

      <ul v-else class="mt-4 space-y-3">
        <li v-for="item in items" :key="item.id" class="rounded-md border border-slate-200 bg-white p-3">
          <div class="flex gap-3">
            <img class="size-16 rounded object-cover" :src="thumbnailUrls.get(item.id)" :alt="`History ${item.id}`" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">{{ item.prompt }}</p>
              <p class="mt-1 text-xs text-slate-600">{{ item.size }} · {{ item.outputFormat }}</p>
              <div class="mt-3 flex gap-2">
                <button class="inline-grid size-8 place-items-center rounded-md border border-slate-300 text-slate-700" type="button" :aria-label="`Reload ${item.id}`" @click="emit('reload', item)">
                  <RotateCcw class="size-4" aria-hidden="true" />
                </button>
                <button class="inline-grid size-8 place-items-center rounded-md border border-slate-300 text-slate-700" type="button" :aria-label="`Download ${item.id}`" @click="emit('download', item)">
                  <Download class="size-4" aria-hidden="true" />
                </button>
                <button class="inline-grid size-8 place-items-center rounded-md border border-slate-300 text-slate-700" type="button" :aria-label="`Delete ${item.id}`" @click="emit('delete', item.id)">
                  <Trash2 class="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
