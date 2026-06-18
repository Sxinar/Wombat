import { MongoClient, ObjectId, type Db } from 'mongodb';
import { MONGODB_DB_NAME, MONGODB_URI } from '$env/static/private';

if (!MONGODB_URI) {
	throw new Error('Missing MONGODB_URI');
}

const uri = MONGODB_URI;
const dbName = MONGODB_DB_NAME || 'wombat';

declare global {
	// eslint-disable-next-line no-var
	var __wombatMongoClient: MongoClient | undefined;
	// eslint-disable-next-line no-var
	var __wombatMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClient() {
	return new MongoClient(uri);
}

export async function getMongoClient() {
	if (!globalThis.__wombatMongoClientPromise) {
		const client = globalThis.__wombatMongoClient ?? createClient();
		globalThis.__wombatMongoClient = client;
		globalThis.__wombatMongoClientPromise = client.connect();
	}

	return globalThis.__wombatMongoClientPromise;
}

export async function getDb(): Promise<Db> {
	const client = await getMongoClient();
	return client.db(dbName);
}

export { ObjectId };
