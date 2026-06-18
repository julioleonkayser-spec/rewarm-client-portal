import { getSheetsClient, parseSheetId, getServiceAccountEmail, RO } from '../../../lib/sheets-client';

const REQUIRED_HEADERS = ['phone_number', 'call_status'];
// Recommended: first_name/last_name improve personalization; date_added enables
// accurate per-cycle usage counting (auto-created by post-call.js after first call).
const RECOMMENDED_HEADERS = ['first_name', 'last_name', 'date_added'];

export default async function handler(req, res) {
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
