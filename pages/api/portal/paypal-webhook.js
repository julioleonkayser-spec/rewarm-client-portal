// POST /api/portal/paypal-webhook
//
// Receives PayPal PAYMENT.CAPTURE.COMPLETED events and provisions a new tenant:
//   1. Verifies PayPal webhook signature via the verify-webhook-signature REST API.
//   2. Deduplicates via Upstash SET NX on the PayPal capture ID.
//   3. Generates an access key + tenant ID in the same format as create-tenant.js.
//   4. Merges the new entry into TENANT_MAP and auto-patches the Vercel env var.
//   5. Triggers a Vercel redeploy so the new key is live within ~30 seconds.
//   6. Sends the buyer a welcome email with their access key and login instructions.
//
// Required env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID,
//   VERCEL_TOKEN, VERCEL_PROJECT_ID (optional: VERCEL_TEAM_ID, PAYPAL_API_BASE),
//   RESEND_API_KEY, RESEND_FROM, NEXT_PUBLIC_BASE_URL.

import crypto from 'crypto';
import { Resend } from 'resend';
const { exec, isConfigured } = require('../../../lib/upstash');

export const config = { api: { bodyParser: false } };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ── Raw body ────────────────────────────────────────────────────────────────

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── PayPal signature verification ───────────────────────────────────────────

function paypalBase() {
  return (process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com').replace(/\/$/, '');
}

async function getPayPalToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token request failed: ${res.status}`);
  return (await res.json()).access_token;
}

async function verifyAndParse(req, rawBody) {
  const token = await getPayPalToken();

  let webhookEvent;
  try {
    webhookEvent = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new Error('Body is not valid JSON');
  }

  const verifyRes = await fetch(`${paypalBase()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transmission_id:   req.headers['paypal-transmission-id'],
      transmission_time: req.headers['paypal-transmission-time'],
      cert_url:          req.headers['paypal-cert-url'],
      auth_algo:         req.headers['paypal-auth-algo'],
      transmission_sig:  req.headers['paypal-transmission-sig'],
      webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
      webhook_event:     webhookEvent,
    }),
  });

  if (!verifyRes.ok) throw new Error(`PayPal verify API returned ${verifyRes.status}`);
  const { verification_status } = await verifyRes.json();
  return { verified: verification_status === 'SUCCESS', event: webhookEvent };
}

// ── Tenant provisioning (mirrors create-tenant.js) ──────────────────────────

function generateAccessKey(name) {
  const namePart = (name || 'CLIENT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CLIENT';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REWARM-${namePart}-${random}`;
}

function generateTenantId() {
  return 't_' + crypto.randomBytes(4).toString('hex');
}

function parseCurrentMap() {
  try {
    let parsed = JSON.parse(process.env.TENANT_MAP || '{}');
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
  } catch {}
  return {};
}

async function patchVercelEnvVar(newValue) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return { ok: false, reason: 'VERCEL_TOKEN or VERCEL_PROJECT_ID not configured' };
  }
  const teamId = process.env.VERCEL_TEAM_ID || '';
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const base = 'https://api.vercel.com';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const listRes = await fetch(`${base}/v9/projects/${encodeURIComponent(projectId)}/env${qs}`, { headers });
  if (!listRes.ok) {
    return { ok: false, reason: `Vercel list-env failed (${listRes.status})` };
  }
  const { envs = [] } = await listRes.json();
  const existing = envs.find(e => e.key === 'TENANT_MAP');

  if (existing) {
    const patchRes = await fetch(
      `${base}/v9/projects/${encodeURIComponent(projectId)}/env/${existing.id}${qs}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ value: newValue, target: existing.target || ['production', 'preview', 'development'] }),
      }
    );
    return patchRes.ok ? { ok: true, action: 'patched' } : { ok: false, reason: `Vercel patch failed (${patchRes.status})` };
  }

  const createRes = await fetch(`${base}/v10/projects/${encodeURIComponent(projectId)}/env${qs}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      key: 'TENANT_MAP',
      value: newValue,
      target: ['production', 'preview', 'development'],
      type: 'encrypted',
    }),
  });
  return createRes.ok ? { ok: true, action: 'created' } : { ok: false, reason: `Vercel create failed (${createRes.status})` };
}

async function triggerVercelRedeploy() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return { ok: false, reason: 'Missing VERCEL_TOKEN or VERCEL_PROJECT_ID' };
  const teamId = process.env.VERCEL_TEAM_ID || '';
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const res = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectId,
      gitSource: { type: 'github', repoId: process.env.VERCEL_GITHUB_REPO_ID || '', ref: 'main' },
    }),
  });
  return res.ok ? { ok: true } : { ok: false, reason: `HTTP ${res.status}` };
}

// ── Welcome email ────────────────────────────────────────────────────────────

function portalUrl() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  return base || 'https://rewarm-org.vercel.app';
}

function welcomeEmailHtml({ displayName, accessKey, loginUrl }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917;background:#fff">
  <div style="margin-bottom:28px">
    <div style="width:36px;height:36px;background:#d97706;border-radius:8px;display:inline-block;vertical-align:middle;text-align:center;line-height:36px">
      <span style="color:#fff;font-weight:700;font-size:12px;font-family:sans-serif">RW</span>
    </div>
    <span style="font-weight:600;font-size:18px;margin-left:10px;vertical-align:middle;color:#1c1917">ReWarm</span>
  </div>

  <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#1c1917">Welcome — your access key is ready</h1>
  <p style="color:#78716c;margin:0 0 24px;font-size:14px;line-height:1.6">Hi ${displayName}, thanks for your purchase. Use the key below to activate your ReWarm portal.</p>

  <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
    <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#78716c;margin:0 0 8px;text-transform:uppercase">Your Access Key</p>
    <p style="font-size:22px;font-weight:700;font-family:'Courier New',Courier,monospace;color:#1c1917;letter-spacing:0.05em;margin:0">${accessKey}</p>
  </div>

  <a href="${loginUrl}" style="display:block;background:#d97706;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:14px;margin-bottom:24px">Activate Your Portal &#8594;</a>

  <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="font-size:12px;font-weight:600;color:#57534e;margin:0 0 8px">How to log in</p>
    <ol style="color:#78716c;font-size:13px;line-height:1.8;padding-left:18px;margin:0">
      <li>Click the button above or visit your portal</li>
      <li>Choose <strong>Set up your account with your access key</strong></li>
      <li>Enter the access key above and your email address</li>
      <li>Check your inbox for a sign-in link (expires in 15 minutes)</li>
    </ol>
  </div>

  <p style="font-size:12px;color:#a8a29e;border-top:1px solid #e7e5e4;padding-top:16px;margin:0">
    Keep this email — your access key does not expire. Questions? Reply here.
  </p>
</body>
</html>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Step 1 — Required env guard
  const missingEnv = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'].filter(
    k => !process.env[k]
  );
  if (missingEnv.length > 0) {
    console.error('[paypal-webhook] Missing env vars:', missingEnv.join(', '));
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Step 2 — Read raw body before any parsing (required for signature verification)
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[paypal-webhook] Failed to read body:', err?.message);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  // Step 3 — Verify PayPal webhook signature
  let event;
  try {
    const result = await verifyAndParse(req, rawBody);
    if (!result.verified) {
      console.warn('[paypal-webhook] Signature verification failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    event = result.event;
  } catch (err) {
    console.error('[paypal-webhook] Verification error:', err?.message);
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  // Step 4 — Only provision on PAYMENT.CAPTURE.COMPLETED
  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    console.log(`[paypal-webhook] Ignoring event "${event.event_type}"`);
    return res.status(200).json({ ok: true, skipped: true, reason: `event "${event.event_type}" not handled` });
  }

  // Step 5 — Extract and validate required fields
  const resource = event.resource || {};
  const txId = resource.id ? String(resource.id) : null;
  const payer = resource.payer || {};
  const rawEmail = typeof payer.email_address === 'string' ? payer.email_address : '';
  const email = rawEmail.toLowerCase().trim();
  const givenName = payer.name?.given_name ? String(payer.name.given_name).trim() : '';
  const surname = payer.name?.surname ? String(payer.name.surname).trim() : '';
  const fullName = [givenName, surname].filter(Boolean).join(' ') || null;

  if (!txId) {
    console.error('[paypal-webhook] resource.id missing');
    return res.status(400).json({ error: 'Missing transaction ID' });
  }
  if (!email || !EMAIL_RE.test(email)) {
    console.error(`[paypal-webhook] Buyer email missing or invalid — txId=${txId}`);
    return res.status(400).json({ error: 'Missing or invalid buyer email' });
  }

  // Step 6 — Idempotency: reject duplicate deliveries via Upstash SET NX
  const idempotencyKey = `paypal-tx:${txId}`;
  if (isConfigured()) {
    const setResult = await exec(['SET', idempotencyKey, '1', 'NX', 'EX', String(IDEMPOTENCY_TTL_SECONDS)]);
    if (setResult.ok && setResult.result === null) {
      console.log(`[paypal-webhook] Duplicate delivery — txId=${txId} already processed`);
      return res.status(200).json({ ok: true, skipped: true, reason: 'duplicate delivery' });
    }
    if (!setResult.ok) {
      console.warn(`[paypal-webhook] Upstash SET NX failed — proceeding without idempotency lock for txId=${txId}`);
    }
  } else {
    console.warn('[paypal-webhook] Upstash not configured — idempotency not enforced');
  }

  // Step 7 — Generate access key and tenant ID (same format as create-tenant.js)
  const accessKey = generateAccessKey(fullName);
  const tenantId = generateTenantId();

  // Step 8 — Merge into TENANT_MAP and push to Vercel
  // controlSheetId is null here; tenant-auth falls back to GOOGLE_SHEET_ID until
  // the buyer links their own sheet during onboarding.
  const newEntry = { tenantId, plan: 'Pro', controlSheetId: null };
  const updatedMap = { ...parseCurrentMap(), [accessKey]: newEntry };
  const vercel = await patchVercelEnvVar(JSON.stringify(updatedMap));
  console.log(`[paypal-webhook] TENANT_MAP patch — txId=${txId} accessKey=${accessKey} vercel:`, vercel.ok ? vercel.action : vercel.reason);

  if (!vercel.ok) {
    console.error(`[paypal-webhook] TENANT_MAP patch failed — txId=${txId} key=${accessKey}: ${vercel.reason}`);
    // Do not return 500 here: the key exists in memory until next cold start.
    // Fall through to send the welcome email so the buyer is not left without their key.
  }

  // Step 9 — Trigger Vercel redeploy to pick up the new TENANT_MAP
  if (vercel.ok) {
    const redeploy = await triggerVercelRedeploy();
    if (!redeploy.ok) {
      console.warn(`[paypal-webhook] Redeploy failed (non-fatal) — txId=${txId}: ${redeploy.reason}`);
    }
  }

  // Step 10 — Send welcome email with access key and login instructions
  let emailStatus = 'failed';
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.error(`[paypal-webhook] RESEND_API_KEY not set — no email sent to ${email}`);
  } else {
    try {
      const resend = new Resend(resendKey);
      const loginUrl = `${portalUrl()}/portal`;
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'ReWarm <portal@rewarm.co>',
        to: email,
        subject: `Your ReWarm access key — ${accessKey}`,
        html: welcomeEmailHtml({ displayName: fullName || 'there', accessKey, loginUrl }),
      });
      emailStatus = 'sent';
      console.log(`[paypal-webhook] Welcome email sent — email=${email} txId=${txId}`);
    } catch (err) {
      console.error(`[paypal-webhook] Resend failed — email=${email} txId=${txId}: ${err?.message}`);
    }
  }

  console.log(
    `[paypal-webhook] Done — accessKey=${accessKey} tenantId=${tenantId} ` +
    `email=${email} txId=${txId} vercel=${vercel.ok ? vercel.action : 'failed'} email=${emailStatus}`
  );

  return res.status(200).json({ ok: true });
}
