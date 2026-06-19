// POST { token }
// Verifies a magic link token and returns a session token if valid.
// The client stores the session in localStorage (matching the existing session model).

const { verifyMagicToken } = require('../../../lib/magic-link');
const { getTenantById, buildToken } = require('../../../lib/tenant-auth');

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body || {};
  const claims = verifyMagicToken(token);

  if (!claims) {
    return res.status(200).json({
      valid: false,
      error: 'This magic link has expired or is invalid. Please request a new one.',
    });
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
