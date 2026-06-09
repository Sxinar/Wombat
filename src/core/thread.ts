import type { CommentRecord, CommentThread } from '../types/comment';

export function buildThread(comments: CommentRecord[]): CommentThread[] {
  const map = new Map<string, CommentThread>();
  const roots: CommentThread[] = [];

  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of map.values()) {
    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}
