import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/mongo';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = await getDb();
	const project = await db.collection<any>('projects').findOne({ _id: params.projectId, user_id: locals.user.id });
	if (!project) return json({ error: 'Not found' }, { status: 404 });

	return json({ project: { ...project, id: project._id } });
};
