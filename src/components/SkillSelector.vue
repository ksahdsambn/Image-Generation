<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useSkillStore } from '@/stores/skill'
import { SKILL_NONE, SKILL_NEW_TRIGGER } from '@/types/skill'
import { Pencil, Trash2 } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const store = useSkillStore()
const { t } = useI18n()
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
  <div class="skill-selector min-w-0" data-testid="skill-selector" :aria-label="t('skill.ariaLabel')">
    <div class="flex items-center justify-between gap-2">
      <label for="skill-toggle" class="block text-sm font-semibold text-stone-600 mb-1.5 select-none cursor-pointer">
        {{ t('skill.toggleLabel') }}
      </label>
      <button
        id="skill-toggle"
        type="button"
        role="switch"
        :aria-checked="store.enabled"
        :data-testid="store.enabled ? 'skill-toggle-on' : 'skill-toggle-off'"
        :aria-label="store.enabled ? t('skill.toggleOnAriaLabel') : t('skill.toggleOffAriaLabel')"
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
        :aria-label="t('skill.selectAriaLabel')"
      >
        <option :value="SKILL_NONE">{{ t('skill.placeholderSelect') }}</option>
        <option v-for="entry in store.allSkills" :key="entry.id" :value="entry.id">
          {{ entry.name }}{{ entry.builtin ? t('common.builtin') : '' }}
        </option>
        <option :value="SKILL_NEW_TRIGGER" data-testid="skill-new-option">{{ t('skill.newTrigger') }}</option>
      </select>

      <p
        v-if="store.selectedId && store.isLoaded(store.selectedId)"
        class="text-[11px] leading-snug text-stone-500 break-words"
        data-testid="skill-active-hint"
      >
        {{ t('skill.appliedHint', { description: store.allSkills.find((s) => s.id === store.selectedId)?.description ?? '' }) }}
      </p>
      <p v-if="store.loading" class="text-[11px] leading-snug text-stone-400" data-testid="skill-loading-hint">
        {{ t('skill.loadingHint') }}
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
              :aria-label="t('skill.editAriaLabel', { name: skill.name })"
              :data-testid="`skill-edit-${skill.skillId}`"
              @click="onEdit(skill.skillId)"
            ><Pencil :size="13" aria-hidden="true" /></button>
            <button
              v-if="pendingDeleteId !== skill.skillId"
              type="button"
              class="rounded p-1 text-stone-500 hover:bg-red-100 hover:text-red-700"
              :aria-label="t('skill.deleteAriaLabel', { name: skill.name })"
              :data-testid="`skill-delete-${skill.skillId}`"
              @click="requestDelete(skill.skillId)"
            ><Trash2 :size="13" aria-hidden="true" /></button>
            <template v-else>
              <button
                type="button"
                class="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-medium text-white hover:bg-red-700"
                :data-testid="`skill-delete-confirm-${skill.skillId}`"
                @click="confirmDelete(skill.skillId)"
              >{{ t('history.confirmDeleteBtn') }}</button>
              <button
                type="button"
                class="rounded px-1.5 py-0.5 text-[11px] font-medium text-stone-600 hover:bg-stone-200"
                @click="cancelDelete"
              >{{ t('common.cancel') }}</button>
            </template>
          </span>
        </li>
      </ul>

      <!-- 新建入口已并入下拉框的「自定义 Skill」选项 -->

      <!-- 内联编辑区 -->
      <div v-if="store.draft" class="space-y-2 rounded-lg border border-stone-300 bg-white p-2.5" data-testid="skill-editor">
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">{{ t('skill.draftNameLabel') }} <span class="text-red-700">*</span></label>
          <input
            type="text"
            :value="store.draft.name"
            @input="onDraftName"
            :placeholder="t('skill.draftNamePlaceholder')"
            class="w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="skill-draft-name"
          />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">{{ t('skill.draftDescLabel') }}</label>
          <input
            type="text"
            :value="store.draft.description"
            @input="onDraftDesc"
            :placeholder="t('skill.draftDescPlaceholder')"
            class="w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-0 shadow-sm"
            data-testid="skill-draft-desc"
          />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-semibold text-stone-600">{{ t('skill.draftContentLabel') }} <span class="text-red-700">*</span></label>
          <textarea
            :value="store.draft.content"
            @input="onDraftContent"
            :placeholder="t('skill.draftContentPlaceholder')"
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
          >{{ t('common.cancel') }}</button>
          <button
            type="button"
            class="rounded-md bg-[#d95c35] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c84f2d] disabled:opacity-60"
            :disabled="store.saving"
            data-testid="skill-draft-save"
            @click="onSave"
          >{{ store.saving ? t('common.saving') : t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
