const { google } = require('googleapis');

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

function getSheetsClient(scopes) {
  const creds = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes });
  return google.sheets({ version: 'v4', auth });
}

function getServiceAccountEmail() {
  try {
    const creds = getCredentials();
    if (creds.client_email) return creds.client_email;
  } catch {}
  return null;
}

function parseSheetId(input) {
  if (!input) return null;
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

const RO = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const RW = ['https://www.googleapis.com/auth/spreadsheets'];

module.exports = { getSheetsClient, getServiceAccountEmail, parseSheetId, RO, RW };
