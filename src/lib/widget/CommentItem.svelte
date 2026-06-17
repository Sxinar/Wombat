<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import CommentItem from './CommentItem.svelte';

  // Svelte 5: $props() kullanımı
  let {
    comment,
    onReply
  } = $props<{
    comment: any;
    onReply: (id: string) => void;
  }>();

  function parseMarkdown(content: string) {
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="comment">
  <div class="header">
    <span class="author">{comment.author_name}</span>
    {#if comment.is_admin}
      <span class="badge">Admin</span>
    {/if}
    <span class="date">{formatDate(comment.created_at)}</span>
  </div>

  <div class="content">
    {@html parseMarkdown(comment.content)}
  </div>

  <div class="actions">
    <button class="reply-btn" onclick={() => onReply(comment.id)}>Reply</button>
  </div>

  {#if comment.children && comment.children.length > 0}
    <div class="replies">
      {#each comment.children as child}
        <CommentItem comment={child} {onReply} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .comment {
    margin-bottom: 1rem;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  .author {
    font-weight: 600;
    font-size: 0.875rem;
  }
  .date {
    font-size: 0.75rem;
    color: #6b7280;
  }
  .badge {
    background: #2563eb;
    color: white;
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
  }
  .content {
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }
  .content :global(p) { margin: 0 0 0.5rem 0; }
  .content :global(a) { color: #2563eb; text-decoration: none; }
  .content :global(a:hover) { text-decoration: underline; }
  .content :global(pre) { background: #f3f4f6; padding: 0.5rem; border-radius: 0.25rem; overflow-x: auto; }
  .content :global(code) { background: #f3f4f6; padding: 0.1rem 0.25rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8em; }

  .actions {
    margin-bottom: 1rem;
  }
  .reply-btn {
    background: transparent;
    border: none;
    color: #6b7280;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
  }
  .reply-btn:hover {
    color: #111827;
    text-decoration: underline;
  }

  .replies {
    margin-left: 1.5rem;
    padding-left: 1rem;
    border-left: 2px solid #e5e7eb;
  }

  @media (prefers-color-scheme: dark) {
    .date { color: #9ca3af; }
    .content :global(pre) { background: #374151; }
    .content :global(code) { background: #374151; }
    .reply-btn { color: #9ca3af; }
    .reply-btn:hover { color: #f3f4f6; }
    .replies { border-color: #374151; }
  }
</style>
