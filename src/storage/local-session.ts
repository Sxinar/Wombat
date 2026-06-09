import type { AuthSession } from '../types/comment';

const KEY = 'secomment.session';

export const sessionStorage = {
  read(): AuthSession | null {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  },
  write(session: AuthSession | null): void {
    if (!session) {
      window.localStorage.removeItem(KEY);
      return;
    }
    window.localStorage.setItem(KEY, JSON.stringify(session));
  },
};
