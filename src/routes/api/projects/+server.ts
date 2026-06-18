import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'node:crypto';
import { getDb } from '$lib/server/mongo';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = await getDb();
	const projects = await db.collection<any>('projects')
		.find({ user_id: locals.user.id })
		.sort({ created_at: -1 })
		.toArray();
	return json({
		projects: projects.map((project) => ({ ...project, id: project._id }))
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	if (!name) return json({ error: 'Missing project name' }, { status: 400 });

	const db = await getDb();
	const project = {
		_id: randomUUID(),
		user_id: locals.user.id,
		name,
		created_at: new Date()
	};

	await db.collection<any>('projects').insertOne(project);
	return json({ project: { ...project, id: project._id } });
};
