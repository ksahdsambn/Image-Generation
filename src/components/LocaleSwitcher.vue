<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Globe, Check, ChevronDown } from '@lucide/vue'
import { useLocaleStore } from '@/stores/locale'
import { useI18n } from 'vue-i18n'

const localeStore = useLocaleStore()
const { t } = useI18n()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
// 浮层定位：跟随触发按钮
const panelStyle = ref<Record<string, string>>({})

// 点击触发器或浮层之外的区域时关闭。浮层因 Teleport 在 rootRef 之外，
// 需显式忽略，否则点选项时浮层会先被判定为外部而关闭。
onClickOutside(rootRef, () => {
  open.value = false
}, { ignore: [triggerRef, panelRef] })

async function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 6}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

async function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  open.value = true
  await nextTick()
  await updatePanelPosition()
}

function pick(code: string) {
  localeStore.setLocale(code)
  open.value = false
}

function currentLabel(): string {
  return localeStore.options.find((o) => o.code === localeStore.currentLocale)?.label ?? localeStore.currentLocale
}

// 窗口尺寸变化时若浮层打开，重新定位，避免错位
function handleResize() {
  if (open.value) updatePanelPosition()
}
window.addEventListener('resize', handleResize)
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="rootRef" class="locale-switcher relative shrink-0" data-testid="locale-switcher">
    <button
      ref="triggerRef"
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

    <!-- 用 Teleport 渲染到 body，避免被 .studio-topbar 的 overflow:hidden 裁剪 -->
    <Teleport to="body">
      <ul
        v-if="open"
        ref="panelRef"
        data-locale-panel
        data-testid="locale-switcher-menu"
        class="locale-switcher-menu fixed z-[60] min-w-[10rem] overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
        role="listbox"
        :style="panelStyle"
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
    </Teleport>
  </div>
</template>
