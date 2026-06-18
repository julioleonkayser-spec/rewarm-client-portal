const { getProfile, getAllRows, SHEET_ID } = require('../../lib/sheets');
const { buildPlanSummary } = require('../../lib/plan-config');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const profile = await getProfile();
    const sheetId = profile?.dataSheetId || SHEET_ID;
    let rows = [];
    if (sheetId) {
      try { rows = await getAllRows(sheetId); } catch {}
    }
    const plan = buildPlanSummary(profile, rows);
    return res.status(200).json({ plan });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
