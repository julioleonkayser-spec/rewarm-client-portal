// Validates portal access keys server-side so keys never ship in the JS bundle.
//
// Env var priority:
//   ACCESS_KEY_MAP  — JSON string, e.g. '{"KEY-ABC":"Growth","KEY-XYZ":"Starter"}'
//   ACCESS_KEY + ACCESS_KEY_PLAN — single-client shorthand (plan defaults to Growth)
//   Fallback: hardcoded placeholder keys (swap via env vars before real client use)
//
// DEMO_ACCESS_KEY — demo portal key (defaults to REWARM-DEMO-2024)

const DEMO_KEY = (process.env.DEMO_ACCESS_KEY || 'REWARM-DEMO-2024').toUpperCase();
const VALID_PLANS = new Set(['Starter', 'Growth', 'Pro']);

function buildKeyMap() {
  if (process.env.ACCESS_KEY_MAP) {
    try {
      const raw = JSON.parse(process.env.ACCESS_KEY_MAP);
      const map = {};
      for (const [k, v] of Object.entries(raw)) {
        map[k.toUpperCase()] = VALID_PLANS.has(v) ? v : 'Growth';
      }
      return map;
    } catch {}
  }
  if (process.env.ACCESS_KEY) {
    const plan = VALID_PLANS.has(process.env.ACCESS_KEY_PLAN) ? process.env.ACCESS_KEY_PLAN : 'Growth';
    return { [process.env.ACCESS_KEY.toUpperCase()]: plan };
  }
  // Backward-compatible placeholder keys — replace via env vars in production
  return {
    'REWARM-STARTER-2024': 'Starter',
    'REWARM-GROWTH-2024':  'Growth',
    'REWARM-PRO-2024':     'Pro',
  };
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body || {};
  if (!key) return res.status(400).json({ valid: false, error: 'No key provided' });

  const normalized = String(key).trim().toUpperCase();

  if (normalized === DEMO_KEY) {
    return res.status(200).json({ valid: true, plan: 'Demo' });
  }

  const plan = buildKeyMap()[normalized];
  if (plan) return res.status(200).json({ valid: true, plan });

  return res.status(200).json({ valid: false });
}
