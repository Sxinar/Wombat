import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createUser, loginUser, setSessionCookie } from '$lib/server/auth';

async function readBody(request: Request) {
	const payload = await request.json().catch(() => null);
	return payload && typeof payload === 'object' ? payload : null;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await readBody(request);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!email || !password) {
		return json({ error: 'Missing email or password' }, { status: 400 });
	}

	let userId = await loginUser(email, password);
	let created = false;

	if (!userId) {
		userId = await createUser(email, password);
		created = !!userId;
	}

	if (!userId) {
		return json({ error: 'Invalid credentials' }, { status: 401 });
	}

	await setSessionCookie(cookies, userId);
	return json({ success: true, created });
};
