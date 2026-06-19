import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function PortalLogin() {
  const router = useRouter();
  // mode: 'email' | 'claim' | 'access-key'
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if a valid session already exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem('rewarm_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.token) router.replace('/portal/dashboard');
      }
    } catch {}
  }, []);

  const reset = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSent(false);
    setLoading(false);
  };

  // ── Email login (returning users) ────────────────────────────────────────

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/send-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setError('Could not send magic link. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Account claim (first-time) ────────────────────────────────────────────

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!key.trim()) { setError('Enter your access key.'); return; }
    if (!EMAIL_RE.test(claimEmail.trim())) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), email: claimEmail.trim() }),
      });
      const data = await res.json();
      if (data.sent) {
        setSent(true);
      } else {
        setError(data.error || 'Could not claim account. Check your access key and try again.');
      }
    } catch {
      setError('Could not claim account. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Access key fallback (transition period) ───────────────────────────────

  const handleAccessKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem('rewarm_session', JSON.stringify({
          plan: data.plan, tenantId: data.tenantId, token: data.token,
          issuedAt: data.issuedAt, loggedAt: Date.now(),
        }));
        router.push('/portal/dashboard');
      } else {
        setError('Invalid access key. Check your key and try again.');
        setLoading(false);
      }
    } catch {
      setError('Could not verify key. Check your connection and try again.');
      setLoading(false);
    }
  };

  const sentEmail = mode === 'email' ? email.trim() : claimEmail.trim();

  if (sent) {
    return (
      <div className="min-h-screen flex bg-stone-50">
        <LeftPanel />
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-16">
          <MobileLogo />
          <div className="max-w-sm w-full mx-auto lg:mx-0">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="22 2 11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Check your email</h1>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              We sent a magic link to <span className="font-semibold text-stone-700">{sentEmail}</span>.
              Click it to sign in — the link expires in 15 minutes.
            </p>
            <p className="text-xs text-stone-400 leading-relaxed">
              Didn&apos;t get it? Check your spam folder, or{' '}
              <button
                onClick={() => { setSent(false); setError(''); }}
                className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
              >
                try again
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      <LeftPanel />

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-16">
        <MobileLogo />

        <div className="max-w-sm w-full mx-auto lg:mx-0">

          {/* ── Email login mode ─────────────────────────────────── */}
          {mode === 'email' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Sign in to your portal</h1>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Enter your email and we&apos;ll send you a magic link.
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertIcon />{error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-2 text-center">
                <p className="text-xs text-stone-400">
                  First time here?{' '}
                  <button onClick={() => reset('claim')} className="text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2">
                    Claim your account
                  </button>
                </p>
                <p className="text-xs text-stone-400">
                  Have an access key?{' '}
                  <button onClick={() => reset('access-key')} className="text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2">
                    Sign in with key
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Claim mode ───────────────────────────────────────── */}
          {mode === 'claim' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Claim your account</h1>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Enter your access key and email to set up magic-link login.
                </p>
              </div>

              <form onSubmit={handleClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Access Key
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => { setKey(e.target.value); setError(''); }}
                    placeholder="REWARM-XXXX-XXXX"
                    spellCheck={false}
                    autoFocus
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={(e) => { setClaimEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertIcon />{error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!key.trim() || !claimEmail.trim() || loading}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Claiming…' : 'Claim account'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                <p className="text-xs text-stone-400">
                  Already claimed?{' '}
                  <button onClick={() => reset('email')} className="text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2">
                    Sign in with email
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Access key fallback ──────────────────────────────── */}
          {mode === 'access-key' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Access key sign in</h1>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Enter your access key to sign in directly.
                </p>
              </div>

              <form onSubmit={handleAccessKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Access Key
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => { setKey(e.target.value); setError(''); }}
                    placeholder="REWARM-XXXX-XXXX"
                    spellCheck={false}
                    autoFocus
                    className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                  />
                  {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertIcon />{error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!key.trim() || loading}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying…' : 'Access portal'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                <p className="text-xs text-stone-400">
                  <button onClick={() => reset('email')} className="text-stone-600 hover:text-stone-900 font-medium underline underline-offset-2">
                    ← Back to email sign in
                  </button>
                </p>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-stone-400">
            Powered by <span className="font-semibold text-stone-600">ReWarm</span> · The AI calling system for real estate agents
          </p>
        </div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-5/12 bg-stone-950 flex-col justify-between p-12 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '28px 28px' }}
      />
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-14">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white tracking-tight">RW</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">ReWarm</span>
        </div>

        <blockquote className="text-[2rem] font-bold text-white leading-tight tracking-tight mb-5">
          Every cold lead is a warm conversation waiting.
        </blockquote>
        <p className="text-stone-400 text-base leading-relaxed max-w-xs">
          A working AI voice agent that calls your dormant leads, qualifies them by name and interest, and books appointments — straight from your Google Sheet.
        </p>

        <div className="mt-10 space-y-3">
          {[
            'AI voice agent that calls and qualifies leads',
            'Personalized to each lead from your Google Sheet',
            'Pipeline and results dashboard, updated live',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-sm text-stone-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-stone-800 pt-8">
        <p className="text-xs text-stone-500 leading-relaxed">
          Your results, live from your Google Sheet. No demo data, no delays.
        </p>
      </div>
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="flex items-center gap-3 mb-10 lg:hidden">
      <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
        <span className="text-sm font-bold text-white">RW</span>
      </div>
      <span className="font-bold text-stone-900 text-lg">ReWarm</span>
    </div>
  );
}
