<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n.svelte';
  let { children } = $props();
  
  let projectId = $derived($page.params.project_id);
  let path = $derived($page.url.pathname);
  let checkingAccess = $state(true);

  onMount(async () => {
    const meResponse = await fetch('/api/auth/me');
    const me = await meResponse.json().catch(() => ({}));
    if (!me.user) {
      goto('/auth');
      return;
    }

    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      goto('/dashboard');
      return;
    }

    checkingAccess = false;
  });
</script>

{#if checkingAccess}
  <div class="text-zinc-400">Loading...</div>
{:else}
  <div class="mb-8 flex gap-4 border-b border-zinc-800 pb-2">
    <a href="/dashboard/{projectId}" 
       class="font-medium px-2 py-1 rounded-t-md {path === `/dashboard/${projectId}` ? 'text-zinc-50 border-b-2 border-zinc-50 bg-zinc-900/40' : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/30 transition-colors'}">
      {i18n.t('inbox')}
    </a>
    <a href="/dashboard/{projectId}/settings" 
       class="font-medium px-2 py-1 rounded-t-md {path === `/dashboard/${projectId}/settings` ? 'text-zinc-50 border-b-2 border-zinc-50 bg-zinc-900/40' : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900/30 transition-colors'}">
      {i18n.t('settings')}
    </a>
  </div>

  {@render children()}
{/if}
