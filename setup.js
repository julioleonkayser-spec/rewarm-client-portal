#!/usr/bin/env node
'use strict';

/**
 * One-time buyer setup script.
 * Run after filling .env.local:  node setup.js
 *
 * Creates:
 *   1. A Retell AI agent (from Real-Estate-Calls-Agent.json)
 *   2. A Google Sheet "Lead-Reactivation-Real-Estate" with:
 *      - lead-reactivation-sheet  (headers)
 *      - DialerControl            (A1 = PAUSED)
 *
 * Prints RETELL_AGENT_ID and GOOGLE_SHEETS_ID to add to .env.local.
 */

const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found.');
    console.error('Copy .env.example to .env.local and fill in all required values, then re-run.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value  = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Retell: create LLM then agent
// ---------------------------------------------------------------------------
async function createRetellAgent() {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) throw new Error('RETELL_API_KEY is missing from .env.local');

  const configPath = path.join(__dirname, 'Real-Estate-Calls-Agent.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Real-Estate-Calls-Agent.json not found in project root');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Step 1: create the Retell LLM (strip server-assigned read-only fields)
  const llmSource = config.retellLlmData || {};
  const {
    llm_id: _lid,
    version: _lver,
    last_modification_timestamp: _lts,
    is_published: _lpub,
    ...llmBody
  } = llmSource;

  console.log('Creating Retell LLM...');
  const llmRes = await fetch('https://api.retellai.com/create-retell-llm', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(llmBody),
  });
  if (!llmRes.ok) {
    throw new Error('Retell LLM creation failed: ' + await llmRes.text());
  }
  const llm = await llmRes.json();
  console.log('  LLM created:', llm.llm_id);

  // Step 2: create the agent (strip read-only fields; attach new llm_id)
  const {
    agent_id: _aid,
    retellLlmData: _rld,
    last_modification_timestamp: _ats,
    version: _aver,
    base_version: _bver,
    is_published: _apub,
    response_engine: _re,
    webhook_url: _wh,
    ...agentBase
  } = config;

  const baseUrl = process.env.WEBHOOK_BASE_URL;
  if (!baseUrl) throw new Error('WEBHOOK_BASE_URL is missing from .env.local (e.g. https://your-app.vercel.app)');

  const agentBody = {
    ...agentBase,
    response_engine: { type: 'retell-llm', llm_id: llm.llm_id },
    webhook_url: baseUrl.replace(/\/$/, '') + '/api/post-call',
  };

  console.log('Creating Retell agent...');
  const agentRes = await fetch('https://api.retellai.com/create-agent', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentBody),
  });
  if (!agentRes.ok) {
    throw new Error('Retell agent creation failed: ' + await agentRes.text());
  }
  const agent = await agentRes.json();
  console.log('  Agent created:', agent.agent_id);
  return agent.agent_id;
}

// ---------------------------------------------------------------------------
// Google Sheets: create spreadsheet with two tabs
// ---------------------------------------------------------------------------
async function createGoogleSheet() {
  const jsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonRaw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing from .env.local');

  let creds;
  try {
    creds = JSON.parse(jsonRaw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (!creds.client_email) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  const sheetsApi = google.sheets({ version: 'v4', auth });

  console.log('Creating Google Sheet...');
  const spreadsheet = await sheetsApi.spreadsheets.create({
    requestBody: {
      properties: { title: 'Lead-Reactivation-Real-Estate' },
      sheets: [
        { properties: { title: 'lead-reactivation-sheet', index: 0 } },
        { properties: { title: 'DialerControl',           index: 1 } },
      ],
    },
  });
  const sheetId = spreadsheet.data.spreadsheetId;
  console.log('  Sheet created:', sheetId);

  // Write column headers
  const headers = [
    'first_name', 'last_name', 'phone_number', 'lead_source',
    'original_interest', 'date_added', 'agent_name', 'transfer_number',
    'call_status', 'interest_level', 'timeline', 'recording',
  ];
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'lead-reactivation-sheet!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });
  console.log('  Headers written to lead-reactivation-sheet');

  // Initialize DialerControl to PAUSED so calls don't fire before leads are added
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'DialerControl!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [['PAUSED']] },
  });
  console.log('  DialerControl!A1 = PAUSED');

  return sheetId;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnv();
  console.log('\n--- ReWarm Setup ---\n');

  let agentId, sheetId;

  try {
    agentId = await createRetellAgent();
  } catch (err) {
    console.error('\nRetell setup failed:', err.message);
    process.exit(1);
  }

  try {
    sheetId = await createGoogleSheet();
  } catch (err) {
    console.error('\nGoogle Sheets setup failed:', err.message);
    process.exit(1);
  }

  console.log('\n--- Setup complete ---\n');
  console.log('Add these two lines to your .env.local:\n');
  console.log('  RETELL_AGENT_ID=' + agentId);
  console.log('  GOOGLE_SHEETS_ID=' + sheetId);
  console.log('\nThen deploy to Vercel and update the Retell agent webhook in the');
  console.log('Retell dashboard (agent Settings > Webhook URL) to:');
  console.log('  https://<your-vercel-domain>/api/post-call\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
