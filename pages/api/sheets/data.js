import { getSheetsClient, getServiceAccountEmail, RO } from '../../../lib/sheets-client';
import { getProfile } from '../../../lib/sheets';
import { buildPlanSummary } from '../../../lib/plan-config';
const { verifyRequest, AuthError } = require('../../../lib/tenant-auth');

const SHEET_TAB = process.env.SHEET_TAB_NAME || 'lead-reactivation-sheet';

function normStatus(s) {
  const v = (s || '').toUpperCase().trim();
  if (['HOT', 'WARM', 'COLD', 'SKIP', 'RETRY'].includes(v)) return v;
  if (v === 'ANSWERED') return 'WARM';
  if (v === 'VOICEMAIL') return 'COLD';
  if (v === 'NO_ANSWER' || v === 'UNKNOWN') return 'SKIP';
  return v || null;
}

function processRows(rows) {
  if (!rows || rows.length < 2) return null;
  const hdrs = rows[0];
  const ix = n => hdrs.indexOf(n);

  const allLeads = rows.slice(1).map((r, i) => ({
    rowIndex: i + 2,
    name:     [r[ix('first_name')] || '', r[ix('last_name')] || ''].join(' ').trim() || null,
    phone:    r[ix('phone_number')] || '',
    source:   r[ix('lead_source')]  || '',
    interest: r[ix('original_interest')] || '',
    dateStr:  r[ix('last_called')] || r[ix('date_added')] || '',
    status:   normStatus(r[ix('call_status')] || ''),
    quality:  parseFloat(r[ix('interest_level')] || r[ix('sentiment_score')] || '0') || 0,
  }));

  const records = allLeads.filter(r => r.status);
  const pending = allLeads.filter(r => !r.status).length;

  if (records.length === 0 && pending === 0) return null;

  const total = records.length;
  const hot   = records.filter(r => r.status === 'HOT').length;
  const warm  = records.filter(r => r.status === 'WARM').length;
  const cold  = records.filter(r => r.status === 'COLD').length;
  const skip  = records.filter(r => r.status === 'SKIP').length;
  const qs    = records.map(r => r.quality).filter(q => q > 0);
  const avgQ  = qs.length ? +(qs.reduce((a, b) => a + b, 0) / qs.length).toFixed(1) : 0;

  const dayMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dayMap[d.toISOString().split('T')[0]] = 0;
  }
  records.forEach(r => { const k = (r.dateStr || '').split('T')[0]; if (dayMap[k] !== undefined) dayMap[k]++; });
  const dailyVolume = Object.entries(dayMap).map(([d, c]) => ({ date: d.slice(5).replace('-', '/'), calls: c }));

  const wkMap = {};
  records.forEach(r => {
    if (!r.dateStr || !r.quality) return;
    const d = new Date(r.dateStr); if (isNaN(d)) return;
    d.setDate(d.getDate() - d.getDay());
    const wk = d.toISOString().split('T')[0];
    if (!wkMap[wk]) wkMap[wk] = [];
    wkMap[wk].push(r.quality);
  });
  const qualityTrend = Object.entries(wkMap).sort(([a], [b]) => a > b ? 1 : -1).slice(-8)
    .map(([, s], i) => ({ week: 'Wk ' + (i + 1), score: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) }));

  return {
    status: 'ok',
    kpis: { total, hot, hotPct: total ? Math.round(hot / total * 100) : 0, avgQ, roi: hot * 0.30 * 7500, pending },
    statusBreakdown: [
      { name: 'HOT',  value: hot,  color: '#10B981' },
      { name: 'WARM', value: warm, color: '#FBBF24' },
      { name: 'COLD', value: cold, color: '#9CA3AF' },
      { name: 'SKIP', value: skip, color: '#D1D5DB' },
    ].filter(s => s.value > 0),
    dailyVolume,
    qualityTrend,
    recentCalls: records.slice(-10).reverse(),
    allLeads: allLeads.slice(0, 200),
    lastUpdated: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  let tenant;
  try { tenant = verifyRequest(req); } catch (err) {
    return res.status(err instanceof AuthError ? err.status : 401).json({ error: err.message || 'Unauthorized' });
  }
  // Phase 2 TODO: use tenant.controlSheetId for tenant-scoped sheet routing
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 's-maxage=30,stale-while-revalidate=59');

  let sheetId;
  let profile = null;
  try {
    profile = await getProfile();
    sheetId = profile?.dataSheetId || process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID;
  } catch {
    sheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID;
  }

  if (!sheetId) {
    return res.status(200).json({
      status: 'not_configured',
      serviceAccountEmail: getServiceAccountEmail(),
    });
  }

  try {
    const client = getSheetsClient(RO);
    const result = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A:R`,
    });
    const rows = result.data.values || [];

    if (rows.length < 2) {
      return res.status(200).json({
        status: 'empty',
        sheetId,
        tab: SHEET_TAB,
        kpis: { total: 0, hot: 0, hotPct: 0, avgQ: 0, roi: 0, pending: 0 },
        allLeads: [],
        serviceAccountEmail: getServiceAccountEmail(),
      });
    }

    const data = processRows(rows);
    if (!data) {
      return res.status(200).json({
        status: 'empty',
        sheetId,
        tab: SHEET_TAB,
        rowCount: rows.length - 1,
        kpis: { total: 0, hot: 0, hotPct: 0, avgQ: 0, roi: 0, pending: 0 },
        allLeads: [],
        serviceAccountEmail: getServiceAccountEmail(),
      });
    }

    const plan = buildPlanSummary(profile, rows);
    return res.status(200).json({ ...data, sheetId, plan });
  } catch (err) {
    if (err.code === 403 || err.status === 403) {
      return res.status(200).json({
        status: 'forbidden',
        sheetId,
        serviceAccountEmail: getServiceAccountEmail(),
      });
    }
    if (err.code === 404 || err.status === 404 || (err.message || '').includes('not found')) {
      return res.status(200).json({ status: 'not_found', sheetId });
    }
    return res.status(200).json({ status: 'error', error: err.message });
  }
}
