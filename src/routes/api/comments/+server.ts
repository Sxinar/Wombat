import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
  const { data: thread, error: threadError } = await supabase
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
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('thread_id', thread.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (commentsError) {
    return json({ error: commentsError.message }, { status: 500, headers: corsHeaders });
  }

  return json({ comments }, { headers: corsHeaders });
}

export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { appId, pageId, pageTitle, pageUrl, content, authorName, authorEmail, parentId } = body;

    if (!appId || !pageId || !content || !authorName) {
      return json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // 1. Ensure thread exists (UPSERT essentially)
    // Wait, UPSERT on Supabase (PostgREST) requires the exact constraints or using an RPC.
    // Let's try select first, then insert if not found.
    let threadId = null;
    let { data: thread } = await supabase
      .from('threads')
      .select('id')
      .eq('project_id', appId)
      .eq('page_id', pageId)
      .single();

    if (thread) {
      threadId = thread.id;
    } else {
      const { data: newThread, error: insertThreadError } = await supabase
        .from('threads')
        .insert({
          project_id: appId,
          page_id: pageId,
          page_title: pageTitle,
          page_url: pageUrl
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

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        thread_id: threadId,
        parent_id: parentId || null,
        content,
        author_name: authorName,
        author_email: authorEmail,
        status,
        is_admin: false
      })
      .select()
      .single();

    if (commentError) throw commentError;

    // TODO: Trigger webhooks or email notifications here

    return json({ success: true, status, comment }, { headers: corsHeaders });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
