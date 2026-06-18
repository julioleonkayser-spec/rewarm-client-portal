export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.DIALER_PIN;
  if (!expected) {
    return res.status(500).json({ error: 'DIALER_PIN not configured' });
  }

  const pin = (req.body && req.body.pin) || '';
  if (String(pin) !== String(expected)) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  return res.status(200).json({ ok: true });
}
