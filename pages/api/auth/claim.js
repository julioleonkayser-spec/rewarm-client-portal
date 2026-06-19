// POST { key, email }
// Validates access key, stores owner email in the tenant's Profile sheet,
// then sends a magic login link. This is the first-time account claim flow.

const { getTenantByKey } = require('../../../lib/tenant-auth');
const { getProfile, setProfile } = require('../../../lib/sheets');
const { createMagicToken, buildMagicUrl, sendMagicLinkEmail } = require('../../../lib/magic-link');
const { isRateLimited } = require('../../../lib/upstash');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 3 claim attempts per IP per minute
  if (await isRateLimited(req, 'claim', 3)) {
    return res.status(429).json({ sent: false, error: 'Too many attempts. Please wait a minute and try again.' });
  }

  const { key, email } = req.body || {};
  if (!key || !email) return res.status(400).json({ error: 'Access key and email are required.' });

  const emailLower = email.toLowerCase().trim();
  if (!EMAIL_RE.test(emailLower)) return res.status(400).json({ error: 'Invalid email address.' });

  const tenant = getTenantByKey(key);
  if (!tenant) return res.status(200).json({ sent: false, error: 'Invalid access key. Check your key and try again.' });
  if (tenant.tenantId === 'demo') return res.status(200).json({ sent: false, error: 'Demo accounts cannot be claimed.' });

  try {
    const existing = (await getProfile(tenant.controlSheetId)) || {};
    await setProfile({ ...existing, owner_email: emailLower }, tenant.controlSheetId);
  } catch (err) {
    console.error('[auth/claim] Failed to save owner email:', err.message);
    return res.status(500).json({ error: 'Could not save your email. Please try again.' });
  }

  const token = createMagicToken(tenant.tenantId, emailLower);
  const magicUrl = buildMagicUrl(token, req);

  try {
    await sendMagicLinkEmail(emailLower, magicUrl);
  } catch (err) {
    console.error('[auth/claim] Failed to send magic link:', err.message);
    return res.status(500).json({ error: 'Could not send the magic link email. Please try again.' });
  }

  return res.status(200).json({ sent: true });
}
