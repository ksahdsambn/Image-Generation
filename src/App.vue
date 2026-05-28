<script setup lang="ts">
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import GenerationParamsPanel from '@/components/GenerationParamsPanel.vue'
import { getRuntimeConfig } from '@/config/appConfig'

const runtimeConfig = getRuntimeConfig()
const appTitle = runtimeConfig.config.appTitle
</script>

<template>
  <main class="min-h-screen bg-stone-50 text-slate-950">
    <section class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sub2API Workspace</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{{ appTitle }}</h1>
        </div>
        <ApiKeyPanel :remember-key-enabled="runtimeConfig.config.rememberKeyEnabled" />
      </header>

      <section v-if="!runtimeConfig.ok" class="mt-5">
        <ErrorAlert title="Configuration error" :message="runtimeConfig.errors.join(' ')" />
      </section>

      <div class="grid flex-1 gap-6 py-6 lg:grid-cols-[360px_1fr_320px]">
        <aside class="rounded-md border border-slate-200 bg-white p-4">
          <h2 class="text-base font-semibold text-slate-900">Generation parameters</h2>
          <div class="mt-4">
            <GenerationParamsPanel />
          </div>
        </aside>

        <section class="min-h-96 rounded-md border border-slate-200 bg-white p-4">
          <h2 class="text-base font-semibold text-slate-900">Current results</h2>
          <div class="mt-4 grid min-h-72 place-items-center rounded-md bg-slate-100 px-4 text-center text-sm text-slate-600">
            Generated images will appear here after the Sub2API request layer is connected.
          </div>
        </section>

        <aside class="rounded-md border border-slate-200 bg-white p-4">
          <h2 class="text-base font-semibold text-slate-900">Local history</h2>
          <div class="mt-4 min-h-56 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            IndexedDB history will be implemented in the local gallery stage and will stay in this browser.
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
