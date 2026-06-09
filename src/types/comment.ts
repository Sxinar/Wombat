export type CommentId = string;

export interface CommentRecord {
  id: CommentId;
  page_id: string;
  name: string;
  email: string;
  comment: string;
  is_approved: boolean;
  parent_id: CommentId | null;
  created_at: string;
}

export interface CommentThread extends CommentRecord {
  replies: CommentThread[];
}

export interface CreateCommentInput {
  pageId: string;
  name: string;
  email: string;
  comment: string;
  parentId?: string | null;
  isApproved?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
}
