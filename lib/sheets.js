const { google } = require('googleapis');

const SHEET_TAB = 'lead-reactivation-sheet';
const SHEET_ID  = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID;

function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) return {};
  key = key.replace(/\\n/g, '\n');
  return { client_email: email, private_key: key };
}

function getClient() {
  const creds = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function colLetter(idx) {
  let letter = '';
  let n = idx;
  do {
    letter = String.fromCharCode(65 + (n % 26)) + letter;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letter;
}

// getAllRows and batchWrite already accept an explicit sheetId.
async function getAllRows(sheetId) {
  const id = sheetId || SHEET_ID;
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${SHEET_TAB}!A:S`,
  });
  return res.data.values || [];
}

async function batchWrite(data, sheetId) {
  const id = sheetId || SHEET_ID;
  const client = getClient();
  await client.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });
}

// ---- Dialer pause/resume ----
const CONTROL_TAB = 'DialerControl';

const DIALER_CELL_MAP = {
  RUNNING:          { status: 'active',           resume_allowed: true  },
  PAUSED:           { status: 'paused_by_client', resume_allowed: true  },
  PAUSED_BY_CLIENT: { status: 'paused_by_client', resume_allowed: true  },
  PAUSED_BY_ADMIN:  { status: 'paused_by_admin',  resume_allowed: false },
  PAUSED_BY_LIMIT:  { status: 'paused_by_limit',  resume_allowed: false },
  PAUSED_NO_LEADS:  { status: 'paused_no_leads',  resume_allowed: false },
};

const VALID_CELL_VALUES = new Set(Object.keys(DIALER_CELL_MAP));

function defaultStatus() {
  return process.env.DIALER_PAUSED === 'true' ? 'PAUSED' : 'RUNNING';
}

async function ensureControlTab(client, sheetId) {
  const id = sheetId || SHEET_ID;
  const meta = await client.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties.title' });
  const exists = (meta.data.sheets || []).some(s => s.properties.title === CONTROL_TAB);
  if (!exists) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title: CONTROL_TAB } } }] },
    });
  }
}

async function getDialerState(controlSheetId) {
  const id = controlSheetId || SHEET_ID;
  try {
    const client = getClient();
    const res = await client.spreadsheets.values.get({ spreadsheetId: id, range: `${CONTROL_TAB}!A1` });
    const raw = (((res.data.values || [[]])[0] || [])[0] || '').toUpperCase().trim() || defaultStatus();
    const mapped = DIALER_CELL_MAP[raw] || DIALER_CELL_MAP[defaultStatus()];
    return { ...mapped, raw };
  } catch {
    const fallback = defaultStatus();
    return { ...(DIALER_CELL_MAP[fallback] || DIALER_CELL_MAP.RUNNING), raw: fallback };
  }
}

async function getDialerStatus(controlSheetId) {
  const state = await getDialerState(controlSheetId);
  return state.status === 'active' ? 'RUNNING' : 'PAUSED';
}

async function setDialerStatus(status, controlSheetId) {
  const id = controlSheetId || SHEET_ID;
  const upper = (status || '').toUpperCase();
  let normalized;
  if (VALID_CELL_VALUES.has(upper)) {
    normalized = upper;
  } else if (upper === 'RESUME') {
    normalized = 'RUNNING';
  } else {
    normalized = 'RUNNING';
  }
  const client = getClient();
  await ensureControlTab(client, id);
  await client.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${CONTROL_TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[normalized]] },
  });
  return normalized;
}

// ---- Agent profile (Profile!A1, stored as JSON) ----
const PROFILE_TAB = 'Profile';

async function ensureProfileTab(client, sheetId) {
  const id = sheetId || SHEET_ID;
  const meta = await client.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties.title' });
  const exists = (meta.data.sheets || []).some(s => s.properties.title === PROFILE_TAB);
  if (!exists) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title: PROFILE_TAB } } }] },
    });
  }
}

async function getProfile(controlSheetId) {
  const id = controlSheetId || SHEET_ID;
  try {
    const client = getClient();
    const res = await client.spreadsheets.values.get({ spreadsheetId: id, range: `${PROFILE_TAB}!A1` });
    const raw = ((res.data.values || [[]])[0] || [])[0];
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setProfile(profile, controlSheetId) {
  const id = controlSheetId || SHEET_ID;
  const client = getClient();
  await ensureProfileTab(client, id);
  await client.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${PROFILE_TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [[JSON.stringify(profile)]] },
  });
  return profile;
}

// Returns the tenant's configured leads sheet (profile.dataSheetId) or
// falls back to their control sheet rather than the global env var.
async function getEffectiveSheetId(controlSheetId) {
  const fallback = controlSheetId || SHEET_ID;
  try {
    const profile = await getProfile(controlSheetId);
    if (profile?.dataSheetId) return profile.dataSheetId;
  } catch {}
  return fallback;
}

module.exports = {
  getAllRows,
  batchWrite,
  colLetter,
  getDialerStatus,
  getDialerState,
  setDialerStatus,
  getProfile,
  setProfile,
  getEffectiveSheetId,
  SHEET_TAB,
  SHEET_ID,
};
