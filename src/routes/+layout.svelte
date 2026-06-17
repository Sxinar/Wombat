<script lang="ts">
  import '../app.css';
  import { i18n } from '$lib/i18n.svelte';
  let { children } = $props();

  function toggleLang() {
    i18n.locale = i18n.locale === 'tr' ? 'en' : 'tr';
  }
</script>

<div class="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 transition-colors duration-200">
  <header class="bg-zinc-950/85 backdrop-blur border-b border-zinc-800">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-50">
        <img src="https://artado.xyz/assest/img/wombat.png" alt="Wombat Logo" class="w-8 h-8 rounded-full" />
        {i18n.t('title')}
      </a>
      <nav class="flex items-center gap-4">
        <button on:click={toggleLang} class="text-xs font-bold bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800 text-zinc-50 hover:bg-zinc-800">
          {i18n.locale === 'tr' ? 'EN' : 'TR'}
        </button>
        <a href="/dashboard" class="text-sm font-medium text-zinc-50 hover:text-zinc-300 transition-colors">{i18n.t('dashboard')}</a>
      </nav>
    </div>
  </header>
  
  <main class="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
    {@render children()}
  </main>
</div>
