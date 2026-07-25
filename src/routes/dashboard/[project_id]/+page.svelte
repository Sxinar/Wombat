<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { i18n } from '$lib/i18n.svelte';
  import { getCommentId } from '$lib/comment-utils';

  let projectId = $derived($page.params.project_id);

  let comments = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let statusFilter = $state<'all' | 'pending' | 'approved' | 'spam'>('all');
  let editingId = $state<string | null>(null);
  let editContent = $state('');

  let filteredComments = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    return comments.filter((comment: any) => {
      const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      const haystack = [
        comment.author_name,
        comment.content,
        comment.thread?.page_title,
        comment.thread?.page_url
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  onMount(() => {
    loadComments();
  });

  async function loadComments() {
    loading = true;

    const response = await fetch(`/api/projects/${projectId}/comments`);
    const data = await response.json().catch(() => ({}));
    const threads = data.threads || [];
    if (response.ok) {
      comments = (data.comments || []).map((comment: any) => {
        const thread = threads.find((t: any) => t._id === comment.thread_id);
        return { ...comment, thread };
      });
    }

    loading = false;
  }

  async function updateStatus(comment: any, status: string) {
    const commentId = getCommentId(comment);
    if (!commentId) return;

    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, status })
    });
    await loadComments();
  }

  function startEdit(comment: any) {
    const commentId = getCommentId(comment);
    if (!commentId) return;
    editingId = commentId;
    editContent = comment.content || '';
  }

  function cancelEdit() {
    editingId = null;
    editContent = '';
  }

  async function saveEdit(comment: any) {
    const commentId = getCommentId(comment);
    const trimmedContent = editContent.trim();
    if (!commentId || !trimmedContent) return;

    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, content: trimmedContent })
    });

    editingId = null;
    editContent = '';
    await loadComments();
  }

  async function deleteComment(comment: any) {
    const commentId = getCommentId(comment);
    if (!commentId || !confirm('Are you sure you want to delete this comment?')) return;

    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId })
    });
    await loadComments();
  }

  function parseMarkdown(content: string) {
    return DOMPurify.sanitize(marked.parse(content) as string);
  }
</script>

{#if loading}
  <div class="text-zinc-300">{i18n.t('loading_comments')}</div>
{:else}
  <div class="flex flex-col gap-4">
    <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <button class="rounded-full px-3 py-1 text-sm {statusFilter === 'all' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-200'}" on:click={() => (statusFilter = 'all')}>{i18n.t('filter_all')}</button>
          <button class="rounded-full px-3 py-1 text-sm {statusFilter === 'pending' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-200'}" on:click={() => (statusFilter = 'pending')}>{i18n.t('filter_pending')}</button>
          <button class="rounded-full px-3 py-1 text-sm {statusFilter === 'approved' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-200'}" on:click={() => (statusFilter = 'approved')}>{i18n.t('filter_approved')}</button>
          <button class="rounded-full px-3 py-1 text-sm {statusFilter === 'spam' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-200'}" on:click={() => (statusFilter = 'spam')}>{i18n.t('filter_spam')}</button>
        </div>
        <input bind:value={searchQuery} placeholder={i18n.t('search_comments')} class="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 md:max-w-xs" />
      </div>
    </div>

    {#if filteredComments.length === 0}
      <div class="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <p class="text-zinc-300">{i18n.t('no_comments')}</p>
      </div>
    {:else}
      {#each filteredComments as comment}
        <div class="bg-zinc-900 border {comment.status === 'pending' ? 'border-zinc-700 bg-zinc-950/60' : 'border-zinc-800'} p-5 rounded-2xl shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-3">
            <div>
              <span class="font-bold text-zinc-50">{comment.author_name}</span>
              <span class="text-sm text-zinc-500 mx-2">•</span>
              <a href={comment.thread?.page_url} target="_blank" rel="noreferrer noopener" class="text-sm text-zinc-300 hover:underline">
                {comment.thread?.page_title || 'Unknown Page'}
              </a>
            </div>
            <div class="flex flex-wrap gap-2">
              {#if comment.status !== 'approved'}
                <button on:click={() => updateStatus(comment, 'approved')} class="text-xs bg-white text-zinc-950 px-2 py-1 rounded-full hover:bg-zinc-200 transition-colors">{i18n.t('approve')}</button>
              {/if}
              {#if comment.status !== 'pending'}
                <button on:click={() => updateStatus(comment, 'pending')} class="text-xs bg-zinc-800 text-zinc-100 px-2 py-1 rounded-full hover:bg-zinc-700 transition-colors">{i18n.t('unapprove')}</button>
              {/if}
              {#if comment.status !== 'spam'}
                <button on:click={() => updateStatus(comment, 'spam')} class="text-xs bg-zinc-950 border border-zinc-700 text-zinc-50 px-2 py-1 rounded-full hover:bg-zinc-800 transition-colors">Spam</button>
              {/if}
              <button on:click={() => startEdit(comment)} class="text-xs bg-zinc-800 text-zinc-100 px-2 py-1 rounded-full hover:bg-zinc-700 transition-colors">{i18n.t('edit')}</button>
              <button on:click={() => deleteComment(comment)} class="text-xs bg-zinc-950 border border-zinc-700 text-zinc-50 px-2 py-1 rounded-full hover:bg-zinc-800 transition-colors">{i18n.t('delete')}</button>
            </div>
          </div>

          {#if editingId === getCommentId(comment)}
            <div class="space-y-3">
              <label class="text-xs uppercase tracking-wide text-zinc-500">{i18n.t('edit_comment')}</label>
              <textarea bind:value={editContent} rows="5" class="w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400"></textarea>
              <div class="flex gap-2">
                <button on:click={() => saveEdit(comment)} class="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-zinc-200">{i18n.t('save')}</button>
                <button on:click={cancelEdit} class="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800">{i18n.t('cancel')}</button>
              </div>
            </div>
          {:else}
            <div class="text-sm bg-zinc-950 p-3 rounded-2xl border border-zinc-800 prose prose-sm max-w-none">
              {@html parseMarkdown(comment.content)}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/if}
