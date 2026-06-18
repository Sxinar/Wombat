import type { Handle } from '@sveltejs/kit';
import { getSessionUserFromCookie } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await getSessionUserFromCookie(event.request.headers.get('cookie'));
	return resolve(event);
};
