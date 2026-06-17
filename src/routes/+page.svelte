<script lang="ts">
  import { i18n } from '$lib/i18n.svelte';
</script>

<div class="text-center mt-24 md:mt-28">
  <div class="mx-auto mb-6 h-px w-24 bg-zinc-200/40"></div>
  <h1 class="text-4xl md:text-6xl font-black tracking-tight mb-4 text-zinc-50">
    {i18n.t('landing_title')}
  </h1>
  <p class="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
    {i18n.t('landing_desc')}
  </p>
  <div class="flex justify-center gap-4">
    <a href="/auth" class="bg-white text-zinc-950 px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors">{i18n.t('get_started')}</a>
    <a href="https://github.com/Sxinar/Wombat" class="bg-zinc-900 text-zinc-50 border border-zinc-700 px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors">{i18n.t('view_source')}</a>
  </div>
</div>
