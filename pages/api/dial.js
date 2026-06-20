const { getAllRows, getDialerState, setDialerStatus, getProfile, getEffectiveSheetId } = require('../../lib/sheets');
const { getAllTenants } = require('../../lib/tenant-auth');
const { buildPlanSummary } = require('../../lib/plan-config');
const { toE164 } = require('../../lib/phone');

const activeTenants = new Set();

async function sendNoLeadsEmail(ownerEmail, leadCount) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[dial] RESEND_API_KEY not set — skipping paused_no_leads email');
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@rewarm.ai';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [ownerEmail],
        subject: 'Your ReWarm agent has called all your leads',
        html: `<p>Your AI agent finished calling all ${leadCount} lead${leadCount === 1 ? '' : 's'} in your sheet.</p><p>Add new leads to your sheet to continue.</p><p><a href="https://rewarm-client-portal.vercel.app">Log in to ReWarm</a></p>`,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => r.statusText);
      console.error('[dial] Resend error sending paused_no_leads email:', r.status, detail);
    } else {
      console.log('[dial] paused_no_leads email sent to', ownerEmail);
    }
  } catch (err) {
    console.error('[dial] failed to send paused_no_leads email:', err.message);
  }
}

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

  console.log('[dial] invoked | method:', req.method);

  try {
    const tenants = getAllTenants();
    if (!tenants.length) {
      console.log('[dial] no tenants configured');
      return res.status(200).json({ results: [], message: 'No tenants configured' });
    }

    console.log('[dial] processing', tenants.length, 'tenant(s):', tenants.map(t => t.tenantId).join(', '));

    const TIMEOUT_MS = 25000;
    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve({ timedOut: true, results: [] }), TIMEOUT_MS)
    );
    const processingPromise = Promise.all(tenants.map(t => processTenant(t)))
      .then(results => ({ timedOut: false, results }));

    const { timedOut, results } = await Promise.race([processingPromise, timeoutPromise]);

    if (timedOut) {
      console.warn('[dial] response timeout hit — returning partial results');
    }

    return res.status(200).json({ results, ...(timedOut && { warning: 'partial_timeout' }) });
  } catch (err) {
    console.error('[dial] unhandled error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function processTenant(tenant) {
  const { tenantId, controlSheetId } = tenant;

  if (activeTenants.has(tenantId)) {
    console.log('[dial]', tenantId, '| skipped — already processing');
    return { tenant: tenantId, status: 'skipped_concurrent' };
  }
  activeTenants.add(tenantId);

  console.log('[dial]', tenantId, '| controlSheetId:', controlSheetId ? controlSheetId.slice(0, 12) + '...' : 'NULL');

  try {
    const dialerState = await getDialerState(controlSheetId);
    console.log('[dial]', tenantId, '| dialer state:', dialerState.status, '(raw:', dialerState.raw + ')');

    if (dialerState.status !== 'active') {
      return { tenant: tenantId, status: dialerState.status };
    }

    const profile = await getProfile(controlSheetId);
    const sheetId = await getEffectiveSheetId(controlSheetId);
    console.log('[dial]', tenantId, '| effective sheetId:', sheetId ? sheetId.slice(0, 12) + '...' : 'NULL', '| plan:', profile?.plan_name || 'unknown');

    const rows = await getAllRows(sheetId);

    if (rows.length === 0) {
      await setDialerStatus('PAUSED_NO_LEADS', controlSheetId);
      console.log('[dial]', tenantId, '| empty sheet (no rows), paused');
      if (profile?.owner_email) await sendNoLeadsEmail(profile.owner_email, 0);
      return { tenant: tenantId, status: 'paused_no_leads' };
    }

    console.log('[dial]', tenantId, '| leads:', rows.length - 1);

    const plan = buildPlanSummary(profile, rows);
    if (plan.at_limit) {
      await setDialerStatus('PAUSED_BY_LIMIT', controlSheetId);
      console.log('[dial]', tenantId, '| plan limit reached, paused');
      return { tenant: tenantId, status: 'paused_by_limit' };
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
      console.log('[dial]', tenantId, '| no uncalled leads, paused');
      const totalLeads = rows.length - 1;
      if (profile?.owner_email) await sendNoLeadsEmail(profile.owner_email, totalLeads);
      return { tenant: tenantId, status: 'paused_no_leads' };
    }

    const toNum = toE164(lead.phone_number);
    const xfer  = toE164(lead.transfer_number);

    const retellKey   = process.env.RETELL_API_KEY;
    const retellAgent = profile?.retell_agent_id || process.env.RETELL_AGENT_ID;
    const retellFrom  = process.env.RETELL_FROM_NUMBER;
    if (!retellKey || !retellAgent || !retellFrom) {
      console.error('[dial]', tenantId, '| Retell env vars missing | RETELL_API_KEY:', !!retellKey, '| RETELL_AGENT_ID:', !!retellAgent, '| RETELL_FROM_NUMBER:', !!retellFrom);
      return { tenant: tenantId, status: 'error', error: 'Retell configuration incomplete' };
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
        control_sheet_id:  controlSheetId || '',
      },
    };

    console.log('[dial]', tenantId, '| placing call | to:', toNum, '| lead:', lead.first_name, lead.last_name, '| from:', retellFrom, '| agent:', retellAgent);

    const retellRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + retellKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const retellBody = await retellRes.text();
    if (!retellRes.ok) {
      console.error('[dial]', tenantId, '| Retell error | status:', retellRes.status, '| body:', retellBody);
      return { tenant: tenantId, status: 'error', error: 'Retell API error: ' + retellBody };
    }

    const result    = JSON.parse(retellBody);
    const remaining = rows.slice(1).filter(r => !(r[statusCol] || '').trim()).length - 1;
    console.log('[dial]', tenantId, '| call placed | call_id:', result.call_id, '| remaining uncalled:', remaining);

    return {
      tenant:             tenantId,
      status:             'called',
      call_id:            result.call_id,
      called:             lead.first_name + ' ' + lead.last_name + ' at ' + toNum,
      remaining_uncalled: remaining,
    };
  } catch (err) {
    console.error('[dial]', tenantId, '| error:', err.message);
    return { tenant: tenantId, status: 'error', error: err.message };
  } finally {
    activeTenants.delete(tenantId);
  }
}
