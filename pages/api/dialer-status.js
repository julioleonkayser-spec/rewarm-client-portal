const { getDialerState, setDialerStatus } = require('../../lib/sheets');

const PAUSE_REASON_MAP = {
  client:   'PAUSED_BY_CLIENT',
  admin:    'PAUSED_BY_ADMIN',
  limit:    'PAUSED_BY_LIMIT',
  no_leads: 'PAUSED_NO_LEADS',
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const state = await getDialerState();
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const { action, reason } = req.body || {};
      if (action !== 'pause' && action !== 'resume') {
        return res.status(400).json({ error: "action must be 'pause' or 'resume'" });
      }

      if (action === 'resume') {
        const current = await getDialerState();
        if (!current.resume_allowed) {
          return res.status(403).json({
            error: 'Resume not allowed in current state',
            status: current.status,
            resume_allowed: false,
          });
        }
        await setDialerStatus('RUNNING');
        return res.status(200).json({ status: 'active', resume_allowed: true, raw: 'RUNNING' });
      }

      // pause — always allowed from client
      const cellValue = PAUSE_REASON_MAP[reason] || 'PAUSED_BY_CLIENT';
      await setDialerStatus(cellValue);
      const state = await getDialerState();
      return res.status(200).json(state);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
