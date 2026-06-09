import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthSession, CommentRecord, CreateCommentInput } from '../types/comment';
import { sessionStorage } from '../storage/local-session';
import type { CommentsService } from './comments-service';

type DatabaseShape = {
  public: {
    Tables: {
      comments: {
        Row: CommentRecord;
        Insert: Partial<CommentRecord>;
        Update: Partial<CommentRecord>;
      };
    };
  };
};

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const client: SupabaseClient<DatabaseShape> | null =
  url && anonKey ? createClient<DatabaseShape>(url, anonKey) : null;

function assertClient(): SupabaseClient<DatabaseShape> {
  if (!client) {
    throw new Error('Supabase ortam değişkenleri tanımlı değil.');
  }
  return client;
}

export const supabaseService: CommentsService = {
  async listApproved(pageId) {
    const { data, error } = await assertClient()
      .from('comments')
      .select('*')
      .eq('page_id', pageId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  async listPending() {
    const { data, error } = await assertClient()
      .from('comments')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async listAll(pageId) {
    let query = assertClient().from('comments').select('*').order('created_at', { ascending: false });
    if (pageId) query = query.eq('page_id', pageId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  async createComment(input: CreateCommentInput) {
    const { data, error } = await assertClient()
      .from('comments')
      .insert({
        page_id: input.pageId,
        name: input.name,
        email: input.email,
        comment: input.comment,
        parent_id: input.parentId ?? null,
        is_approved: input.isApproved ?? false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  async approveComment(id) {
    const { error } = await assertClient().from('comments').update({ is_approved: true }).eq('id', id);
    if (error) throw error;
  },
  async deleteComment(id) {
    const { error } = await assertClient().from('comments').delete().eq('id', id);
    if (error) throw error;
  },
  async replyToComment(parentId, input) {
    return supabaseService.createComment({
      pageId: input.pageId,
      name: input.name,
      email: input.email,
      comment: input.comment,
      parentId,
      isApproved: true,
    });
  },
  async signIn(email, password) {
    const { data, error } = await assertClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    const session: AuthSession = {
      accessToken: data.session?.access_token ?? '',
      refreshToken: data.session?.refresh_token,
    };
    sessionStorage.write(session);
    return session;
  },
  async signOut() {
    await assertClient().auth.signOut();
    sessionStorage.write(null);
  },
  async getSession() {
    return sessionStorage.read();
  },
};
