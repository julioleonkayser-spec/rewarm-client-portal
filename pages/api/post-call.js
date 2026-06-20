const Retell = require('retell-sdk');
const { getAllRows, batchWrite, colLetter, SHEET_TAB, getEffectiveSheetId } = require('../../lib/sheets');
const { normalize } = require('../../lib/phone');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Retell signs with RETELL_API_KEY — no separate webhook secret needed
  const rawBody = JSON.stringify(req.body);
  const isValid = Retell.verify(
    rawBody,
    process.env.RETELL_API_KEY,
    req.headers['x-retell-signature']
  );
  if (!isValid) {
    console.error('[webhook] Invalid Retell signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;

  const event = body.event || '';
  console.log('[post-call] event:', event || '(none)');
  if (event === 'call_started') return res.status(200).json({ status: 'acknowledged' });
  const call = body.call || {};
  if (!Object.keys(call).length) {
    console.log('[post-call] EARLY RETURN — no call object in payload');
    return res.status(200).json({ status: 'no_call_data' });
  }
  const analysis = call.call_analysis || {};
  const custom = analysis.custom_analysis_data || {};
  const rawPhone = call.to_number || call.from_number || '';
  const controlSheetId = call.retell_llm_dynamic_variables?.control_sheet_id || null;
  console.log('[post-call] call_id:', call.call_id || 'unknown', '| to:', call.to_number || 'none', '| disconnection_reason:', call.disconnection_reason || 'none', '| controlSheetId:', controlSheetId ? controlSheetId.slice(0, 12) + '...' : 'from-env');
  if (!rawPhone) {
    console.log('[post-call] EARLY RETURN — no phone number in payload');
    return res.status(400).json({ error: 'No phone number in payload' });
  }
  const target = normalize(rawPhone);
  try {
    const sheetId = await getEffectiveSheetId(controlSheetId);
    const rows = await getAllRows(sheetId);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Sheet is empty' });
    const headers = rows[0];
    const phoneCol = headers.indexOf('phone_number');
    let sheetsRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (normalize(rows[i][phoneCol] || '') === target) { sheetsRow = i + 1; break; }
    }
    console.log('[post-call] sheetId:', sheetId ? sheetId.slice(0, 12) + '...' : 'NULL', '| rows:', rows.length - 1, '| target phone (normalized):', target);
    if (sheetsRow === -1) {
      console.log('[post-call] EARLY RETURN — lead not found for phone:', target);
      return res.status(404).json({ error: 'Lead not found' });
    }
    let callStatus = custom.call_status || '';
    if (!callStatus) {
      const reason = (call.disconnection_reason || '').toLowerCase();
      if (reason.includes('voicemail')) callStatus = 'voicemail';
      else if (['dial_no_answer', 'dial_failed'].includes(reason)) callStatus = 'no_answer';
      else if (call.transcript) callStatus = 'answered';
      else callStatus = 'unknown';
    }
    const notes = custom.notes || analysis.call_summary || '';
    const today = new Date().toISOString().split('T')[0];
    const fieldMap = {
      call_status:        callStatus,
      interest_level:     custom.interest_level || '',
      timeline:           custom.timeline || '',
      pre_approved:       custom.pre_approved || '',
      working_with_agent: custom.working_with_agent || '',
      transfer_attempted: custom.transfer_attempted || '',
      notes,
      next_action:        custom.next_action || '',
      last_called:        today,
    };
    const data = [];
    for (const [field, value] of Object.entries(fieldMap)) {
      if (!value) continue;
      const colIdx = headers.indexOf(field);
      if (colIdx === -1) continue;
      data.push({ range: SHEET_TAB + '!' + colLetter(colIdx) + sheetsRow, values: [[value]] });
    }
    const recordingUrl = call.recording_url || '';
    let newColsAdded = 0;
    if (recordingUrl) {
      let recColIdx = headers.indexOf('recording');
      if (recColIdx === -1) {
        recColIdx = headers.length + newColsAdded;
        newColsAdded++;
        data.push({ range: SHEET_TAB + '!' + colLetter(recColIdx) + '1', values: [['recording']] });
      }
      data.push({ range: SHEET_TAB + '!' + colLetter(recColIdx) + sheetsRow, values: [['=HYPERLINK("' + recordingUrl + '","Play Recording")']] });
    }
    // Set date_added on the first completed call for this lead.
    // Creates the column automatically if absent — enables accurate per-cycle usage counts.
    let dateAddedColIdx = headers.indexOf('date_added');
    if (dateAddedColIdx === -1) {
      dateAddedColIdx = headers.length + newColsAdded;
      data.push({ range: SHEET_TAB + '!' + colLetter(dateAddedColIdx) + '1', values: [['date_added']] });
    }
    const existingDateAdded = ((rows[sheetsRow - 1] || [])[dateAddedColIdx] || '');
    if (!existingDateAdded) {
      data.push({ range: SHEET_TAB + '!' + colLetter(dateAddedColIdx) + sheetsRow, values: [[today]] });
    }
    console.log('[post-call] writing', data.length, 'cells | row:', sheetsRow, '| call_status:', callStatus);
    if (data.length) await batchWrite(data, sheetId);
    return res.status(200).json({ status: 'updated', row: sheetsRow, call_status: callStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
