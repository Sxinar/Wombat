import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/mongo';
import { hashPassword } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const resetCode = typeof body?.resetCode === 'string' ? body.resetCode.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!email || !password) return json({ error: 'Missing email or password' }, { status: 400 });
	if (!resetCode) return json({ error: 'Reset code is required' }, { status: 400 });

	const db = await getDb();
	const user = await db.collection<any>('users').findOne({ email });
	if (!user) return json({ error: 'User not found' }, { status: 404 });

	const expectedCode = `${user._id}:${user.email}`;
	const isValidResetCode = resetCode === expectedCode;
	if (!isValidResetCode) return json({ error: 'Invalid reset code' }, { status: 401 });

	await db.collection<any>('users').updateOne(
		{ _id: user._id },
		{ $set: { password_hash: await hashPassword(password) } }
	);

	return json({ success: true, message: 'Password reset successfully' });
};
