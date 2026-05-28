<script setup lang="ts">
defineProps<{
  title?: string
  message: string
}>()
</script>

<template>
  <section class="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <p :class="title ? 'mt-1' : ''">{{ message }}</p>
  </section>
</template>
