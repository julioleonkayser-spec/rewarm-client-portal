const { getProfile, setProfile } = require('../../lib/sheets');

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
  try {
    if (req.method === 'GET') {
      const profile = await getProfile();
      return res.status(200).json({ profile: profile || DEFAULT_PROFILE, isDefault: !profile });
    }

    if (req.method === 'PUT') {
      const { plan_name, ...rest } = req.body || {};
      const existing = (await getProfile()) || DEFAULT_PROFILE;
      // Only allow setting plan_name when no paid plan is stored yet (e.g., initial login).
      // Clients cannot downgrade or switch their own paid plan through the UI.
      const allowPlanChange = !existing.plan_name || existing.plan_name === 'Demo';
      const merged = {
        ...existing,
        ...rest,
        ...(allowPlanChange && plan_name ? { plan_name } : {}),
      };
      await setProfile(merged);
      return res.status(200).json({ profile: merged });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
