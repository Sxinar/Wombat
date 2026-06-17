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

<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm mb-6">
  <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">{i18n.t('integration')}</h2>
  <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
    {i18n.t('integration_desc')}
  </p>
  
  <div class="relative bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
    <pre>{scriptTag}</pre>
    <button class="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded hover:bg-gray-600 transition-colors"
            on:click={() => navigator.clipboard.writeText(scriptTag)}>
      {i18n.t('copy')}
    </button>
  </div>
</div>

<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm">
  <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">{i18n.t('webhooks')}</h2>
  <p class="text-sm text-gray-500 dark:text-gray-400 italic">{i18n.t('webhooks_desc')}</p>
</div>
