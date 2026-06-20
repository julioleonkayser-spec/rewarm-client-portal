import { getSheetsClient, parseSheetId, getServiceAccountEmail, RO } from '../../../lib/sheets-client';
const { verifyRequest, AuthError } = require('../../../lib/tenant-auth');
const { getProfile, setProfile } = require('../../../lib/sheets');


const REQUIRED_HEADERS = [
  'first_name', 'last_name', 'phone_number', 'call_status',
  'lead_source', 'original_interest', 'agent_name', 'transfer_number',
];
// date_added is auto-created by post-call.js on the first completed call.
const RECOMMENDED_HEADERS = ['date_added'];

export default async function handler(req, res) {
  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sheetId: raw } = req.body || {};
  const sheetId = parseSheetId(raw);
  if (!sheetId) return res.status(400).json({ ok: false, error: 'Invalid sheet URL or ID' });

  const tab = process.env.SHEET_TAB_NAME || 'lead-reactivation-sheet';
  try {
    const client = getSheetsClient(RO);
    const result = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tab}!A1:Z1`,
    });
    const headers = (result.data.values?.[0] || []).map(h => h.trim().toLowerCase());
    if (headers.length === 0) {
      return res.status(200).json({ ok: false, error: `Tab "${tab}" exists but has no headers. Add the required columns.` });
    }
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return res.status(200).json({ ok: false, error: `Missing required columns: ${missing.join(', ')}`, found: headers });
    }
    const full = await client.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A:A` });
    const rowCount = Math.max(0, (full.data.values?.length || 1) - 1);
    const missingRecommended = RECOMMENDED_HEADERS.filter(h => !headers.includes(h));
    try {
      const existing = (await getProfile(tenant.controlSheetId)) || {};
      await setProfile({ ...existing, dataSheetId: sheetId }, tenant.controlSheetId);
    } catch (saveErr) {
      console.error('[sheets/verify] profile save failed:', saveErr.message);
      return res.status(500).json({ ok: false, error: 'Sheet is accessible but could not save the connection. Please try again.' });
    }
    return res.status(200).json({ ok: true, sheetId, rowCount, tab, missingRecommended });
  } catch (err) {
    if (err.code === 403 || err.status === 403) {
      return res.status(200).json({
        ok: false,
        error: `Permission denied. Share the sheet with: ${getServiceAccountEmail() || 'the service account email'} (Viewer access).`,
      });
    }
    if (err.code === 404 || err.status === 404 || (err.message || '').includes('not found')) {
      return res.status(200).json({ ok: false, error: 'Sheet not found. Check the URL or ID.' });
    }
    return res.status(200).json({ ok: false, error: err.message || 'Unknown error' });
  }
}
