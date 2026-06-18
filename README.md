# ReWarm — AI Voice Lead Reactivation for Real Estate

ReWarm is a Next.js application that automatically calls cold real estate leads, qualifies them with an AI voice agent (powered by Retell AI), and writes results back to a Google Sheet in real time.

**What it does:**
- Dials leads from your Google Sheet on a cron schedule (every 5 minutes via cron-job.org)
- Qualifies interest level, timeline, and pre-approval status during the call
- Live-transfers hot leads directly to the real estate agent
- Logs call status, notes, and a recording link back to the sheet
- Shows a live analytics dashboard at `/dashboard`
- Lets you pause/resume dialing at `/dialer-control`

---

## Buyer Setup

### Prerequisites

- Node.js 18+
- A [Retell AI](https://app.retellai.com) account with a purchased phone number
- A Google Cloud project with the **Google Sheets API** and **Google Drive API** enabled

---

### Step 1 — Get your Retell API key

1. Log in to [app.retellai.com](https://app.retellai.com)
2. Go to **Settings > API Keys**
3. Create a new key and copy it

---

### Step 2 — Create a Google Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API** and **Google Drive API** under *APIs & Services > Library*
4. Go to *APIs & Services > Credentials* and click **Create Credentials > Service Account**
5. Give it any name, click **Done**
6. Click the service account, go to the **Keys** tab, click **Add Key > Create new key**, choose **JSON**
7. Download the `.json` file — you will paste its contents into `.env.local` in the next step

---

### Step 3 — Fill in .env.local

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `RETELL_API_KEY` | Retell dashboard > Settings > API Keys |
| `RETELL_FROM_NUMBER` | Retell dashboard > Phone Numbers |
| `AGENT_NAME` | The real estate agent's name (e.g. "Mike Thompson") |
| `TRANSFER_PHONE_NUMBER` | The agent's direct phone number for live transfers |
| `DIALER_PIN` | Any 4-8 digit PIN you choose for the /dialer-control page |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste the full contents of the downloaded JSON file as one line |

Leave `RETELL_AGENT_ID` and `GOOGLE_SHEETS_ID` blank for now — setup.js will generate them.

---

### Step 4 — Run setup.js

```bash
node setup.js
```

This will:
- Create the Retell AI agent in your account using the included voice and prompt configuration
- Create a Google Sheet called **Lead-Reactivation-Real-Estate** with the correct tabs and column headers

At the end, it prints two values. Copy them into your `.env.local`:

```
RETELL_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SHEETS_ID=1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Step 5 — Deploy to Vercel

Push to GitHub and connect the repo at [vercel.com/new](https://vercel.com/new), or run:

```bash
npx vercel --prod
```

Add all variables from `.env.local` as **Environment Variables** in the Vercel project settings before deploying.

---

### Step 6 — Update the Retell webhook URL

After deploy, go to the [Retell dashboard](https://app.retellai.com), open your agent, and set the **Webhook URL** to:

```
https://<your-vercel-domain>/api/post-call
```

---

### Step 7 — Add leads to the sheet

Open the **Lead-Reactivation-Real-Estate** Google Sheet and add rows to the `lead-reactivation-sheet` tab.

Required columns per lead:

| Column | Example |
|---|---|
| `first_name` | Sarah |
| `last_name` | Johnson |
| `phone_number` | +16025550101 |
| `lead_source` | Zillow |
| `original_interest` | 3BR in Scottsdale under $500K |
| `date_added` | 2026-06-17 |
| `agent_name` | Mike Thompson *(optional — falls back to `AGENT_NAME` env var)* |
| `transfer_number` | +14805550100 *(optional — falls back to `TRANSFER_PHONE_NUMBER` env var)* |

Leave `call_status`, `interest_level`, `timeline`, and `recording` blank — the AI fills them in after each call.

---

### Step 8 — Set up the dialing cron

1. Go to [cron-job.org](https://cron-job.org) (free) and create an account
2. Create a new cron job:
   - **URL:** `https://<your-vercel-domain>/api/dial`
   - **Schedule:** every 5 minutes
3. Go to `/dialer-control`, enter your PIN, and click **RESUME calls** to start dialing

---

## Pages

| URL | Purpose |
|---|---|
| `/dashboard` | Live analytics — call volume, status breakdown, quality trend |
| `/dialer-control` | Pause or resume the dialer (PIN-protected) |

---

## Architecture

```
cron-job.org (every 5 min)
  --> GET /api/dial          picks next uncalled lead, triggers Retell call
  --> Retell calls lead
  --> POST /api/pre-call     Retell fetches lead variables before call starts
  --> POST /api/post-call    Retell sends results after call ends
  --> Google Sheet updated
  --> GET /api/sheets/data   dashboard polls for aggregated metrics (30s cache)
```
