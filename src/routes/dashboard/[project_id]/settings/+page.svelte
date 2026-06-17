<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n.svelte';
  
  let projectId = $derived($page.params.project_id);
  let host = $state('');

  onMount(() => {
    host = window.location.origin;
  });

  let scriptTag = $derived(`
<div id="wombat_thread"
  data-host="${host}"
  data-app-id="${projectId}"
  data-page-id="{{ PAGE_ID }}"
  data-page-url="{{ PAGE_URL }}"
  data-page-title="{{ PAGE_TITLE }}"
></div>
<script async defer src="${host}/widget.js"><\/script>
  `.trim());
</script>

<div class="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm mb-6">
  <h2 class="text-lg font-bold mb-4 text-zinc-50">{i18n.t('integration')}</h2>
  <p class="text-sm text-zinc-300 mb-4">
    {i18n.t('integration_desc')}
  </p>
  
  <div class="relative bg-zinc-950 rounded-2xl p-4 font-mono text-sm text-zinc-100 overflow-x-auto border border-zinc-800">
    <pre>{scriptTag}</pre>
    <button class="absolute top-2 right-2 bg-white text-zinc-950 px-2 py-1 text-xs rounded-full hover:bg-zinc-200 transition-colors"
            on:click={() => navigator.clipboard.writeText(scriptTag)}>
      {i18n.t('copy')}
    </button>
  </div>
</div>

<div class="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
  <h2 class="text-lg font-bold mb-4 text-zinc-50">{i18n.t('webhooks')}</h2>
  <p class="text-sm text-zinc-300 italic">{i18n.t('webhooks_desc')}</p>
</div>
