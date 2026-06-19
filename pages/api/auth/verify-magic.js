// POST { token }
// Verifies a magic link token and returns a session token if valid.
// Single-use: marks the token used in Redis (SET NX) immediately on first success.
// Rate limit: 10 verification attempts per IP per minute.

const crypto = require('crypto');
const { verifyMagicToken } = require('../../../lib/magic-link');
const { getTenantById, buildToken } = require('../../../lib/tenant-auth');
const { exec, isRateLimited, isConfigured } = require('../../../lib/upstash');

function usedTokenKey(tokenStr) {
  return 'used:' + crypto.createHash('sha256').update(tokenStr).digest('hex').slice(0, 32);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (await isRateLimited(req, 'verify', 10)) {
    return res.status(429).json({ valid: false, error: 'Too many attempts. Please wait a minute and try again.' });
  }

  const { token } = req.body || {};
  const claims = verifyMagicToken(token);

  if (!claims) {
    return res.status(200).json({
      valid: false,
      error: 'This magic link has expired or is invalid. Please request a new one.',
    });
  }

  // Single-use enforcement: SET NX returns "OK" on first use, null if already consumed
  if (isConfigured()) {
    const usedKey = usedTokenKey(token);
    const { ok, result } = await exec(['SET', usedKey, '1', 'NX', 'EX', '900']);
    if (ok && result === null) {
      return res.status(200).json({
        valid: false,
        error: 'This magic link has already been used. Please request a new one.',
      });
    }
    // ok:false = Redis error → fail open, proceed (logged inside exec)
  }

  const tenant = getTenantById(claims.tenantId);
  if (!tenant) {
    return res.status(200).json({ valid: false, error: 'Tenant not found.' });
  }

  const issuedAt = Date.now();
  const sessionToken = buildToken(tenant.tenantId, issuedAt);

  return res.status(200).json({
    valid: true,
    plan: tenant.plan,
    tenantId: tenant.tenantId,
    token: sessionToken,
    issuedAt,
  });
}
