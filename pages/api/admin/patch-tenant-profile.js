// POST /api/admin/patch-tenant-profile
// Header: Authorization: Bearer {ADMIN_SECRET}
// Body: { controlSheetId, dataSheetId?, retell_agent_id? }
//
// Writes server-controlled profile fields that the broker-facing PUT
// intentionally strips. Read-then-merge so no existing fields are lost.

const { getProfile, setProfile } = require('../../../lib/sheets');

const ALLOWED_SERVER_FIELDS = new Set(['dataSheetId', 'retell_agent_id', 'plan_name', 'billing_cycle_start']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ error: 'ADMIN_SECRET env var is not set' });

  const auth = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!auth || auth !== adminSecret) return res.status(401).json({ error: 'Unauthorized' });

  const { controlSheetId, ...updates } = req.body || {};
  if (!controlSheetId) return res.status(400).json({ error: 'controlSheetId is required' });

  const safeUpdates = {};
  for (const [k, v] of Object.entries(updates)) {
    if (ALLOWED_SERVER_FIELDS.has(k)) safeUpdates[k] = v;
  }
  if (Object.keys(safeUpdates).length === 0) {
    return res.status(400).json({ error: 'No allowed fields provided. Allowed: ' + [...ALLOWED_SERVER_FIELDS].join(', ') });
  }

  try {
    const existing = await getProfile(controlSheetId) || {};
    const merged = { ...existing, ...safeUpdates };
    await setProfile(merged, controlSheetId);
    return res.status(200).json({ ok: true, controlSheetId, updated: safeUpdates, profile: merged });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
