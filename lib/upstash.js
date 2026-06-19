// Upstash Redis REST client — no SDK, uses native fetch (Node 18+).
// All functions fail open: returns safe defaults when Redis is unconfigured
// or unreachable so nothing breaks during setup or downtime.

const BASE = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

function isConfigured() {
  return !!(BASE && TOKEN);
}

const HEADERS = () => ({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' });

// Executes one Redis command. Returns { ok, result } where:
//   ok:true  result:"OK"  → command succeeded
//   ok:true  result:null  → Redis returned nil (e.g. SET NX when key exists)
//   ok:false              → Redis unavailable or not configured
async function exec(command) {
  if (!isConfigured()) return { ok: false };
  try {
    const r = await fetch(BASE, { method: 'POST', headers: HEADERS(), body: JSON.stringify(command) });
    const json = await r.json();
    if (json.error) { console.error('[upstash]', json.error); return { ok: false }; }
    return { ok: true, result: json.result ?? null };
  } catch (e) {
    console.error('[upstash] exec error:', e.message);
    return { ok: false };
  }
}

// Fixed-window rate limiter. Returns true when the caller should be blocked.
// Window resets on the next UTC minute boundary.
async function isRateLimited(req, endpoint, limit) {
  if (!isConfigured()) return false;
  const ip = getClientIp(req);
  const window = Math.floor(Date.now() / 60000);
  const key = `rl:${endpoint}:${ip}:${window}`;
  try {
    const r = await fetch(`${BASE}/pipeline`, {
      method: 'POST',
      headers: HEADERS(),
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, 120]]),
    });
    const results = await r.json();
    const count = results[0]?.result ?? 0;
    return count > limit;
  } catch (e) {
    console.error('[upstash] rate-limit error:', e.message);
    return false; // fail open
  }
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

module.exports = { exec, isRateLimited, isConfigured };
