import type { AuthSession, CommentRecord, CreateCommentInput } from '../types/comment';

export interface CommentsService {
  listApproved(pageId: string): Promise<CommentRecord[]>;
  listPending(): Promise<CommentRecord[]>;
  listAll(pageId?: string): Promise<CommentRecord[]>;
  createComment(input: CreateCommentInput): Promise<CommentRecord>;
  approveComment(id: string): Promise<void>;
  deleteComment(id: string): Promise<void>;
  replyToComment(parentId: string, input: Omit<CreateCommentInput, 'parentId'>): Promise<CommentRecord>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
}
