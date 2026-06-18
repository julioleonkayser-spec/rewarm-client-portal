const { getAllRows, getDialerStatus, getEffectiveSheetId } = require('../../lib/sheets');
const { toE164 } = require('../../lib/phone');

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== 'Bearer ' + secret) return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    if ((await getDialerStatus()) === 'PAUSED') {
      return res.status(200).json({ status: 'paused', message: 'Dialer is paused — no call placed' });
    }
    const sheetId = await getEffectiveSheetId();
    const rows = await getAllRows(sheetId);
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
    if (!lead) return res.status(200).json({ status: 'done', message: 'No uncalled leads remaining' });
    const toNum = toE164(lead.phone_number);
    const xfer  = toE164(lead.transfer_number);
    const retellRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RETELL_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_number:       process.env.RETELL_FROM_NUMBER,
        to_number:         toNum,
        override_agent_id: process.env.RETELL_AGENT_ID,
        retell_llm_dynamic_variables: {
          first_name:        lead.first_name,
          last_name:         lead.last_name,
          phone_number:      toNum,
          lead_source:       lead.lead_source,
          original_interest: lead.original_interest,
          agent_name:        lead.agent_name        || process.env.AGENT_NAME        || '',
          transfer_number:   xfer                   || (process.env.TRANSFER_PHONE_NUMBER ? toE164(process.env.TRANSFER_PHONE_NUMBER) : ''),
        },
      }),
    });
    if (!retellRes.ok) return res.status(502).json({ error: 'Retell API error: ' + (await retellRes.text()) });
    const result = await retellRes.json();
    const remaining = rows.slice(1).filter(r => !(r[statusCol] || '').trim()).length - 1;
    return res.status(200).json({ status: 'called', call_id: result.call_id, called: lead.first_name + ' ' + lead.last_name + ' at ' + toNum, remaining_uncalled: remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
