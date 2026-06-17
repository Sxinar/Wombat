<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/i18n.svelte';

  let projects = $state<any[]>([]);
  let loading = $state(true);
  let newProjectName = $state('');
  let creating = $state(false);

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/auth');
      return;
    }
    await loadProjects();
  });

  async function loadProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) projects = data;
    loading = false;
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    creating = true;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('projects')
        .insert({ name: newProjectName, user_id: user.id });
      
      if (!error) {
        newProjectName = '';
        await loadProjects();
      }
    }
    creating = false;
  }

  async function signOut() {
    await supabase.auth.signOut();
    goto('/auth');
  }
</script>

<div class="flex justify-between items-center mb-8">
  <h1 class="text-2xl font-bold">{i18n.t('your_sites')}</h1>
  <button on:click={signOut} class="text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">{i18n.t('sign_out')}</button>
</div>

{#if loading}
  <div class="text-gray-500 dark:text-gray-400">{i18n.t('loading_sites')}</div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    {#each projects as project}
      <a href="/dashboard/{project.id}" class="block p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-black dark:hover:border-gray-500 transition-colors shadow-sm">
        <h3 class="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{project.name}</h3>
        <p class="text-xs text-gray-400 dark:text-gray-500 font-mono" title="Site ID">{project.id}</p>
      </a>
    {/each}
  </div>

  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-w-md shadow-sm">
    <h3 class="font-semibold mb-4 text-gray-900 dark:text-white">{i18n.t('create_site')}</h3>
    <form on:submit|preventDefault={createProject} class="flex gap-2">
      <input type="text" bind:value={newProjectName} placeholder={i18n.t('site_name')} required 
             class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-gray-400 outline-none transition-all" />
      <button type="submit" disabled={creating} 
              class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors">
        {creating ? i18n.t('processing') : i18n.t('create')}
      </button>
    </form>
  </div>
{/if}
