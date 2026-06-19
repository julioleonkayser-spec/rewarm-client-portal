import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // verifying | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const { t } = router.query;

    if (!t) {
      setStatus('error');
      setErrorMsg('Sign-in link is missing or incomplete.');
      return;
    }

    fetch('/api/auth/verify-magic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          localStorage.setItem(
            'rewarm_session',
            JSON.stringify({
              plan: data.plan,
              tenantId: data.tenantId,
              token: data.token,
              issuedAt: data.issuedAt,
              loggedAt: Date.now(),
            })
          );
          const isFirstRun = localStorage.getItem('rewarm_first_run') === '1';
          localStorage.removeItem('rewarm_first_run');
          router.replace(isFirstRun ? '/portal/onboarding' : '/portal/dashboard');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'This sign-in link has expired or is invalid.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Could not verify your sign-in link. Check your connection and try again.');
      });
  }, [router.isReady, router.query.t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white">RW</span>
          </div>
          <span className="font-semibold text-stone-900 text-lg tracking-tight">ReWarm</span>
        </div>

        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 mx-auto mb-5 rounded-full border-2 border-stone-200 border-t-amber-500 animate-spin" />
            <p className="text-sm font-medium text-stone-700">Signing you in…</p>
            <p className="mt-1 text-xs text-stone-400">Just a moment</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-800 mb-1.5">Link expired or invalid</p>
            <p className="text-xs text-stone-500 leading-relaxed mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/portal')}
              className="inline-block px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
