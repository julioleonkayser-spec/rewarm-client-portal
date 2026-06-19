const { getDialerState, setDialerStatus, getProfile, getAllRows, SHEET_ID } = require('../../lib/sheets');
const { verifyRequest, AuthError } = require('../../lib/tenant-auth');

const { buildPlanSummary } = require('../../lib/plan-config');

const PAUSE_REASON_MAP = {
  client:   'PAUSED_BY_CLIENT',
  admin:    'PAUSED_BY_ADMIN',
  limit:    'PAUSED_BY_LIMIT',
  no_leads: 'PAUSED_NO_LEADS',
};

export default async function handler(req, res) {
  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }
  // Phase 2 TODO: use tenant.controlSheetId for tenant-scoped sheet routing
  try {
    if (req.method === 'GET') {
      const state = await getDialerState();
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const { action, reason } = req.body || {};

      // check_leads: transitions PAUSED_NO_LEADS→PAUSED_BY_CLIENT if new uncalled
      // leads are found and the plan limit hasn't been hit.
      if (action === 'check_leads') {
        const current = await getDialerState();
        if (current.status !== 'paused_no_leads') {
          return res.status(200).json({ ...current, checked: false });
        }
        const profile = await getProfile();
        const sheetId = profile?.dataSheetId || SHEET_ID;
        let rows = [];
        try { rows = await getAllRows(sheetId); } catch {}
        const headers = rows[0] || [];
        const statusCol = headers.indexOf('call_status');
        const hasUncalled = statusCol !== -1 && rows.slice(1).some(r => !(r[statusCol] || '').trim());

        if (!hasUncalled) {
          return res.status(200).json({ ...current, checked: true, recovered: false });
        }
        // Respect plan limit — don't let check_leads bypass it.
        const plan = buildPlanSummary(profile, rows);
        if (plan.at_limit) {
          await setDialerStatus('PAUSED_BY_LIMIT');
          return res.status(200).json({ ...(await getDialerState()), checked: true, recovered: false });
        }
        // New leads available and within limit — unlock for client resume.
        await setDialerStatus('PAUSED_BY_CLIENT');
        return res.status(200).json({ ...(await getDialerState()), checked: true, recovered: true });
      }

      if (action !== 'pause' && action !== 'resume') {
        return res.status(400).json({ error: "action must be 'pause', 'resume', or 'check_leads'" });
      }

      if (action === 'resume') {
        const current = await getDialerState();
        if (!current.resume_allowed) {
          return res.status(403).json({
            error: 'Resume not allowed in current state',
            status: current.status,
            resume_allowed: false,
          });
        }
        await setDialerStatus('RUNNING');
        return res.status(200).json({ status: 'active', resume_allowed: true, raw: 'RUNNING' });
      }

      // pause — always allowed from client
      const cellValue = PAUSE_REASON_MAP[reason] || 'PAUSED_BY_CLIENT';
      await setDialerStatus(cellValue);
      return res.status(200).json(await getDialerState());
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
