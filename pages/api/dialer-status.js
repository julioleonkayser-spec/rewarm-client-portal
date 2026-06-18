const { getDialerStatus, setDialerStatus } = require('../../lib/sheets');

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ status: await getDialerStatus() });
    }
    if (req.method === 'POST') {
      const action = (req.body && req.body.action) || '';
      if (action !== 'pause' && action !== 'resume') {
        return res.status(400).json({ error: "action must be 'pause' or 'resume'" });
      }
      const status = await setDialerStatus(action === 'pause' ? 'PAUSED' : 'RUNNING');
      return res.status(200).json({ status });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
