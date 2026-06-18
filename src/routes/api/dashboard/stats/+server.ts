import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/mongo';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = await getDb();
	const projectIds = (await db.collection<any>('projects').find({ user_id: locals.user.id }, { projection: { _id: 1 } }).toArray()).map((project) => project._id);

	const threads = projectIds.length
		? await db.collection<any>('threads').find({ project_id: { $in: projectIds } }).toArray()
		: [];
	const threadIds = threads.map((thread) => thread._id);
	const comments = threadIds.length
		? await db.collection<any>('comments').find({ thread_id: { $in: threadIds } }).toArray()
		: [];
	const reactions = comments.length
		? await db.collection<any>('comment_reactions').countDocuments({ comment_id: { $in: comments.map((comment) => comment._id) } })
		: 0;

	return json({
		totalProjects: projectIds.length,
		totalThreads: threadIds.length,
		totalComments: comments.length,
		pendingComments: comments.filter((comment) => comment.status === 'pending').length,
		approvedComments: comments.filter((comment) => comment.status === 'approved').length,
		reactions,
		recentComments: comments.filter((comment) => new Date(comment.created_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length
	});
};
