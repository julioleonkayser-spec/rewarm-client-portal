const { getAllRows, batchWrite, colLetter, SHEET_TAB, getEffectiveSheetId } = require('../../lib/sheets');
const { verifyRequest, AuthError } = require('../../lib/tenant-auth');

const { normalize } = require('../../lib/phone');

function stageFromStatus(status, hasNextAction) {
  const s = (status || '').toLowerCase();
  if (!s) return 'new';
  if (s === 'answered' && hasNextAction) return 'qualified';
  if (s === 'answered') return 'contacted';
  if (s === 'voicemail') return 'contacted';
  if (s === 'no_answer') return 'new';
  if (s === 'booked') return 'booked';
  if (s === 'warm') return 'warm';
  return 'contacted';
}

function rowToLead(headers, row, rowIndex) {
  const get = (col) => row[headers.indexOf(col)] || '';
  const firstName = get('first_name');
  const lastName = get('last_name');
  const nextAction = get('next_action');
  const callStatus = get('call_status');
  return {
    // 1-based sheet row number, used as the stable id for updates.
    rowNumber: rowIndex + 1,
    name: [firstName, lastName].filter(Boolean).join(' ') || '(No name)',
    firstName,
    lastName,
    phone: get('phone_number'),
    leadSource: get('lead_source'),
    originalInterest: get('original_interest'),
    agentName: get('agent_name'),
    transferNumber: get('transfer_number'),
    callStatus,
    interestLevel: get('interest_level'),
    timeline: get('timeline'),
    preApproved: get('pre_approved'),
    workingWithAgent: get('working_with_agent'),
    transferAttempted: get('transfer_attempted'),
    notes: get('notes'),
    nextAction,
    lastCalled: get('last_called') || null,
    recording: get('recording') || null,
    stage: stageFromStatus(callStatus, Boolean(nextAction)),
  };
}

export default async function handler(req, res) {
  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }
  try {
    const sheetId = await getEffectiveSheetId(tenant.controlSheetId);

    if (req.method === 'GET') {
      const rows = await getAllRows(sheetId);
      if (!rows.length) return res.status(200).json({ leads: [] });
      const headers = rows[0];
      const leads = rows.slice(1)
        .map((row, i) => rowToLead(headers, row, i + 1))
        .filter(l => l.phone);
      return res.status(200).json({ leads });
    }

    if (req.method === 'PATCH') {
      const { phone, notes, nextAction } = req.body || {};
      if (!phone) return res.status(400).json({ error: 'phone is required' });
      const target = normalize(phone);

      const rows = await getAllRows(sheetId);
      const headers = rows[0];
      const phoneCol = headers.indexOf('phone_number');
      let sheetsRow = -1;
      for (let i = 1; i < rows.length; i++) {
        if (normalize(rows[i][phoneCol] || '') === target) { sheetsRow = i + 1; break; }
      }
      if (sheetsRow === -1) return res.status(404).json({ error: 'Lead not found' });

      const data = [];
      let newColsAdded = 0;

      if (notes !== undefined) {
        let colIdx = headers.indexOf('notes');
        if (colIdx === -1) {
          colIdx = headers.length + newColsAdded;
          newColsAdded++;
          data.push({ range: SHEET_TAB + '!' + colLetter(colIdx) + '1', values: [['notes']] });
        }
        data.push({ range: SHEET_TAB + '!' + colLetter(colIdx) + sheetsRow, values: [[notes]] });
      }

      if (nextAction !== undefined) {
        let colIdx = headers.indexOf('next_action');
        if (colIdx === -1) {
          colIdx = headers.length + newColsAdded;
          newColsAdded++;
          data.push({ range: SHEET_TAB + '!' + colLetter(colIdx) + '1', values: [['next_action']] });
        }
        data.push({ range: SHEET_TAB + '!' + colLetter(colIdx) + sheetsRow, values: [[nextAction]] });
      }

      if (!data.length) return res.status(400).json({ error: 'Nothing to update' });
      await batchWrite(data, sheetId);
      return res.status(200).json({ status: 'updated', row: sheetsRow });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
