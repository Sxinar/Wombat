<script lang="ts">
  import { page } from '$app/stores';
  import { i18n } from '$lib/i18n.svelte';
  let { children } = $props();
  
  let projectId = $derived($page.params.project_id);
  let path = $derived($page.url.pathname);
</script>

<div class="mb-8 flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-2">
  <a href="/dashboard/{projectId}" 
     class="font-medium px-2 py-1 {path === `/dashboard/${projectId}` ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors'}">
    {i18n.t('inbox')}
  </a>
  <a href="/dashboard/{projectId}/settings" 
     class="font-medium px-2 py-1 {path === `/dashboard/${projectId}/settings` ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors'}">
    {i18n.t('settings')}
  </a>
</div>

{@render children()}
