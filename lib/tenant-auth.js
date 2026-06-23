const crypto = require('crypto');

const VALID_PLANS = new Set(['Starter', 'Growth', 'Pro', 'Demo']);
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEMO_KEY = (process.env.DEMO_ACCESS_KEY || 'REWARM-DEMO-2024').toUpperCase();

// ---- Tenant map --------------------------------------------------------

function buildTenantMap() {
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null;

  // TENANT_MAP: multi-tenant format
  // { "KEY": { "tenantId": "t_alice", "plan": "Growth", "controlSheetId": "..." } }
  if (process.env.TENANT_MAP) {
    try {
      // Vercel's dashboard sometimes double-encodes JSON (stores the value wrapped in
      // outer quotes). Try a plain parse first; if that yields a string, parse again.
      let parsed = JSON.parse(process.env.TENANT_MAP);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('TENANT_MAP must be a JSON object, got: ' + typeof parsed);
      }

      const map = {};
      for (const [key, val] of Object.entries(parsed)) {
        const k = key.toUpperCase();
        if (typeof val === 'object' && val !== null && val.tenantId) {
          map[k] = {
            tenantId: val.tenantId,
            plan: VALID_PLANS.has(val.plan) ? val.plan : 'Growth',
            controlSheetId: val.controlSheetId || null,
          };
        } else if (typeof val === 'string') {
          map[k] = {
            tenantId: 'default',
            plan: VALID_PLANS.has(val) ? val : 'Growth',
            controlSheetId: sheetId,
          };
        }
      }

      const count = Object.keys(map).length;
      if (count === 0) {
        console.error('[tenant-auth] TENANT_MAP parsed but produced 0 valid entries — check that each entry has a tenantId field');
      } else {
        console.log('[tenant-auth] TENANT_MAP loaded:', count, 'keys:', Object.keys(map).join(', '));
      }
      return map;
    } catch (e) {
      console.error(
        '[tenant-auth] TENANT_MAP parse FAILED:', e.message,
        '| raw length:', process.env.TENANT_MAP.length,
        '| starts with:', JSON.stringify(process.env.TENANT_MAP.slice(0, 20))
      );
    }
  }

  // ACCESS_KEY_MAP: original format, string values only
  if (process.env.ACCESS_KEY_MAP) {
    try {
      const raw = JSON.parse(process.env.ACCESS_KEY_MAP);
      const map = {};
      for (const [key, val] of Object.entries(raw)) {
        map[key.toUpperCase()] = {
          tenantId: 'default',
          plan: VALID_PLANS.has(val) ? val : 'Growth',
          controlSheetId: sheetId,
        };
      }
      return map;
    } catch {}
  }

  // Single ACCESS_KEY env var shorthand
  if (process.env.ACCESS_KEY) {
    const plan = VALID_PLANS.has(process.env.ACCESS_KEY_PLAN) ? process.env.ACCESS_KEY_PLAN : 'Growth';
    return { [process.env.ACCESS_KEY.toUpperCase()]: { tenantId: 'default', plan, controlSheetId: sheetId } };
  }

  // Hardcoded placeholder keys (single-tenant fallback)
  return {
    'REWARM-STARTER-2024': { tenantId: 'default', plan: 'Starter', controlSheetId: sheetId },
    'REWARM-GROWTH-2024':  { tenantId: 'default', plan: 'Growth',  controlSheetId: sheetId },
    'REWARM-PRO-2024':     { tenantId: 'default', plan: 'Pro',     controlSheetId: sheetId },
  };
}

function getTenantByKey(key) {
  const k = String(key).trim().toUpperCase();
  if (k === DEMO_KEY) {
    return {
      tenantId: 'demo',
      plan: 'Demo',
      controlSheetId: process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null,
    };
  }
  return buildTenantMap()[k] || null;
}

function getTenantById(tenantId) {
  if (tenantId === 'demo') {
    return {
      tenantId: 'demo',
      plan: 'Demo',
      controlSheetId: process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null,
    };
  }
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null;
  if (tenantId === 'default') {
    return { tenantId: 'default', plan: null, controlSheetId: sheetId };
  }
  const map = buildTenantMap();
  return Object.values(map).find(t => t.tenantId === tenantId) || null;
}

// ---- Token sign / verify -----------------------------------------------
// Format: "<tenantId>:<issuedAt>:<hmac_hex>"
// tenantId values are operator-controlled and must not contain ":"

function getSecret() {
  return process.env.SESSION_SECRET || '';
}

function signToken(tenantId, issuedAt) {
  const secret = getSecret();
  if (!secret) return 'unsigned';
  const payload = tenantId + ':' + issuedAt;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function buildToken(tenantId, issuedAt) {
  return tenantId + ':' + issuedAt + ':' + signToken(tenantId, issuedAt);
}

function verifyToken(tokenStr) {
  if (!tokenStr) return null;

  // Extract sig (last segment) and issuedAt (second-to-last segment) safely
  const lastColon = tokenStr.lastIndexOf(':');
  if (lastColon === -1) return null;
  const secondLastColon = tokenStr.lastIndexOf(':', lastColon - 1);
  if (secondLastColon === -1) return null;

  const sig = tokenStr.slice(lastColon + 1);
  const issuedAt = parseInt(tokenStr.slice(secondLastColon + 1, lastColon), 10);
  const tenantId = tokenStr.slice(0, secondLastColon);

  if (!tenantId || isNaN(issuedAt)) return null;

  // Token TTL check
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return null;

  const secret = getSecret();
  if (!secret) {
    // No SESSION_SECRET: accept 'unsigned' tokens (single-tenant / dev mode)
    if (sig !== 'unsigned') return null;
    const tenant = getTenantById(tenantId);
    return tenant ? { tenantId, controlSheetId: tenant.controlSheetId } : null;
  }

  const expected = signToken(tenantId, issuedAt);
  if (sig !== expected) return null;

  const tenant = getTenantById(tenantId);
  return tenant ? { tenantId, controlSheetId: tenant.controlSheetId } : null;
}

// ---- Request verification ----------------------------------------------

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Call at the top of every protected API route.
// Returns { tenantId, controlSheetId } or throws AuthError.
//
// When MULTI_TENANT is not "true", skips token verification entirely so
// the existing single-client deployment continues to work without changes.
function verifyRequest(req) {
  const multiTenant = process.env.MULTI_TENANT === 'true';

  if (!multiTenant) {
    // Phase 2 TODO: replace controlSheetId fallback with tenant-scoped sheet reads
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null;
    return { tenantId: 'default', controlSheetId: sheetId };
  }

  if (!getSecret()) {
    throw new AuthError(500, 'Server misconfiguration: SESSION_SECRET is required when MULTI_TENANT=true');
  }

  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    throw new AuthError(401, 'Missing authorization token');
  }

  const tokenStr = auth.slice(7);
  const tenant = verifyToken(tokenStr);
  if (!tenant) {
    throw new AuthError(401, 'Invalid or expired session token');
  }

  console.log(
    '[tenant-auth] verified tenant:', tenant.tenantId,
    '| sheetId:', tenant.controlSheetId ? tenant.controlSheetId.slice(0, 12) + '...' : 'NULL'
  );
  return tenant;
}

// Returns all unique tenant records (deduplicated by tenantId) from the current map.
// Used by the magic-link login flow to scan for a tenant owner by email.
function getAllTenants() {
  const map = buildTenantMap();
  const seen = new Set();
  const tenants = [];
  for (const t of Object.values(map)) {
    if (!seen.has(t.tenantId)) {
      seen.add(t.tenantId);
      tenants.push(t);
    }
  }
  return tenants;
}

module.exports = { getTenantByKey, getTenantById, getAllTenants, signToken, buildToken, verifyToken, verifyRequest, AuthError };
