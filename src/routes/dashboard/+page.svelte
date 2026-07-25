<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/i18n.svelte';

  let projects = $state<any[]>([]);
  let loading = $state(true);
  let newProjectName = $state('');
  let creating = $state(false);
  let isAdmin = $state(false);
  let adminEmail = $state('');
  let adminBusy = $state(false);
  let adminMessage = $state('');
  let stats = $state({
    totalProjects: 0,
    totalThreads: 0,
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0,
    reactions: 0,
    recentComments: 0
  });

  onMount(async () => {
    const meResponse = await fetch('/api/auth/me');
    const me = await meResponse.json().catch(() => ({}));
    if (!me.user) {
      goto('/auth');
      return;
    }
    isAdmin = !!me.user.is_admin;
    await loadProjects();
  });

  async function loadProjects() {
    const response = await fetch('/api/projects');
    const data = await response.json();
    if (response.ok && data.projects) projects = data.projects;
    await loadStats(data.projects || []);
    loading = false;
  }

  async function loadStats(projectList: any[]) {
    stats.totalProjects = projectList.length;
    const response = await fetch('/api/dashboard/stats');
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      stats = { ...stats, ...data };
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    creating = true;

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName })
    });

    if (response.ok) {
      newProjectName = '';
      await loadProjects();
    }
    creating = false;
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/auth');
  }

  async function setAdminStatus(makeAdmin: boolean) {
    if (!adminEmail.trim()) return;
    adminBusy = true;
    adminMessage = '';

    const response = await fetch('/api/admin/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmail: adminEmail.trim(),
        makeAdmin
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      adminMessage = data.error || 'İşlem başarısız.';
    } else {
      adminMessage = makeAdmin ? 'Admin yetkisi verildi.' : 'Admin yetkisi kaldırıldı.';
      adminEmail = '';
    }
    adminBusy = false;
  }
</script>

<div class="flex justify-between items-center mb-8">
  <h1 class="text-2xl font-bold">{i18n.t('your_sites')}</h1>
  <button on:click={signOut} class="text-sm text-zinc-400 hover:text-zinc-50">{i18n.t('sign_out')}</button>
</div>

{#if loading}
  <div class="text-zinc-500">{i18n.t('loading_sites')}</div>
{:else}
  {#if isAdmin}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">{i18n.t('admin_projects')}</div>
        <div class="text-3xl font-bold text-zinc-50">{stats.totalProjects}</div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">{i18n.t('admin_comments')}</div>
        <div class="text-3xl font-bold text-zinc-50">{stats.totalComments}</div>
        <div class="text-sm text-zinc-500 mt-1">{stats.pendingComments} {i18n.t('pending')}</div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">{i18n.t('admin_engagement')}</div>
        <div class="text-3xl font-bold text-zinc-50">{stats.reactions}</div>
        <div class="text-sm text-zinc-500 mt-1">{stats.recentComments} {i18n.t('comments_this_week')}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4 mb-8">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-zinc-50 mb-2">Admin yönetimi</h2>
        <p class="text-sm text-zinc-500 mb-4">Bir kullanıcıyı admin yapmak ya da yetkisini almak için e-posta gir.</p>
        {#if adminMessage}
          <div class="mb-4 text-sm bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300">{adminMessage}</div>
        {/if}
        <div class="flex flex-col sm:flex-row gap-2">
          <input type="email" bind:value={adminEmail} placeholder="admin@example.com" class="flex-1 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-50 outline-none focus:ring-2 focus:ring-zinc-100" />
          <button disabled={adminBusy} on:click={() => setAdminStatus(true)} class="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">Admin yap</button>
          <button disabled={adminBusy} on:click={() => setAdminStatus(false)} class="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-50 hover:bg-zinc-800 disabled:opacity-50">Yetki kaldır</button>
        </div>
      </div>

      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 class="text-sm uppercase tracking-wide text-zinc-500 mb-3">Hızlı özet</h3>
        <ul class="space-y-2 text-sm text-zinc-300">
          <li>• {stats.approvedComments} onaylı yorum</li>
          <li>• {stats.pendingComments} bekleyen yorum</li>
          <li>• {stats.recentComments} yorum bu hafta</li>
        </ul>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    {#each projects as project}
      <a href="/dashboard/{project.id}" class="block p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-500 transition-colors shadow-sm">
        <h3 class="font-semibold text-lg mb-1 text-zinc-50">{project.name}</h3>
        <p class="text-xs text-zinc-400 font-mono" title="Site ID">{project.id}</p>
      </a>
    {/each}
  </div>

  <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md shadow-sm">
    <h3 class="font-semibold mb-4 text-zinc-50">{i18n.t('create_site')}</h3>
    <form on:submit|preventDefault={createProject} class="flex gap-2">
      <input type="text" bind:value={newProjectName} placeholder={i18n.t('site_name')} required 
             class="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 text-zinc-50 rounded-xl focus:ring-2 focus:ring-zinc-100 outline-none transition-all" />
      <button type="submit" disabled={creating} 
              class="bg-white text-zinc-950 px-4 py-2 rounded-xl font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors">
        {creating ? i18n.t('processing') : i18n.t('create')}
      </button>
    </form>
  </div>
{/if}
