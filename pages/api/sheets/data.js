import { google } from 'googleapis';

const SHEET_TAB = process.env.SHEET_TAB_NAME || 'lead-reactivation-sheet';

function getSheets() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

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
  const records = rows.slice(1).map(r => ({
    phone:    r[ix('phone_number')] || '',
    source:   r[ix('lead_source')]  || '',
    interest: r[ix('original_interest')] || '',
    dateStr:  r[ix('last_called')] || r[ix('date_added')] || '',
    status:   normStatus(r[ix('call_status')] || ''),
    quality:  parseFloat(r[ix('interest_level')] || r[ix('sentiment_score')] || '0') || 0,
  })).filter(r => r.status);

  if (records.length < 3) return null;

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
    kpis: { total, hot, hotPct: total ? Math.round(hot / total * 100) : 0, avgQ, roi: hot * 0.30 * 7500 },
    statusBreakdown: [
      { name: 'HOT',  value: hot,  color: '#10B981' },
      { name: 'WARM', value: warm, color: '#FBBF24' },
      { name: 'COLD', value: cold, color: '#9CA3AF' },
      { name: 'SKIP', value: skip, color: '#D1D5DB' },
    ].filter(s => s.value > 0),
    dailyVolume,
    qualityTrend,
    recentCalls: [...records].sort((a, b) => b.dateStr.localeCompare(a.dateStr)).slice(0, 10),
    isDemo: false,
    lastUpdated: new Date().toISOString(),
  };
}

function demo() {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().slice(5, 10).replace('-', '/'), calls: Math.floor(Math.random() * 4) + 1 };
  });
  return {
    kpis: { total: 47, hot: 12, hotPct: 26, avgQ: 7.3, roi: 27000 },
    statusBreakdown: [
      { name: 'HOT',  value: 12, color: '#10B981' },
      { name: 'WARM', value: 18, color: '#FBBF24' },
      { name: 'COLD', value: 11, color: '#9CA3AF' },
      { name: 'SKIP', value: 6,  color: '#D1D5DB' },
    ],
    dailyVolume: days,
    qualityTrend: [
      { week: 'Wk 1', score: 5.8 }, { week: 'Wk 2', score: 6.4 },
      { week: 'Wk 3', score: 7.1 }, { week: 'Wk 4', score: 7.3 },
    ],
    recentCalls: [
      { phone: '+16025550101', source: 'Zillow',      interest: '3BR in Scottsdale under $500K', quality: 8.5, status: 'HOT',  dateStr: '2026-06-11' },
      { phone: '+14805550102', source: 'Facebook Ad', interest: 'Selling 4BR in Mesa',            quality: 6.2, status: 'WARM', dateStr: '2026-06-11' },
      { phone: '+16235550103', source: 'Realtor.com', interest: '4BR with pool in Gilbert',       quality: 7.8, status: 'HOT',  dateStr: '2026-06-10' },
      { phone: '+14805550104', source: 'Google Ad',   interest: 'Condo in Old Town Scottsdale',   quality: 4.5, status: 'COLD', dateStr: '2026-06-10' },
      { phone: '+16025550105', source: 'Open House',  interest: 'Selling 3BR in Chandler',        quality: 5.9, status: 'WARM', dateStr: '2026-06-09' },
    ],
    isDemo: true,
    lastUpdated: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 's-maxage=30,stale-while-revalidate=59');
  try {
    const sheets = getSheets();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${SHEET_TAB}!A:R`,
    });
    const data = processRows(result.data.values);
    return res.status(200).json(data || demo());
  } catch {
    return res.status(200).json(demo());
  }
}
