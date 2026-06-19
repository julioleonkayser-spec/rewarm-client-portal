// Shared fetch helper for portal pages.
// Reads the signed session token from localStorage and injects it as
// an Authorization header on every API call. API routes use verifyRequest()
// from lib/tenant-auth.js to validate the token server-side.
//
// Usage: import { sessionFetch } from '../../lib/portal/fetcher';
//        const res = await sessionFetch('/api/profile');

export function getSessionHeaders() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('rewarm_session');
    if (!raw) return {};
    const s = JSON.parse(raw);
    if (s.token) return { Authorization: 'Bearer ' + s.token };
  } catch {}
  return {};
}

export function sessionFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}), ...getSessionHeaders() };
  return fetch(url, { ...opts, headers });
}
