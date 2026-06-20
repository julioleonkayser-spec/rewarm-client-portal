const { getProfile, setProfile } = require('../../lib/sheets');
const { verifyRequest, AuthError } = require('../../lib/tenant-auth');


const DEFAULT_PROFILE = {
  name: '',
  email: '',
  brokerage: '',
  language: 'en',
  market_type: 'residential',
  timezone: '',
  plan_name: '',
  billing_cycle_start: '',
  dataSheetId: '',
  retell_agent_id: '',
  // legacy fields kept for existing stored profiles
  phone: '',
  website: '',
  license: '',
  specialties: '',
  market: '',
  priceRange: '',
  avgDeal: '675000',
  commissionRate: '2.5',
};

export default async function handler(req, res) {
  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      const profile = await getProfile(tenant.controlSheetId);
      return res.status(200).json({ profile: profile || DEFAULT_PROFILE, isDefault: !profile });
    }

    if (req.method === 'PUT') {
      const incoming = req.body || {};
      const SERVER_ONLY = ['plan_name', 'billing_cycle_start', 'owner_email', 'dataSheetId'];
      SERVER_ONLY.forEach(f => delete incoming[f]);
      const existing = (await getProfile(tenant.controlSheetId)) || DEFAULT_PROFILE;
      const merged = { ...existing, ...incoming };
      await setProfile(merged, tenant.controlSheetId);
      return res.status(200).json({ profile: merged });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
