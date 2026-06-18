import { useState } from 'react';
import { useRouter } from 'next/router';

export default function PortalLogin() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSession = (plan = 'Demo') => {
    localStorage.setItem('rewarm_session', JSON.stringify({ plan, loggedAt: Date.now() }));
    if (plan !== 'Demo') {
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: plan }),
      }).catch(() => {});
    }
    router.push('/portal/dashboard');
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => startSession('Demo'), 700);
  };

  const handleKeySubmit = async (e) => {
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
        startSession(data.plan);
      } else {
        setError('Invalid access key. Use the demo button above to explore.');
        setLoading(false);
      }
    } catch {
      setError('Could not verify key. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-50">

      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-16">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white">RW</span>
          </div>
          <span className="font-bold text-stone-900 text-lg">ReWarm</span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
              Client portal access
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed">
              Purchased via Gumroad? Enter your access key below. Or try the demo portal — no account needed.
            </p>
          </div>

          {/* Demo CTA */}
          <button
            onClick={handleDemoAccess}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2 shadow-sm shadow-amber-200"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )}
            {loading ? 'Opening portal…' : 'Enter Demo Portal'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">or enter access key</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-3">
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
                className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!key.trim() || loading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Access Portal
            </button>
          </form>

          {/* Gumroad integration callout */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-0.5">Gumroad buyers</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your access key was sent in your Gumroad receipt email.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-stone-400">
            Powered by <span className="font-semibold text-stone-600">ReWarm</span> · The AI calling system for real estate agents
          </p>
        </div>
      </div>
    </div>
  );
}
