<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { i18n } from '$lib/i18n.svelte';

  let projectId = $derived($page.params.project_id);
  
  let comments = $state<any[]>([]);
  let loading = $state(true);

  onMount(() => {
    loadComments();
  });

  async function loadComments() {
    loading = true;
    
    // First find all thread IDs for this project
    const { data: threads } = await supabase
      .from('threads')
      .select('id, page_title, page_url')
      .eq('project_id', projectId);

    if (threads && threads.length > 0) {
      const threadIds = threads.map(t => t.id);
      
      const { data } = await supabase
        .from('comments')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });
        
      if (data) {
        comments = data.map(c => {
          const thread = threads.find(t => t.id === c.thread_id);
          return { ...c, thread };
        });
      }
    }
    
    loading = false;
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('comments').update({ status }).eq('id', id);
    await loadComments();
  }

  async function deleteComment(id: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    await supabase.from('comments').delete().eq('id', id);
    await loadComments();
  }

  function parseMarkdown(content: string) {
    return DOMPurify.sanitize(marked.parse(content) as string);
  }
</script>

{#if loading}
  <div class="text-zinc-300">{i18n.t('loading_comments')}</div>
{:else if comments.length === 0}
  <div class="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
    <p class="text-zinc-300">{i18n.t('no_comments')}</p>
  </div>
{:else}
  <div class="flex flex-col gap-4">
    {#each comments as comment}
      <div class="bg-zinc-900 border {comment.status === 'pending' ? 'border-zinc-700 bg-zinc-950/60' : 'border-zinc-800'} p-5 rounded-2xl shadow-sm">
        <div class="flex justify-between items-start mb-3">
          <div>
            <span class="font-bold text-zinc-50">{comment.author_name}</span>
            <span class="text-sm text-zinc-500 mx-2">•</span>
            <a href={comment.thread?.page_url} target="_blank" rel="noreferrer noopener" class="text-sm text-zinc-300 hover:underline">
              {comment.thread?.page_title || 'Unknown Page'}
            </a>
          </div>
          <div class="flex gap-2">
            {#if comment.status === 'pending'}
              <button on:click={() => updateStatus(comment.id, 'approved')} class="text-xs bg-white text-zinc-950 px-2 py-1 rounded-full hover:bg-zinc-200 transition-colors">{i18n.t('approve')}</button>
            {/if}
            {#if comment.status === 'approved'}
              <button on:click={() => updateStatus(comment.id, 'pending')} class="text-xs bg-zinc-800 text-zinc-100 px-2 py-1 rounded-full hover:bg-zinc-700 transition-colors">{i18n.t('unapprove')}</button>
            {/if}
            <button on:click={() => deleteComment(comment.id)} class="text-xs bg-zinc-950 border border-zinc-700 text-zinc-50 px-2 py-1 rounded-full hover:bg-zinc-800 transition-colors">{i18n.t('delete')}</button>
          </div>
        </div>
        
        <div class="text-sm bg-zinc-950 p-3 rounded-2xl border border-zinc-800 prose prose-sm max-w-none">
          {@html parseMarkdown(comment.content)}
        </div>
      </div>
    {/each}
  </div>
{/if}
