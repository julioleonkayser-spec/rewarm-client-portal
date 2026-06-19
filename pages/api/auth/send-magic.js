// POST { email }
// Finds a tenant by owner email, sends a magic login link.
// Always returns { sent: true } regardless of match to prevent email enumeration.

const { getAllTenants } = require('../../../lib/tenant-auth');
const { getProfile } = require('../../../lib/sheets');
const { createMagicToken, buildMagicUrl, sendMagicLinkEmail } = require('../../../lib/magic-link');
const { isRateLimited } = require('../../../lib/upstash');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 5 magic link requests per IP per minute
  if (await isRateLimited(req, 'send-magic', 5)) {
    return res.status(429).json({ sent: false, error: 'Too many attempts. Please wait a minute and try again.' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const emailLower = email.toLowerCase().trim();
  if (!EMAIL_RE.test(emailLower)) return res.status(400).json({ error: 'Invalid email address.' });

  const tenants = getAllTenants().filter(t => t.tenantId !== 'demo' && t.tenantId !== 'default');

  const profileResults = await Promise.all(
    tenants.map(async (t) => {
      try {
        const profile = await getProfile(t.controlSheetId);
        return profile?.owner_email === emailLower ? t : null;
      } catch {
        return null;
      }
    })
  );

  const matched = profileResults.find(Boolean) || null;

  if (matched) {
    const token = createMagicToken(matched.tenantId, emailLower);
    const magicUrl = buildMagicUrl(token, req);
    try {
      await sendMagicLinkEmail(emailLower, magicUrl);
    } catch (err) {
      console.error('[auth/send-magic] Email failed:', err.message);
    }
  }

  // Always respond sent:true — do not reveal whether the email is registered
  return res.status(200).json({ sent: true });
}
