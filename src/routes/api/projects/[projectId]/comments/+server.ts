import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, ObjectId } from '$lib/server/mongo';

async function getProjectOrFail(projectId: string, userId: string) {
	const db = await getDb();
	const project = await db.collection<any>('projects').findOne({ _id: projectId, user_id: userId });
	return { db, project };
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const { db, project } = await getProjectOrFail(params.projectId, locals.user.id);
	if (!project) return json({ error: 'Not found' }, { status: 404 });

	const threads = await db.collection<any>('threads').find({ project_id: params.projectId }).sort({ created_at: -1 }).toArray();
	const threadIds = threads.map((thread) => thread._id);
	const comments = threadIds.length
		? await db.collection<any>('comments').find({ thread_id: { $in: threadIds } }).sort({ created_at: -1 }).toArray()
		: [];

	return json({ threads, comments });
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const commentId = typeof body?.commentId === 'string' ? body.commentId : '';
	const status = typeof body?.status === 'string' ? body.status : '';
	if (!commentId || !['pending', 'approved', 'spam'].includes(status)) {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	const { db, project } = await getProjectOrFail(params.projectId, locals.user.id);
	if (!project) return json({ error: 'Not found' }, { status: 404 });

	const comment = await db.collection<any>('comments').findOne({ _id: commentId });
	if (!comment) return json({ error: 'Not found' }, { status: 404 });

	const thread = await db.collection<any>('threads').findOne({ _id: comment.thread_id, project_id: params.projectId });
	if (!thread) return json({ error: 'Not found' }, { status: 404 });

	await db.collection('comments').updateOne({ _id: commentId }, { $set: { status } });
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const commentId = typeof body?.commentId === 'string' ? body.commentId : '';
	if (!commentId) return json({ error: 'Invalid payload' }, { status: 400 });

	const { db, project } = await getProjectOrFail(params.projectId, locals.user.id);
	if (!project) return json({ error: 'Not found' }, { status: 404 });
	await db.collection('comments').deleteOne({ _id: commentId });
	await db.collection('comment_reactions').deleteMany({ comment_id: commentId });
	return json({ success: true });
};
