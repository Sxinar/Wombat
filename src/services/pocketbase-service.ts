import type { AuthSession, CommentRecord, CreateCommentInput } from '../types/comment';
import type { CommentsService } from './comments-service';

export const pocketbaseService: CommentsService = {
  async listApproved() {
    return [];
  },
  async listPending() {
    return [];
  },
  async listAll() {
    return [];
  },
  async createComment(input: CreateCommentInput) {
    return {
      id: crypto.randomUUID(),
      page_id: input.pageId,
      name: input.name,
      email: input.email,
      comment: input.comment,
      is_approved: input.isApproved ?? false,
      parent_id: input.parentId ?? null,
      created_at: new Date().toISOString(),
    } satisfies CommentRecord;
  },
  async approveComment() {},
  async deleteComment() {},
  async replyToComment(parentId, input) {
    return this.createComment({
      ...input,
      parentId,
      isApproved: true,
    });
  },
  async signIn() {
    return { accessToken: 'pocketbase-placeholder' } satisfies AuthSession;
  },
  async signOut() {},
  async getSession() {
    return null;
  },
};
