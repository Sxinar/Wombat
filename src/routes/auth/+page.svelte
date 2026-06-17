<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/i18n.svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let message = $state('');

  async function handleAuth() {
    loading = true;
    message = '';
    
    // 1. Önce giriş yapmayı dene
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      // Eğer kullanıcı bulunamadıysa (veya şifre yanlışsa), kayıt olmayı dene
      if (signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        
        if (signUpError) {
          // Eğer zaten kayıtlıysa demek ki şifreyi yanlış girmiş
          if (signUpError.message.includes('User already registered')) {
            message = 'Hatalı şifre girdiniz.';
          } else {
            message = signUpError.message;
          }
        } else {
          // Kayıt başarılı
          if (signUpData.session) {
             goto('/dashboard');
          } else {
             message = 'Hesabınız oluşturuldu! Supabase ayarlarınızda "Email Confirmations" açıksa, lütfen mailinizi kontrol edin.';
          }
        }
      } else {
        message = signInError.message;
      }
    } else {
      // Giriş başarılı
      goto('/dashboard');
    }
    
    loading = false;
  }
</script>

<div class="max-w-md mx-auto mt-20 bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
  <h2 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">{i18n.t('sign_in_up')}</h2>
  <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{i18n.t('enter_details')}</p>

  {#if message}
    <div class="mb-4 p-3 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm">{message}</div>
  {/if}

  <form on:submit|preventDefault={handleAuth} class="flex flex-col gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="email">{i18n.t('email')}</label>
      <input id="email" type="email" bind:value={email} required 
             class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-gray-400 focus:border-transparent outline-none transition-all" />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="password">{i18n.t('password')}</label>
      <input id="password" type="password" bind:value={password} required minlength="6"
             class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-gray-400 focus:border-transparent outline-none transition-all" />
    </div>

    <button type="submit" disabled={loading} 
            class="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2">
      {loading ? i18n.t('processing') : i18n.t('continue')}
    </button>
  </form>
</div>
