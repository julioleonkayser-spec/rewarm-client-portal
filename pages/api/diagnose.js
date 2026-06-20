const { getProfile, getAllRows, getDialerState, getEffectiveSheetId } = require('../../lib/sheets');
const { verifyRequest, AuthError } = require('../../lib/tenant-auth');

const REQUIRED_COLUMNS = [
  'first_name', 'last_name', 'phone_number', 'lead_source',
  'original_interest', 'agent_name', 'transfer_number', 'call_status',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }

  const checks = [];

  // 1. session_valid — always true if we reach this line
  checks.push({ ok: true, label: 'Session valid', detail: `Authenticated as tenant "${tenant.tenantId}"` });

  // 2. profile_loaded
  let profile = null;
  try {
    profile = await getProfile(tenant.controlSheetId);
    const ok = !!(profile?.name && profile?.dataSheetId);
    checks.push({
      ok,
      label: 'Profile loaded',
      detail: ok
        ? `Name: ${profile.name} · data sheet configured`
        : profile
          ? 'Profile found but missing name or dataSheetId'
          : 'No profile found in control sheet',
    });
  } catch (err) {
    checks.push({ ok: false, label: 'Profile loaded', detail: `Error: ${err.message}` });
  }

  // 3. sheet_accessible
  let rows = null;
  try {
    const sheetId = await getEffectiveSheetId(tenant.controlSheetId);
    rows = await getAllRows(sheetId);
    checks.push({ ok: true, label: 'Sheet accessible', detail: `Read ${rows.length} row(s) from data sheet` });
  } catch (err) {
    const isPermission = err.code === 403 || err.status === 403
      || (err.message || '').toLowerCase().includes('permission');
    checks.push({
      ok: false,
      label: 'Sheet accessible',
      detail: isPermission
        ? 'Permission denied — share the sheet with the service account'
        : `Error: ${err.message}`,
    });
  }

  // 4. sheet_columns
  if (rows && rows.length > 0) {
    const headers = rows[0];
    const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
    checks.push({
      ok: missing.length === 0,
      label: 'Sheet columns',
      detail: missing.length === 0
        ? 'All 8 required columns present in row 1'
        : `Missing: ${missing.join(', ')}`,
    });
  } else {
    checks.push({ ok: false, label: 'Sheet columns', detail: 'Cannot check — sheet is empty or inaccessible' });
  }

  // 5. dialer_status
  let dialerState = null;
  try {
    dialerState = await getDialerState(tenant.controlSheetId);
    checks.push({ ok: true, label: 'Dialer status', detail: `DialerControl A1 = "${dialerState.raw}" (${dialerState.status})` });
  } catch (err) {
    checks.push({ ok: false, label: 'Dialer status', detail: `Could not read DialerControl: ${err.message}` });
  }

  // 6. uncalled_leads
  if (rows && rows.length > 0) {
    const headers = rows[0];
    const statusCol = headers.indexOf('call_status');
    if (statusCol === -1) {
      checks.push({ ok: false, label: 'Uncalled leads', detail: 'Cannot count — call_status column not found' });
    } else {
      const count = rows.slice(1).filter(r => !(r[statusCol] || '').trim()).length;
      if (count > 0) {
        checks.push({ ok: true, label: 'Uncalled leads', detail: `${count} uncalled lead(s) ready` });
      } else {
        const raw = (dialerState?.raw || '').toUpperCase();
        if (raw === 'RUNNING') {
          checks.push({ ok: false, label: 'Uncalled leads', detail: 'Dialer is RUNNING but no uncalled leads found' });
        } else if (raw === 'PAUSED_NO_LEADS') {
          checks.push({ ok: true, label: 'Uncalled leads', detail: 'All leads have been called' });
        } else {
          checks.push({ ok: true, label: 'Uncalled leads', detail: 'No uncalled leads (dialer is paused)' });
        }
      }
    }
  } else {
    checks.push({ ok: false, label: 'Uncalled leads', detail: 'Cannot count — sheet is empty or inaccessible' });
  }

  // 7. retell_reachable
  const retellKey = process.env.RETELL_API_KEY;
  if (!retellKey) {
    checks.push({ ok: false, label: 'Retell reachable', detail: 'RETELL_API_KEY env var is not set' });
  } else {
    try {
      const response = await fetch('https://api.retell.ai', {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${retellKey}` },
      });
      checks.push({ ok: true, label: 'Retell reachable', detail: `API responded HTTP ${response.status}` });
    } catch (err) {
      checks.push({ ok: false, label: 'Retell reachable', detail: `Network error: ${err.message}` });
    }
  }

  const passed = checks.filter(c => c.ok).length;
  return res.status(200).json({ checks, passed, total: checks.length });
}
