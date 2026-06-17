<svelte:options customElement="wombat-widget" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import CommentItem from './CommentItem.svelte';

  // Svelte 5: $props() yerine export let kullanılamaz
  let {
    appid = '',
    pageid = '',
    pagetitle = '',
    pageurl = '',
    host: hostProp = ''
  } = $props<{
    appid?: string;
    pageid?: string;
    pagetitle?: string;
    pageurl?: string;
    host?: string;
  }>();

  type Comment = {
    id: string;
    parent_id: string | null;
    content: string;
    author_name: string;
    created_at: string;
    is_admin: boolean;
    reactions?: Record<string, number>;
    children?: Comment[];
  };

  let host = $state('');
  let comments = $state<Comment[]>([]);
  let loading = $state(true);
  let error = $state('');

  let newCommentContent = $state('');
  let newCommentAuthor = $state('');
  let newCommentEmail = $state('');

  let submitting = $state(false);
  let successMessage = $state('');
  let replyToId = $state<string | null>(null);

  onMount(async () => {
    // hostProp'u al; yoksa sayfanın kendi origin'ini kullan
    host = hostProp || window.location.origin;
    await fetchComments();
  });

  function hasValidConfig() {
    return !!appid.trim() && !!pageid.trim();
  }

  async function fetchComments() {
    try {
      loading = true;
      error = '';

      if (!hasValidConfig()) {
        comments = [];
        error = 'Wombat widget is missing appId or pageId.';
        return;
      }

      const url = new URL(`${host}/api/comments`);
      url.searchParams.set('appId', appid);
      url.searchParams.set('pageId', pageid);

      const res = await fetch(url.toString());
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error('Wombat widget is misconfigured. Please provide appId and pageId.');
        }
        throw new Error('Failed to load comments');
      }
      const data = await res.json();
      comments = buildCommentTree(data.comments || []);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function buildCommentTree(flatComments: Comment[]): Comment[] {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    flatComments.forEach(c => {
      map.set(c.id, { ...c, children: [] });
    });

    flatComments.forEach(c => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children!.push(map.get(c.id)!);
        }
      } else {
        roots.push(map.get(c.id)!);
      }
    });

    return roots;
  }

  async function submitComment(e: Event) {
    e.preventDefault();
    if (!newCommentContent.trim() || !newCommentAuthor.trim()) return;
    if (!hasValidConfig()) {
      error = 'Wombat widget is missing appId or pageId.';
      return;
    }

    try {
      submitting = true;
      error = '';
      const url = `${host}/api/comments`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: appid,
          pageId: pageid,
          pageTitle: pagetitle || document.title,
          pageUrl: pageurl || window.location.href,
          content: newCommentContent,
          authorName: newCommentAuthor,
          authorEmail: newCommentEmail,
          parentId: replyToId
        })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Submission failed (${res.status})`);
      }
      const data = await res.json();

      newCommentContent = '';
      if (data.status === 'pending') {
        successMessage = 'Your comment is awaiting moderation.';
      } else {
        successMessage = 'Comment posted successfully.';
        await fetchComments();
      }

      replyToId = null;
    } catch (err: any) {
      alert(err.message);
    } finally {
      submitting = false;
      setTimeout(() => successMessage = '', 5000);
    }
  }

  function getReactorKey() {
    const storageKey = 'wombat-reactor-key';
    let key = localStorage.getItem(storageKey);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(storageKey, key);
    }
    return key;
  }

  async function reactToComment(commentId: string, emoji: string) {
    if (!hasValidConfig()) {
      error = 'Wombat widget is missing appId or pageId.';
      return;
    }
    try {
      error = '';
      const res = await fetch(`${host}/api/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          emoji,
          reactorKey: getReactorKey(),
          action: 'toggle'
        })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Reaction failed (${res.status})`);
      }
      await fetchComments();
    } catch (err: any) {
      error = err.message;
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="wombat-wrapper">
  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="comments-list">
    {#if loading}
      <div class="loading">Loading comments...</div>
    {:else if comments.length === 0 && !error}
      <div class="empty">No comments yet. Be the first!</div>
    {:else}
      {#each comments as comment}
        <CommentItem
          {comment}
          onReply={(id: string) => { replyToId = id; }}
          onReact={reactToComment}
        />
      {/each}
    {/if}
  </div>

  <div class="form-wrapper">
    {#if replyToId}
      <div class="replying-notice">
        Replying to a comment
        <button onclick={() => replyToId = null}>Cancel</button>
      </div>
    {/if}

    {#if successMessage}
      <div class="success">{successMessage}</div>
    {/if}

    <form onsubmit={submitComment}>
      <div class="input-row">
        <input type="text" placeholder="Name" bind:value={newCommentAuthor} required />
        <input type="email" placeholder="Email (optional)" bind:value={newCommentEmail} />
      </div>
      <textarea placeholder="Write a comment... (Markdown supported)" bind:value={newCommentContent} required rows="4"></textarea>
      <div class="actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Send'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  :host {
    display: block;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #09090b;
  }
  * { box-sizing: border-box; }
  .wombat-wrapper {
    max-width: 100%;
    margin: 0 auto;
  }
  .form-wrapper {
    margin-top: 2rem;
    border-top: 1px solid #e4e4e7;
    padding-top: 1.5rem;
  }
  input, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d4d4d8;
    border-radius: 0.875rem;
    font-size: 0.875rem;
    font-family: inherit;
    background: #fff;
    color: inherit;
    margin-bottom: 0.75rem;
  }
  textarea { resize: vertical; }
  .input-row {
    display: flex;
    gap: 0.75rem;
  }
  .input-row input { flex: 1; }
  button {
    background: #09090b;
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  button:hover { opacity: 0.9; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .replying-notice {
    font-size: 0.875rem;
    background: #fafafa;
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .replying-notice button {
    background: transparent;
    color: #ef4444;
    padding: 0;
  }
  .success {
    background: #fafafa;
    color: #09090b;
    padding: 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  .error { color: #7f1d1d; font-size: 0.875rem; margin-bottom: 1rem; }
  .loading, .empty {
    text-align: center;
    color: #a1a1aa;
    font-size: 0.875rem;
    padding: 2rem 0;
  }

  @media (prefers-color-scheme: dark) {
    :host { color: #d1d5db; }
    .form-wrapper { border-color: #374151; }
    input, textarea {
      background: #1f2937;
      border-color: #374151;
      color: #f3f4f6;
    }
    button { background: #e5e7eb; color: #111827; }
    .replying-notice { background: #374151; }
    .success { background: #064e3b; color: #34d399; }
  }
</style>
