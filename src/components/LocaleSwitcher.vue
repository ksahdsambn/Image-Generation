<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Globe, Check, ChevronDown } from '@lucide/vue'
import { useLocaleStore } from '@/stores/locale'
import { useI18n } from 'vue-i18n'

const localeStore = useLocaleStore()
const { t } = useI18n()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

onClickOutside(rootRef, () => {
  open.value = false
})

function pick(code: string) {
  localeStore.setLocale(code)
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function currentLabel(): string {
  return localeStore.options.find((o) => o.code === localeStore.currentLocale)?.label ?? localeStore.currentLocale
}
</script>

<template>
  <div ref="rootRef" class="locale-switcher relative shrink-0" data-testid="locale-switcher">
    <button
      type="button"
      class="flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 shadow-sm"
      :aria-label="t('locale.switcherAriaLabel')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      data-testid="locale-switcher-btn"
      @click="toggle"
    >
      <Globe :size="14" class="text-teal-700" aria-hidden="true" />
      <span class="max-w-[8rem] truncate">{{ currentLabel() }}</span>
      <ChevronDown :size="12" class="text-stone-500 transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
    </button>

    <ul
      v-if="open"
      class="absolute right-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
      role="listbox"
      data-testid="locale-switcher-menu"
    >
      <li
        v-for="opt in localeStore.options"
        :key="opt.code"
      >
        <button
          type="button"
          role="option"
          :aria-selected="opt.code === localeStore.currentLocale"
          :data-testid="`locale-option-${opt.code}`"
          class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100"
          @click="pick(opt.code)"
        >
          <span>{{ opt.label }}</span>
          <Check v-if="opt.code === localeStore.currentLocale" :size="13" class="text-teal-700" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>
