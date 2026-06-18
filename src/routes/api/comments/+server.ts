import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'node:crypto';
import { getDb } from '$lib/server/mongo';
import { checkAbuseLimit } from '$lib/server/rate-limit';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH',
	'Access-Control-Allow-Headers': 'Content-Type'
};

const COMMENT_LIMIT_WINDOW_SECONDS = 900;
const COMMENT_LIMIT_MAX = 5;
const REACTION_LIMIT_WINDOW_SECONDS = 900;
const REACTION_LIMIT_MAX = 20;

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
	if (!raw.trim()) throw new Error('Empty request body');
	return JSON.parse(raw);
}

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders });
};

export const GET: RequestHandler = async ({ url }) => {
	const appId = url.searchParams.get('appId');
	const pageId = url.searchParams.get('pageId');

	if (!appId || !pageId) {
		return json({ error: 'Missing appId or pageId' }, { status: 400, headers: corsHeaders });
	}

	const db = await getDb();
	const thread = await db.collection<any>('threads').findOne({ project_id: appId, page_id: pageId });
	if (!thread) return json({ comments: [] }, { headers: corsHeaders });

	const comments = await db.collection<any>('comments')
		.find({ thread_id: thread._id, status: 'approved' })
		.sort({ created_at: 1 })
		.toArray();

	const reactions = comments.length
		? await db.collection<any>('comment_reactions')
			.find({ comment_id: { $in: comments.map((comment) => comment._id) } })
			.toArray()
		: [];

	const reactionMap = new Map<string, Record<string, number>>();
	for (const reaction of reactions) {
		const current = reactionMap.get(String(reaction.comment_id)) || {};
		current[reaction.emoji] = (current[reaction.emoji] || 0) + 1;
		reactionMap.set(String(reaction.comment_id), current);
	}

	return json({
		comments: comments.map((comment) => ({
			...comment,
			reactions: reactionMap.get(String(comment._id)) || {}
		}))
	}, { headers: corsHeaders });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await readJsonBody(request);
		const normalizedAppId = normalizeText(body?.appId, 100);
		const normalizedPageId = normalizeText(body?.pageId, 200);
		const normalizedPageTitle = normalizeText(body?.pageTitle, 300);
		const normalizedPageUrl = normalizeText(body?.pageUrl, 2048);
		const normalizedContent = normalizeText(body?.content, 10000);
		const normalizedAuthorName = normalizeText(body?.authorName, 120);
		const normalizedAuthorEmail = normalizeText(body?.authorEmail, 254);
		const normalizedParentId = normalizeText(body?.parentId, 100);
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
		const allowed = await checkAbuseLimit(rateKey, COMMENT_LIMIT_MAX, COMMENT_LIMIT_WINDOW_SECONDS);
		if (!allowed) return json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders });

		const db = await getDb();
		let thread = await db.collection<any>('threads').findOne({ project_id: normalizedAppId, page_id: normalizedPageId });
		if (!thread) {
			const threadDoc = {
				_id: randomUUID(),
				project_id: normalizedAppId,
				page_id: normalizedPageId,
				page_title: normalizedPageTitle,
				page_url: normalizedPageUrl,
				created_at: new Date()
			};
			await db.collection<any>('threads').insertOne(threadDoc);
			thread = threadDoc;
		}

		const comment = {
			_id: randomUUID(),
			thread_id: thread._id,
			parent_id: normalizedParentId || null,
			content: normalizedContent,
			author_name: normalizedAuthorName,
			author_email: normalizedAuthorEmail || null,
			author_url: null,
			status: 'pending',
			is_admin: false,
			created_at: new Date()
		};

		await db.collection<any>('comments').insertOne(comment);
		return json({ success: true, status: 'pending', comment }, { headers: corsHeaders });
	} catch (err: any) {
		const status = err?.message === 'Invalid JSON payload' || err?.message === 'Empty request body' ? 400 : 500;
		return json({ error: err?.message || 'Unknown error' }, { status, headers: corsHeaders });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
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

		const db = await getDb();
		const comment = await db.collection<any>('comments').findOne({ _id: commentId, status: 'approved' });
		if (!comment) return json({ error: 'Comment not found' }, { status: 404, headers: corsHeaders });

		const rateKey = `reaction:${getClientIp(request)}`;
		const allowed = await checkAbuseLimit(rateKey, REACTION_LIMIT_MAX, REACTION_LIMIT_WINDOW_SECONDS);
		if (!allowed) return json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders });

		const existingReaction = await db.collection<any>('comment_reactions').findOne({ comment_id: commentId, emoji, reactor_key: reactorKey });
		if (action === 'remove' || (action === 'toggle' && existingReaction)) {
			await db.collection<any>('comment_reactions').deleteMany({ comment_id: commentId, emoji, reactor_key: reactorKey });
			return json({ success: true }, { headers: corsHeaders });
		}

		if (existingReaction) {
			return json({ success: true, removed: true }, { headers: corsHeaders });
		}

		await db.collection<any>('comment_reactions').insertOne({
			_id: randomUUID(),
			comment_id: commentId,
			emoji,
			reactor_key: reactorKey,
			created_at: new Date()
		});
		return json({ success: true, added: true }, { headers: corsHeaders });
	} catch (err: any) {
		const status = err?.message === 'Invalid JSON payload' || err?.message === 'Empty request body' ? 400 : 500;
		return json({ error: err?.message || 'Unknown error' }, { status, headers: corsHeaders });
	}
};
