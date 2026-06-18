<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useSkillStore } from '@/stores/skill'
import { SKILL_NONE, SKILL_NEW_TRIGGER } from '@/types/skill'
import { Pencil, Trash2 } from '@lucide/vue'

const store = useSkillStore()
const selectRef = ref<HTMLSelectElement | null>(null)

function onToggle() {
  store.toggleEnabled()
}

async function onSelect(event: Event) {
  const el = event.target as HTMLSelectElement
  const value = el.value

  if (value === SKILL_NEW_TRIGGER) {
    // 恢复下拉显示到当前实际选中项（不入库），再打开新建编辑器
    await nextTick()
    if (selectRef.value) selectRef.value.value = store.selectedId || SKILL_NONE
    store.startCreate()
    return
  }

  await store.selectSkill(value || SKILL_NONE)
}

// 内联编辑区草稿双向绑定辅助
function onDraftName(event: Event) {
  if (store.draft) store.draft.name = (event.target as HTMLInputElement).value
}
function onDraftDesc(event: Event) {
  if (store.draft) store.draft.description = (event.target as HTMLInputElement).value
}
function onDraftContent(event: Event) {
  if (store.draft) store.draft.content = (event.target as HTMLTextAreaElement).value
}

async function onSave() {
  await store.saveDraft()
}

function onEdit(skillId: string) {
  store.startEdit(skillId)
}

// 删除：用二次确认（点一次变红“确认删除”，再点才真删）
const pendingDeleteId = ref<string | null>(null)
function requestDelete(skillId: string) {
  pendingDeleteId.value = skillId
}
function cancelDelete() {
  pendingDeleteId.value = null
}
async function confirmDelete(skillId: string) {
  pendingDeleteId.value = null
  await store.removeCustomSkill(skillId)
}
</script>

<template>
  <div class="skill-selector min-w-0" data-testid="skill-selector" aria-label="Skill 规范选择">
    <div class="flex items-center justify-between gap-2">
      <label for="skill-toggle" class="block text-xs font-semibold text-stone-600 mb-1.5 select-none cursor-pointer">
        加载 Skill 规范
      </label>
      <button
        id="skill-toggle"
        type="button"
        role="switch"
        :aria-checked="store.enabled"
        :data-testid="store.enabled ? 'skill-toggle-on' : 'skill-toggle-off'"
        :aria-label="store.enabled ? '关闭 Skill 规范' : '开启 Skill 规范'"
        @click="onToggle"
        class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
        :class="store.enabled ? 'bg-[#d95c35]' : 'bg-stone-300'"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          :class="store.enabled ? 'translate-x-4' : 'translate-x-0.5'"
        />
      </button>
    </div>

    <div v-if="store.enabled" class="mt-2.5 space-y-2">
      <select
        ref="selectRef"
        :value="store.selectedId"
        @change="onSelect"
        :disabled="store.loading"
        class="w-full rounded-lg border border-stone-300 px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-0 shadow-sm disabled:opacity-60 disabled:cursor-wait"
        data-testid="skill-select"
        aria-label="选择 Skill 规范"
      >
        <option :value="SKILL_NONE">— 请选择 Skill —</option>
        <option v-for="entry in store.allSkills" :key="entry.id" :value="entry.id">
          {{ entry.name }}{{ entry.builtin ? '（内置）' : '' }}
        </option>
        <option :value="SKILL_NEW_TRIGGER" data-testid="skill-new-option">＋ 自定义 Skill</option>
      </select>

      <p
        v-if="store.selectedId && store.isLoaded(store.selectedId)"
        class="text-[11px] leading-snug text-stone-500 break-words"
        data-testid="skill-active-hint"
      >
        已应用：{{
          store.allSkills.find((s) => s.id === store.selectedId)?.description ?? ''
        }}
      </p>
      <p v-if="store.loading" class="text-[11px] leading-snug text-stone-400" data-testid="skill-loading-hint">
        正在加载 Skill 规范...
      </p>
      <p v-if="store.error && !store.draft" class="text-[11px] leading-snug text-red-600 break-words" data-testid="skill-error-hint">
        {{ store.error.userMessage }}
      </p>

      <!-- 自定义 skill 列表（编辑/删除） -->
      <ul v-if="store.customSkills.length > 0" class="space-y-1" data-testid="custom-skill-list">
        <li
          v-for="skill in store.customSkills"
          :key="skill.skillId"
          class="flex items-center justify-between gap-2 rounded-md border border-stone-200 bg-stone-50/60 px-2 py-1.5"
        >
          <span class="min-w-0 truncate text-xs text-stone-700" :title="skill.name">{{ skill.name }}</span>
          <span class="flex shrink-0 items-center gap-1">
            <button
              v-if="pendingDeleteId !== skill.skillId"
              type="button"
              class="rounded p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
              :aria-label="`编辑 ${skill.name}`"
              :data-testid="`skill-edit-${skill.skillId}`"
              @click="onEdit(skill.skillId)"
            ><Pencil :size="13" aria-hidden="true" /></button>
            <button
              v-if="pendingDeleteId !== skill.skillId"
              type="button"
              class="rounded p-1 text-stone-500 hover:bg-red-100 hover:text-red-700"
              :aria-label="`删除 ${skill.name}`"
              :data-testid="`skill-delete-${skill.skillId}`"
              @click="requestDelete(skill.skillId)"
            ><Trash2 :size="13" aria-hidden="true" /></button>
            <template v-else>
              <button
                type="button"
                class="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-medium text-white hover:bg-red-700"
                :data-testid="`skill-delete-confirm-${skill.skillId}`"
                @click="confirmDelete(skill.skillId)"
              >确认删除</button>
              <button
                type="button"
                class="rounded px-1.5 py-0.5 text-[11px] font-medium text-stone-600 hover:bg-stone-200"
                @click="cancelDelete"
              >取消</button>
            </template>
          </span>
        </li>
      </ul>

      <!-- 新建入口已并入下拉框的「自定义 Skill」选项 -->

      <!-- 内联编辑区 -->
      <div v-if="store.draft" class="space-y-2 rounded-lg border border-stone-300 bg-white p-2.5" data-testid="skill-editor">
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">名称 <span class="text-red-700">*</span></label>
          <input
            type="text"
            :value="store.draft.name"
            @input="onDraftName"
            placeholder="例如：水彩风格"
            class="w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="skill-draft-name"
          />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">简介</label>
          <input
            type="text"
            :value="store.draft.description"
            @input="onDraftDesc"
            placeholder="一句话说明该 Skill 用途"
            class="w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="skill-draft-desc"
          />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">规范内容 <span class="text-red-700">*</span></label>
          <textarea
            :value="store.draft.content"
            @input="onDraftContent"
            placeholder="编写该风格/规范要求，生图时会作为前缀拼接到你的描述前面..."
            rows="6"
            class="w-full resize-y rounded-md border border-stone-300 px-2 py-1.5 text-xs leading-5 focus:outline-none focus:ring-0 shadow-sm"
            data-testid="skill-draft-content"
          />
        </div>
        <p v-if="store.error" class="text-[11px] leading-snug text-red-600 break-words" data-testid="skill-editor-error">
          {{ store.error.userMessage }}
        </p>
        <div class="flex items-center justify-end gap-2 pt-0.5">
          <button
            type="button"
            class="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
            :disabled="store.saving"
            data-testid="skill-draft-cancel"
            @click="store.cancelEdit()"
          >取消</button>
          <button
            type="button"
            class="rounded-md bg-[#d95c35] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c84f2d] disabled:opacity-60"
            :disabled="store.saving"
            data-testid="skill-draft-save"
            @click="onSave"
          >{{ store.saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
