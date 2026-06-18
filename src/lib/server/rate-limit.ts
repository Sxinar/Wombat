import { randomUUID } from 'node:crypto';
import { getDb } from './mongo';

export async function checkAbuseLimit(scope: string, maxCount: number, windowSeconds: number) {
	const db = await getDb();
	const now = new Date();
	const windowStart = new Date(now.getTime() - windowSeconds * 1000);
	const key = scope || randomUUID();

	const record = await db.collection<any>('abuse_limits').findOne({ scope: key });
	if (!record) {
		await db.collection<any>('abuse_limits').insertOne({ scope: key, count: 1, window_started_at: now });
		return true;
	}

	if (record.window_started_at && record.window_started_at < windowStart) {
		await db.collection<any>('abuse_limits').updateOne(
			{ scope: key },
			{ $set: { count: 1, window_started_at: now } }
		);
		return true;
	}

	if ((record.count || 0) >= maxCount) {
		return false;
	}

	await db.collection<any>('abuse_limits').updateOne({ scope: key }, { $inc: { count: 1 } });
	return true;
}
