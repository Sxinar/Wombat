import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureAdminByEmail } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.is_admin) return json({ error: 'Not authorized' }, { status: 403 });
	const body = await request.json().catch(() => null);
	const targetEmail = typeof body?.targetEmail === 'string' ? body.targetEmail.trim() : '';
	const makeAdmin = !!body?.makeAdmin;
	if (!targetEmail) return json({ error: 'Missing targetEmail' }, { status: 400 });

	const updated = await ensureAdminByEmail(targetEmail, makeAdmin);
	if (!updated) return json({ error: 'User not found' }, { status: 404 });
	return json({ success: true });
};
