const crypto = require('crypto');

const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getSecret() {
  return process.env.SESSION_SECRET || '';
}

// Token format: <base64url_payload>.<hmac_hex>
// Payload JSON: { tenantId, email, exp }
function createMagicToken(tenantId, email) {
  const payload = Buffer.from(
    JSON.stringify({ tenantId, email: email.toLowerCase().trim(), exp: Date.now() + MAGIC_TTL_MS })
  ).toString('base64url');

  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return payload + '.' + sig;
}

function verifyMagicToken(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return null;

  const dotIdx = tokenStr.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const payload = tokenStr.slice(0, dotIdx);
  const sig = tokenStr.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!claims.tenantId || !claims.email || !claims.exp) return null;
  if (Date.now() > claims.exp) return null;

  return { tenantId: claims.tenantId, email: claims.email };
}

function getMagicLinkBaseUrl(req) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}`;
}

function buildMagicUrl(token, req) {
  const base = getMagicLinkBaseUrl(req);
  return `${base}/portal/auth?t=${encodeURIComponent(token)}`;
}

function getEmailHtml(magicUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fafaf9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;border:1px solid #e7e5e4;border-bottom:0;padding:28px 32px;">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <div style="width:36px;height:36px;background:#f59e0b;border-radius:8px;text-align:center;line-height:36px;">
                <span style="color:#ffffff;font-size:12px;font-weight:700;">RW</span>
              </div>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:16px;font-weight:600;color:#1c1917;letter-spacing:-0.01em;">ReWarm</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-top:0;border-bottom:0;padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.02em;">Sign in to your portal</h1>
          <p style="margin:0 0 28px;font-size:14px;color:#78716c;line-height:1.65;">Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${magicUrl}" style="display:inline-block;background-color:#1c1917;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:-0.01em;">Sign in to ReWarm &rarr;</a>
          <p style="margin:28px 0 0;font-size:12px;color:#a8a29e;line-height:1.7;">Or copy this URL into your browser:<br>
          <span style="color:#57534e;word-break:break-all;font-size:11px;">${magicUrl}</span></p>
        </td></tr>
        <tr><td style="background:#f5f5f4;border:1px solid #e7e5e4;border-top:1px solid #f0efee;border-radius:0 0 12px 12px;padding:16px 32px;">
          <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">If you didn't request this link, no action is needed — just ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendMagicLinkEmail(email, magicUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[magic-link] RESEND_API_KEY not set. Magic link (dev only):', magicUrl);
      return;
    }
    throw new Error('RESEND_API_KEY is not configured');
  }

  const from = process.env.RESEND_FROM_EMAIL || 'noreply@rewarm.ai';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your ReWarm portal sign-in link',
      html: getEmailHtml(magicUrl),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Resend error ${response.status}: ${err.message || response.statusText}`);
  }
}

module.exports = { createMagicToken, verifyMagicToken, buildMagicUrl, sendMagicLinkEmail };
