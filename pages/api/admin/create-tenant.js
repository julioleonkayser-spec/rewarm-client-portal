// POST /api/admin/create-tenant
// Body: { email, name, controlSheetId, plan? }
// Header: Authorization: Bearer {ADMIN_SECRET}
//
// Creates a new tenant entry in TENANT_MAP, writes the owner profile to their
// control sheet, and auto-patches the Vercel env var when VERCEL_TOKEN +
// VERCEL_PROJECT_ID are set. Falls back to returning a JSON snippet for
// manual pasting when those vars are absent.

const crypto = require('crypto');
const { getProfile, setProfile } = require('../../../lib/sheets');

const VALID_PLANS = new Set(['Starter', 'Growth', 'Pro']);

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
    const text = await listRes.text().catch(() => '');
    return { ok: false, reason: `Vercel list-env failed (${listRes.status}): ${text.slice(0, 200)}` };
  }
  const { envs = [] } = await listRes.json();
  const existing = envs.find(e => e.key === 'TENANT_MAP');

  if (existing) {
    const patchRes = await fetch(`${base}/v9/projects/${encodeURIComponent(projectId)}/env/${existing.id}${qs}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ value: newValue, target: existing.target || ['production', 'preview', 'development'] }),
    });
    if (!patchRes.ok) {
      const text = await patchRes.text().catch(() => '');
      return { ok: false, reason: `Vercel patch-env failed (${patchRes.status}): ${text.slice(0, 200)}` };
    }
    return { ok: true, action: 'patched' };
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
  if (!createRes.ok) {
    const text = await createRes.text().catch(() => '');
    return { ok: false, reason: `Vercel create-env failed (${createRes.status}): ${text.slice(0, 200)}` };
  }
  return { ok: true, action: 'created' };
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
    body: JSON.stringify({ name: projectId, gitSource: { type: 'github', repoId: process.env.VERCEL_GITHUB_REPO_ID || '', ref: 'main' } }),
  });
  return res.ok ? { ok: true } : { ok: false, reason: `HTTP ${res.status}` };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ error: 'ADMIN_SECRET env var is not set' });

  const auth = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!auth || auth !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, name, controlSheetId, plan = 'Growth', dataSheetId } = req.body || {};
  if (!controlSheetId) {
    return res.status(400).json({ error: 'controlSheetId is required' });
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });

  const effectivePlan = VALID_PLANS.has(plan) ? plan : 'Growth';
  const accessKey = generateAccessKey(name);
  const tenantId = generateTenantId();
  const today = new Date().toISOString().split('T')[0];

  // Write owner profile to control sheet.
  // If email is provided, owner_email is set so the magic-link flow works immediately.
  // If omitted, the client claims their account via POST /api/auth/claim using the accessKey.
  let profileWritten = false;
  let profileError = null;
  try {
    const existing = await getProfile(controlSheetId) || {};
    await setProfile({
      ...existing,
      ...(email && { owner_email: email.toLowerCase().trim() }),
      name: name || '',
      plan_name: effectivePlan,
      billing_cycle_start: existing.billing_cycle_start || today,
      ...(dataSheetId && { dataSheetId }),
    }, controlSheetId);
    profileWritten = true;
  } catch (err) {
    profileError = err.message;
    console.error('[admin/create-tenant] profile write failed:', err.message);
  }

  // Merge new entry into current TENANT_MAP and push to Vercel.
  const newEntry = { tenantId, plan: effectivePlan, controlSheetId };
  const updatedMap = { ...parseCurrentMap(), [accessKey]: newEntry };
  const updatedMapJson = JSON.stringify(updatedMap);

  const vercel = await patchVercelEnvVar(updatedMapJson);
  console.log('[admin/create-tenant] tenant:', tenantId, '| key:', accessKey, '| vercel:', vercel.ok ? vercel.action : vercel.reason);

  let redeployTriggered = false;
  let redeployWarning = null;
  if (vercel.ok) {
    const redeploy = await triggerVercelRedeploy();
    redeployTriggered = redeploy.ok;
    if (!redeploy.ok) {
      redeployWarning = 'Auto-redeploy failed (' + redeploy.reason + '). TENANT_MAP was updated but the new tenant will NOT be active until you manually redeploy in the Vercel dashboard.';
      console.warn('[admin/create-tenant] redeploy failed:', redeploy.reason);
    }
  }

  const multiTenantEnabled = process.env.MULTI_TENANT === 'true';

  return res.status(200).json({
    ok: true,
    accessKey,
    tenantId,
    plan: effectivePlan,
    controlSheetId,
    profileWritten,
    ...(profileError && { profileError }),
    vercelUpdated: vercel.ok,
    redeployTriggered,
    ...(vercel.ok
      ? {
          message: redeployTriggered
            ? 'Tenant created. Access key will be active after the triggered redeploy (~60s). Share accessKey with the client.'
            : 'Tenant created and TENANT_MAP updated. MANUAL REDEPLOY REQUIRED before the access key is active. Go to Vercel dashboard → Deployments → Redeploy.',
          vercelAction: vercel.action,
          ...(redeployWarning && { redeployWarning }),
        }
      : {
          message: 'Profile written but TENANT_MAP was NOT auto-updated. Add the entry manually in Vercel → Settings → Environment Variables.',
          vercelError: vercel.reason,
          tenantMapAddition: { [accessKey]: newEntry },
        }),
    ...(!multiTenantEnabled && {
      warning: 'MULTI_TENANT env var is not set to "true". Set it to enforce per-tenant isolation.',
    }),
  });
}
