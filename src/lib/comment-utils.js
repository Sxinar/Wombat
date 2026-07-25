export function getCommentId(comment) {
  if (!comment || typeof comment !== 'object') return '';
  const rawId = comment._id ?? comment.id ?? '';
  return typeof rawId === 'string' ? rawId : String(rawId ?? '');
}
