import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase.server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const COMMENT_LIMIT_WINDOW_SECONDS = 900;
const COMMENT_LIMIT_MAX = 5;
const REACTION_LIMIT_WINDOW_SECONDS = 900;
const REACTION_LIMIT_MAX = 20;

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET({ url }: RequestEvent) {
  const appId = url.searchParams.get('appId');
  const pageId = url.searchParams.get('pageId');

  if (!appId || !pageId) {
    return json({ error: 'Missing appId or pageId' }, { status: 400, headers: corsHeaders });
  }

  // Fetch the thread first to ensure it exists and get its ID
  const { data: thread, error: threadError } = await supabaseAdmin
    .from('threads')
    .select('id')
    .eq('project_id', appId)
    .eq('page_id', pageId)
    .single();

  if (threadError || !thread) {
    // No thread means no comments yet, not an error
    return json({ comments: [] }, { headers: corsHeaders });
  }

  // Fetch approved comments
  const { data: comments, error: commentsError } = await supabaseAdmin
    .from('comments')
    .select('*')
    .eq('thread_id', thread.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (commentsError) {
    return json({ error: commentsError.message }, { status: 500, headers: corsHeaders });
  }

  const commentIds = (comments || []).map((comment) => comment.id);
  const reactions = commentIds.length > 0
    ? (await supabaseAdmin
        .from('comment_reactions')
        .select('comment_id, emoji')
        .in('comment_id', commentIds)).data
    : [];

  const reactionMap = new Map<string, Record<string, number>>();
  for (const reaction of reactions || []) {
    const current = reactionMap.get(reaction.comment_id) || {};
    current[reaction.emoji] = (current[reaction.emoji] || 0) + 1;
    reactionMap.set(reaction.comment_id, current);
  }

  const commentsWithReactions = (comments || []).map((comment) => ({
    ...comment,
    reactions: reactionMap.get(comment.id) || {}
  }));

  return json({ comments: commentsWithReactions }, { headers: corsHeaders });
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstForwarded = forwardedFor?.split(',')[0]?.trim();
  return firstForwarded || request.headers.get('x-real-ip') || 'unknown';
}

async function readJsonBody(request: Request) {
  const raw = await request.text();
  if (!raw.trim()) {
    throw new Error('Empty request body');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON payload');
  }
}

export async function POST({ request }: RequestEvent) {
  try {
    const body = await readJsonBody(request);
    const { appId, pageId, pageTitle, pageUrl, content, authorName, authorEmail, parentId } = body;

    const normalizedAppId = normalizeText(appId, 100);
    const normalizedPageId = normalizeText(pageId, 200);
    const normalizedPageTitle = normalizeText(pageTitle, 300);
    const normalizedPageUrl = normalizeText(pageUrl, 2048);
    const normalizedContent = normalizeText(content, 10000);
    const normalizedAuthorName = normalizeText(authorName, 120);
    const normalizedAuthorEmail = normalizeText(authorEmail, 254);
    const normalizedParentId = normalizeText(parentId, 100);
    const requestOrigin = request.headers.get('origin');
    const pageOrigin = normalizedPageUrl ? getOrigin(normalizedPageUrl) : null;

    if (!normalizedAppId || !normalizedPageId || !normalizedContent || !normalizedAuthorName) {
      return json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    if (normalizedContent.length < 1 || normalizedAuthorName.length < 2) {
      return json({ error: 'Invalid input' }, { status: 400, headers: corsHeaders });
    }

    if (normalizedAuthorEmail && !isValidEmail(normalizedAuthorEmail)) {
      return json({ error: 'Invalid email address' }, { status: 400, headers: corsHeaders });
    }

    if (requestOrigin && pageOrigin && requestOrigin !== pageOrigin) {
      return json({ error: 'Origin mismatch' }, { status: 403, headers: corsHeaders });
    }

    const rateKey = `comment:${getClientIp(request)}`;
    const { data: allowed } = await supabaseAdmin.rpc('check_abuse_limit', {
      p_scope: rateKey,
      p_max_count: COMMENT_LIMIT_MAX,
      p_window_seconds: COMMENT_LIMIT_WINDOW_SECONDS
    });

    if (allowed !== true) {
      return json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders });
    }

    // 1. Ensure thread exists (UPSERT essentially)
    // Wait, UPSERT on Supabase (PostgREST) requires the exact constraints or using an RPC.
    // Let's try select first, then insert if not found.
    let threadId = null;
    let { data: thread } = await supabaseAdmin
      .from('threads')
      .select('id')
      .eq('project_id', normalizedAppId)
      .eq('page_id', normalizedPageId)
      .single();

    if (thread) {
      threadId = thread.id;
    } else {
      const { data: newThread, error: insertThreadError } = await supabaseAdmin
        .from('threads')
        .insert({
          project_id: normalizedAppId,
          page_id: normalizedPageId,
          page_title: normalizedPageTitle,
          page_url: normalizedPageUrl
        })
        .select('id')
        .single();
      
      if (insertThreadError) throw insertThreadError;
      threadId = newThread.id;
    }

    // 2. Insert comment (always pending by default unless changed)
    // Here you would normally check if the project has pre-moderation disabled.
    // For now, we'll default to 'pending' as Wombat does.
    const status = 'pending'; 

    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        thread_id: threadId,
        parent_id: normalizedParentId || null,
        content: normalizedContent,
        author_name: normalizedAuthorName,
        author_email: normalizedAuthorEmail || null,
        status,
        is_admin: false
      })
      .select()
      .single();

    if (commentError) throw commentError;

    // TODO: Trigger webhooks or email notifications here

    return json({ success: true, status, comment }, { headers: corsHeaders });
  } catch (err: any) {
    const status = err.message === 'Invalid JSON payload' || err.message === 'Empty request body' ? 400 : 500;
    return json({ error: err.message }, { status, headers: corsHeaders });
  }
}

export async function PATCH({ request }: RequestEvent) {
  try {
    const body = await readJsonBody(request);
    const commentId = normalizeText(body?.commentId, 100);
    const emoji = normalizeText(body?.emoji, 8);
    const action = normalizeText(body?.action, 16);
    const reactorKey = normalizeText(body?.reactorKey, 128);

    const allowedEmojis = ['👍', '❤️', '😂', '🎉'];
    if (!commentId || !reactorKey || !allowedEmojis.includes(emoji)) {
      return json({ error: 'Invalid reaction payload' }, { status: 400, headers: corsHeaders });
    }

    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('id, thread_id, status')
      .eq('id', commentId)
      .single();

    if (!comment || comment.status !== 'approved') {
      return json({ error: 'Comment not found' }, { status: 404, headers: corsHeaders });
    }

    const rateKey = `reaction:${getClientIp(request)}`;
    const { data: allowed } = await supabaseAdmin.rpc('check_abuse_limit', {
      p_scope: rateKey,
      p_max_count: REACTION_LIMIT_MAX,
      p_window_seconds: REACTION_LIMIT_WINDOW_SECONDS
    });

    if (allowed !== true) {
      return json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders });
    }

    const { data: existingReaction } = await supabaseAdmin
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('emoji', emoji)
      .eq('reactor_key', reactorKey)
      .maybeSingle();

    if (action === 'remove' || (action === 'toggle' && existingReaction)) {
      const { error } = await supabaseAdmin
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('emoji', emoji)
        .eq('reactor_key', reactorKey);

      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === 'toggle' && existingReaction) {
      return json({ success: true, removed: true }, { headers: corsHeaders });
    }

    const { error } = await supabaseAdmin
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        emoji,
        reactor_key: reactorKey
      });

    if (error) throw error;
    return json({ success: true, added: true }, { headers: corsHeaders });
  } catch (err: any) {
    const status = err.message === 'Invalid JSON payload' || err.message === 'Empty request body' ? 400 : 500;
    return json({ error: err.message }, { status, headers: corsHeaders });
  }
}
