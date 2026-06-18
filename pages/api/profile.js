const { getProfile, setProfile } = require('../../lib/sheets');

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  website: '',
  brokerage: '',
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
      const incoming = req.body || {};
      const existing = (await getProfile()) || DEFAULT_PROFILE;
      const merged = { ...existing, ...incoming };
      await setProfile(merged);
      return res.status(200).json({ profile: merged });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
