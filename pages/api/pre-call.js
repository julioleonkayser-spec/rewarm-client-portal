const Retell = require('retell-sdk');
const { getAllRows, getEffectiveSheetId } = require('../../lib/sheets');
const { normalize }  = require('../../lib/phone');

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Retell signs with RETELL_API_KEY — no separate webhook secret needed
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf-8');
  const body = JSON.parse(rawBody);
  const isValid = Retell.verify(
    rawBody,
    process.env.RETELL_API_KEY,
    req.headers['x-retell-signature']
  );
  if (!isValid) {
    console.error('[webhook] Invalid Retell signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rawPhone = body.phone_number || body.to_number || body.from_number || '';
  if (!rawPhone) return res.status(400).json({ error: 'phone_number is required' });
  const target = normalize(rawPhone);
  const controlSheetId = body.retell_llm_dynamic_variables?.control_sheet_id || null;
  console.log('[pre-call] lookup for phone (normalized):', target, '| controlSheetId:', controlSheetId ? controlSheetId.slice(0, 12) + '...' : 'from-env');
  try {
    const sheetId = await getEffectiveSheetId(controlSheetId);
    console.log('[pre-call] sheetId:', sheetId ? sheetId.slice(0, 12) + '...' : 'NULL');
    const rows = await getAllRows(sheetId);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Sheet is empty' });
    const headers = rows[0];
    const phoneCol = headers.indexOf('phone_number');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (normalize(row[phoneCol] || '') !== target) continue;
      const get = (col) => row[headers.indexOf(col)] || '';
      return res.status(200).json({
        first_name:       get('first_name'),
        last_name:        get('last_name'),
        phone_number:     get('phone_number'),
        lead_source:      get('lead_source'),
        original_interest:get('original_interest'),
        agent_name:       get('agent_name'),
        transfer_number:  get('transfer_number'),
      });
    }
    console.log('[pre-call] EARLY RETURN — lead not found for phone:', target);
    return res.status(404).json({ error: 'Lead not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
