<script lang="ts">
  import '../app.css';
  import { i18n } from '$lib/i18n.svelte';
  let { children } = $props();

  function toggleLang() {
    i18n.locale = i18n.locale === 'tr' ? 'en' : 'tr';
  }
</script>

<div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
        <img src="https://artado.xyz/assest/img/wombat.png" alt="Wombat Logo" class="w-8 h-8 rounded-full" />
        {i18n.t('title')}
      </a>
      <nav class="flex items-center gap-4">
        <button on:click={toggleLang} class="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          {i18n.locale === 'tr' ? 'EN' : 'TR'}
        </button>
        <a href="/dashboard" class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">{i18n.t('dashboard')}</a>
      </nav>
    </div>
  </header>
  
  <main class="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
    {@render children()}
  </main>
</div>
