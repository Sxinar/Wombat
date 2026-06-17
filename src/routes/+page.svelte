<script lang="ts">
  import { i18n } from '$lib/i18n.svelte';
</script>

<div class="text-center mt-20">
  <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
    {i18n.t('landing_title')}
  </h1>
  <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
    {i18n.t('landing_desc')}
  </p>
  <div class="flex justify-center gap-4">
    <a href="/auth" class="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">{i18n.t('get_started')}</a>
    <a href="https://github.com/Sxinar/Wombat" class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{i18n.t('view_source')}</a>
  </div>
</div>
