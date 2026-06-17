<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import CommentItem from './CommentItem.svelte';

  // Svelte 5: $props() kullanımı
  let {
    comment,
    onReply,
    onReact
  } = $props<{
    comment: any;
    onReply: (id: string) => void;
    onReact: (id: string, emoji: string) => void;
  }>();

  const reactionEmojis = ['👍', '❤️', '😂', '🎉'];

  function parseMarkdown(content: string) {
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }

  function getReactionCount(emoji: string) {
    return comment.reactions?.[emoji] || 0;
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
    <div class="author-line">
      <span class="author">{comment.author_name}</span>
      {#if comment.is_admin}
        <span class="badge">Admin</span>
      {/if}
    </div>
    <span class="date">{formatDate(comment.created_at)}</span>
  </div>

  <div class="content">
    {@html parseMarkdown(comment.content)}
  </div>

  <div class="actions">
    <div class="reactions">
      {#each reactionEmojis as emoji}
        <button class="reaction-btn" onclick={() => onReact(comment.id, emoji)}>
          <span>{emoji}</span>
          <span>{getReactionCount(emoji)}</span>
        </button>
      {/each}
    </div>
    <button class="reply-btn" onclick={() => onReply(comment.id)}>Reply</button>
  </div>

  {#if comment.children && comment.children.length > 0}
    <div class="replies">
      {#each comment.children as child}
        <CommentItem comment={child} {onReply} {onReact} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .comment {
    margin-bottom: 1rem;
    padding: 1rem 1rem 0.75rem;
    border: 1px solid #e4e4e7;
    border-radius: 1rem;
    background: #fff;
  }
  .header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }
  .author-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .author {
    font-weight: 600;
    font-size: 0.93rem;
  }
  .date {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
  }
  .badge {
    background: #09090b;
    color: white;
    font-size: 0.65rem;
    padding: 0.15rem 0.35rem;
    border-radius: 999px;
  }
  .content {
    font-size: 0.93rem;
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
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .reactions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .reaction-btn {
    background: #fafafa;
    color: #09090b;
    border: 1px solid #e4e4e7;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.74rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }
  .reply-btn {
    background: transparent;
    border: none;
    color: #09090b;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
  }
  .reply-btn:hover {
    color: #52525b;
    text-decoration: underline;
  }

  .replies {
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 2px solid #e5e7eb;
  }

  .date { color: #71717a; }
  .content :global(pre) { background: #fafafa; }
  .content :global(code) { background: #fafafa; }
  .replies { border-color: #e4e4e7; }
</style>
