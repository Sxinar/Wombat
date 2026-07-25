import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { dev } from '$app/environment';
import { JWT_SECRET } from '$env/static/private';
import { getDb } from './mongo';

const encoder = new TextEncoder();
const secret = encoder.encode(JWT_SECRET);
const SESSION_COOKIE = 'wombat_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = {
	id: string;
	email: string;
	is_admin: boolean;
};

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string) {
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(secret);
}

export async function verifySessionToken(token: string) {
	const { payload } = await jwtVerify(token, secret);
	return typeof payload.sub === 'string' ? payload.sub : null;
}

export async function setSessionCookie(cookie: import('@sveltejs/kit').Cookies, userId: string) {
	const token = await createSessionToken(userId);
	cookie.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_TTL_MS / 1000,
		expires: new Date(Date.now() + SESSION_TTL_MS)
	});
}

export function clearSessionCookie(cookie: import('@sveltejs/kit').Cookies) {
	cookie.delete(SESSION_COOKIE, { path: '/' });
}

export async function getSessionUserFromCookie(cookieHeader: string | null): Promise<SessionUser | null> {
	const token = cookieHeader
		?.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${SESSION_COOKIE}=`))
		?.slice(SESSION_COOKIE.length + 1);

	if (!token) return null;
	const userId = await verifySessionToken(token).catch(() => null);
	if (!userId) return null;

	const db = await getDb();
	const user = await db.collection<any>('users').findOne(
		{ _id: userId },
		{ projection: { email: 1, is_admin: 1 } }
	);

	if (!user) return null;

	return {
		id: userId,
		email: user.email,
		is_admin: !!user.is_admin
	};
}

export async function createUser(email: string, password: string) {
	const db = await getDb();
	const existing = await db.collection<any>('users').findOne({ email: email.toLowerCase() });
	if (existing) return null;

	const userId = randomUUID();
	const resetCode = `${userId}:${email.toLowerCase()}`;
	await db.collection<any>('users').insertOne({
		_id: userId,
		email: email.toLowerCase(),
		password_hash: await hashPassword(password),
		reset_code: resetCode,
		is_admin: false,
		created_at: new Date()
	});

	return userId;
}

export async function loginUser(email: string, password: string) {
	const db = await getDb();
	const user = await db.collection<any>('users').findOne({ email: email.toLowerCase() });
	if (!user?.password_hash) return null;
	const valid = await verifyPassword(password, user.password_hash);
	return valid ? String(user._id) : null;
}

export async function ensureAdminByEmail(email: string, makeAdmin: boolean) {
	const db = await getDb();
	const result = await db.collection<any>('users').updateOne(
		{ email: email.toLowerCase() },
		{ $set: { is_admin: makeAdmin } }
	);
	return result.matchedCount > 0;
}

export async function updateUserProfile(userId: string, data: { email?: string; username?: string; password?: string }) {
	const db = await getDb();
	const update: Record<string, unknown> = {};

	if (data.email) {
		const normalizedEmail = data.email.toLowerCase();
		const existing = await db.collection<any>('users').findOne({ email: normalizedEmail, _id: { $ne: userId } });
		if (existing) return { success: false, error: 'Email already in use' };
		update.email = normalizedEmail;
	}

	if (data.username !== undefined) {
		const normalizedUsername = data.username.trim();
		if (!normalizedUsername) return { success: false, error: 'Username is required' };
		update.username = normalizedUsername;
	}

	if (data.password) {
		update.password_hash = await hashPassword(data.password);
	}

	if (Object.keys(update).length === 0) return { success: false, error: 'Nothing to update' };

	await db.collection<any>('users').updateOne({ _id: userId }, { $set: update });
	return { success: true };
}
