// Validates portal access keys server-side so keys never ship in the JS bundle.
// Returns tenantId, signed token, and issuedAt so the client session carries
// verified tenant identity. See lib/tenant-auth.js for token format.

const { getTenantByKey, buildToken } = require('../../../lib/tenant-auth');

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body || {};
  if (!key) return res.status(400).json({ valid: false, error: 'No key provided' });

  const tenant = getTenantByKey(key);
  if (!tenant) return res.status(200).json({ valid: false });

  const issuedAt = Date.now();
  const token = buildToken(tenant.tenantId, issuedAt);

  return res.status(200).json({
    valid: true,
    plan: tenant.plan,
    tenantId: tenant.tenantId,
    token,
    issuedAt,
  });
}
