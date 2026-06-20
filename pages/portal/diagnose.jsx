import { useState, useCallback } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';
import { sessionFetch } from '../../lib/portal/fetcher';

function CheckIcon({ ok }) {
  if (ok) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="w-5 h-5 text-emerald-500 flex-shrink-0">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5 text-red-500 flex-shrink-0">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckRow({ check }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="mt-0.5">
        <CheckIcon ok={check.ok} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 leading-tight">{check.label}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{check.detail}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
        check.ok
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      }`}>
        {check.ok ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

export default function Diagnose() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await sessionFetch('/api/diagnose');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }, []);

  const allPassed = result && result.passed === result.total;

  return (
    <PortalLayout title="Diagnostics">
      <div className="max-w-2xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Self-serve"
          title="Diagnostics"
          subtitle="Run a health check to verify your session, sheet connection, and dialer configuration."
        />

        {!result && !running && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                className="w-6 h-6 text-stone-500">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Ready to run 7 checks</p>
            <p className="text-xs text-stone-400 mb-6">Session · profile · sheet access · columns · dialer · leads · Retell API</p>
            <button
              onClick={run}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
            >
              Run Diagnostics
            </button>
          </div>
        )}

        {running && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-stone-500">Running checks…</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">Request failed:</span> {error}
          </div>
        )}

        {result && (
          <>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Check results</h2>
                <button
                  onClick={run}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-3 h-3">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                  Run Again
                </button>
              </div>
              <div className="px-5">
                {result.checks.map((check, i) => (
                  <CheckRow key={i} check={check} />
                ))}
              </div>
            </div>

            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
              allPassed
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40'
                : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40'
            }`}>
              {allPassed ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-5 h-5 text-emerald-600 flex-shrink-0">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-5 h-5 text-amber-600 flex-shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
              <p className={`text-sm font-semibold ${
                allPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}>
                {result.passed}/{result.total} checks passed
              </p>
            </div>
          </>
        )}

      </div>
    </PortalLayout>
  );
}
