import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const UNLOCK_KEY = 'dialer_unlocked';

export default function DialerControl() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [checking, setChecking] = useState(false);

  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Restore unlocked state for the rest of the browser session.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(UNLOCK_KEY) === '1') {
      setUnlocked(true);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dialer-status');
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to load');
      setStatus(j.status);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { if (unlocked) load(); }, [unlocked, load]);

  const submitPin = async (e) => {
    e.preventDefault();
    setChecking(true);
    setPinError(null);
    try {
      const res = await fetch('/api/dialer-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        setPinError('Invalid PIN');
        return;
      }
      sessionStorage.setItem(UNLOCK_KEY, '1');
      setUnlocked(true);
      setPin('');
    } catch {
      setPinError('Could not verify PIN. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const toggle = async (action) => {
    setBusy(true);
    try {
      const res = await fetch('/api/dialer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setStatus(j.status);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const paused = status === 'PAUSED';
  const loading = status === null;

  return (
    <>
      <Head>
        <title>Dialer Control</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0f172a' }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Lead Reactivation AI</p>
          <h1 className="text-2xl font-black mb-6" style={{ color: '#1F3A70' }}>Dialer Control</h1>

          {!unlocked ? (
            <form onSubmit={submitPin}>
              <p className="text-sm font-semibold text-gray-500 mb-4">Enter PIN to continue</p>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.5em] py-3 mb-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#1F3A70' }}
              />
              <button
                type="submit"
                disabled={checking || pin.length === 0}
                className="w-full py-4 rounded-xl text-white text-lg font-bold transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#1F3A70' }}
              >
                {checking ? 'Checking…' : 'Unlock'}
              </button>
              {pinError && <p className="text-sm text-red-600 mt-4">{pinError}</p>}
            </form>
          ) : loading ? (
            <div className="h-24 flex items-center justify-center text-gray-400">Loading…</div>
          ) : (
            <>
              <div
                className="rounded-xl py-6 mb-6"
                style={{ backgroundColor: paused ? '#FEE2E2' : '#DCFCE7' }}
              >
                <p className="text-sm font-semibold text-gray-500 mb-1">Status</p>
                <p
                  className="text-4xl font-black tracking-tight"
                  style={{ color: paused ? '#DC2626' : '#16A34A' }}
                >
                  {paused ? 'PAUSED' : 'RUNNING'}
                </p>
              </div>

              <button
                onClick={() => toggle(paused ? 'resume' : 'pause')}
                disabled={busy}
                className="w-full py-4 rounded-xl text-white text-lg font-bold transition-colors disabled:opacity-60"
                style={{ backgroundColor: paused ? '#16A34A' : '#DC2626' }}
              >
                {busy ? 'Working…' : paused ? 'RESUME calls' : 'PAUSE calls'}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                {paused
                  ? 'No calls will be placed while paused.'
                  : 'cron-job.org is dialing leads every 5 minutes.'}
              </p>
            </>
          )}

          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>
      </div>
    </>
  );
}
