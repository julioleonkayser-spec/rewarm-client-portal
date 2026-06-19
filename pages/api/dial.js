const { getAllRows, getDialerState, setDialerStatus, getProfile, getEffectiveSheetId } = require('../../lib/sheets');
const { buildPlanSummary } = require('../../lib/plan-config');
const { toE164 } = require('../../lib/phone');

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== 'Bearer ' + secret) {
      console.log('[dial] EARLY RETURN — unauthorized: Authorization header mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Optional query param for multi-tenant cron setups:
  // cron-job.org URL: /api/dial?controlSheetId=<sheetId>
  const controlSheetId = req.query.controlSheetId || null;

  console.log('[dial] invoked | method:', req.method, '| controlSheetId:', controlSheetId ? controlSheetId.slice(0, 12) + '...' : 'from-env');

  try {
    const dialerState = await getDialerState(controlSheetId);
    console.log('[dial] dialer state:', dialerState.status, '(raw:', dialerState.raw + ')');

    if (dialerState.status !== 'active') {
      console.log('[dial] EARLY RETURN — dialer not active, status:', dialerState.status);
      return res.status(200).json({ status: dialerState.status, message: 'Dialer is not active — no call placed' });
    }

    const profile = await getProfile(controlSheetId);
    const sheetId = await getEffectiveSheetId(controlSheetId);
    console.log('[dial] effective data sheetId:', sheetId ? sheetId.slice(0, 12) + '...' : 'NULL', '| plan:', profile?.plan_name || 'unknown');

    const rows = await getAllRows(sheetId);
    console.log('[dial] sheet loaded:', rows.length - 1, 'leads');

    const plan = buildPlanSummary(profile, rows);
    console.log('[dial] plan usage:', plan.leads_added_this_cycle, '/', plan.monthly_lead_cap, '| at_limit:', plan.at_limit);
    if (plan.at_limit) {
      await setDialerStatus('PAUSED_BY_LIMIT', controlSheetId);
      console.log('[dial] EARLY RETURN — plan limit reached, dialer paused');
      return res.status(200).json({ status: 'paused_by_limit', message: 'Monthly lead cap reached — dialer paused' });
    }

    const headers = rows[0];
    const statusCol = headers.indexOf('call_status');
    let lead = null;
    for (let i = 1; i < rows.length; i++) {
      if (!(rows[i][statusCol] || '').trim()) {
        lead = {};
        headers.forEach((h, idx) => { lead[h] = rows[i][idx] || ''; });
        break;
      }
    }

    if (!lead) {
      await setDialerStatus('PAUSED_NO_LEADS', controlSheetId);
      console.log('[dial] EARLY RETURN — no uncalled leads, dialer paused');
      return res.status(200).json({ status: 'paused_no_leads', message: 'No uncalled leads remaining — dialer paused' });
    }

    const toNum = toE164(lead.phone_number);
    const xfer  = toE164(lead.transfer_number);

    // Fail fast if Retell env vars are missing — avoids a silent 4xx to Retell.
    const retellKey   = process.env.RETELL_API_KEY;
    const retellAgent = process.env.RETELL_AGENT_ID;
    const retellFrom  = process.env.RETELL_FROM_NUMBER;
    if (!retellKey || !retellAgent || !retellFrom) {
      console.error('[dial] EARLY RETURN — Retell env vars missing | RETELL_API_KEY:', !!retellKey, '| RETELL_AGENT_ID:', !!retellAgent, '| RETELL_FROM_NUMBER:', !!retellFrom);
      return res.status(500).json({ error: 'Retell configuration incomplete — set RETELL_API_KEY, RETELL_AGENT_ID, RETELL_FROM_NUMBER in Vercel' });
    }

    const payload = {
      from_number:       retellFrom,
      to_number:         toNum,
      override_agent_id: retellAgent,
      retell_llm_dynamic_variables: {
        first_name:        lead.first_name,
        last_name:         lead.last_name,
        phone_number:      toNum,
        lead_source:       lead.lead_source,
        original_interest: lead.original_interest,
        agent_name:        lead.agent_name || process.env.AGENT_NAME || '',
        transfer_number:   xfer || (process.env.TRANSFER_PHONE_NUMBER ? toE164(process.env.TRANSFER_PHONE_NUMBER) : ''),
      },
    };

    console.log('[dial] placing call | to:', toNum, '| lead:', lead.first_name, lead.last_name, '| from:', retellFrom, '| agent:', retellAgent);

    const retellRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + retellKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const retellBody = await retellRes.text();
    if (!retellRes.ok) {
      console.error('[dial] Retell error | status:', retellRes.status, '| body:', retellBody);
      return res.status(502).json({ error: 'Retell API error: ' + retellBody });
    }

    const result    = JSON.parse(retellBody);
    const remaining = rows.slice(1).filter(r => !(r[statusCol] || '').trim()).length - 1;
    console.log('[dial] call placed | call_id:', result.call_id, '| remaining uncalled:', remaining);

    return res.status(200).json({
      status:             'called',
      call_id:            result.call_id,
      called:             lead.first_name + ' ' + lead.last_name + ' at ' + toNum,
      remaining_uncalled: remaining,
    });
  } catch (err) {
    console.error('[dial] unhandled error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
