<script lang="ts">
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/i18n.svelte';

  let email = $state('');
  let password = $state('');
  let resetCode = $state('');
  let loading = $state(false);
  let message = $state('');
  let isResetMode = $state(false);

  async function handleAuth() {
    loading = true;
    message = '';

    if (isResetMode) {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode, password })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        message = result.error || i18n.t('reset_error');
        loading = false;
        return;
      }

      message = result.message || i18n.t('reset_success');
      isResetMode = false;
      password = '';
      resetCode = '';
      loading = false;
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      message = result.error || 'Giriş yapılamadı.';
      loading = false;
      return;
    }

    if (result.created) {
      message = 'Hesabınız oluşturuldu ve giriş yapıldı.';
    }
    goto('/dashboard');
    loading = false;
  }
</script>

<div class="max-w-md mx-auto mt-20 bg-zinc-900 p-8 border border-zinc-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
  <div class="mb-6 h-px w-12 bg-zinc-100/80"></div>
  <h2 class="text-2xl font-bold mb-4 text-zinc-50">{i18n.t('sign_in_up')}</h2>
  <p class="text-sm text-zinc-400 mb-6">{i18n.t('enter_details')}</p>

  {#if message}
    <div class="mb-4 p-3 rounded-xl bg-zinc-800 text-zinc-200 text-sm border border-zinc-700">{message}</div>
  {/if}

  <form on:submit|preventDefault={handleAuth} class="flex flex-col gap-4">
    <div>
      <label class="block text-sm font-medium text-zinc-300 mb-1" for="email">{i18n.t('email')}</label>
      <input id="email" type="email" bind:value={email} required 
             class="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-zinc-50 rounded-xl focus:ring-2 focus:ring-zinc-100 focus:border-transparent outline-none transition-all" />
    </div>
    
    {#if isResetMode}
      <div>
        <label class="block text-sm font-medium text-zinc-300 mb-1" for="resetCode">{i18n.t('reset_code')}</label>
        <input id="resetCode" type="text" bind:value={resetCode}
               class="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-zinc-50 rounded-xl focus:ring-2 focus:ring-zinc-100 focus:border-transparent outline-none transition-all" />
      </div>
    {/if}

    <div>
      <label class="block text-sm font-medium text-zinc-300 mb-1" for="password">{i18n.t('password')}</label>
      <input id="password" type="password" bind:value={password} required minlength="6"
             class="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-zinc-50 rounded-xl focus:ring-2 focus:ring-zinc-100 focus:border-transparent outline-none transition-all" />
    </div>

    <button type="submit" disabled={loading} 
            class="w-full bg-white text-zinc-950 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-2">
      {loading ? i18n.t('processing') : isResetMode ? i18n.t('set_new_password') : i18n.t('continue')}
    </button>
  </form>

  <button type="button" class="mt-4 text-sm text-zinc-400 hover:text-zinc-100" on:click={() => (isResetMode = !isResetMode)}>
    {isResetMode ? i18n.t('sign_in_up') : i18n.t('forgot_password')}
  </button>
</div>
