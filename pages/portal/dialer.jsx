import { useState, useEffect, useCallback } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    desc:  'The dialer is running and will call leads automatically.',
    dot:   'bg-emerald-500',
    ring:  'bg-emerald-50 dark:bg-emerald-900/20',
    text:  'text-emerald-700 dark:text-emerald-400',
  },
  paused_by_client: {
    label: 'Paused by you',
    desc:  "You paused the dialer. Resume whenever you're ready.",
    dot:   'bg-amber-500',
    ring:  'bg-amber-50 dark:bg-amber-900/20',
    text:  'text-amber-700 dark:text-amber-400',
  },
  paused_by_admin: {
    label: 'Paused by admin',
    desc:  'An administrator has paused the dialer.',
    dot:   'bg-red-500',
    ring:  'bg-red-50 dark:bg-red-900/20',
    text:  'text-red-700 dark:text-red-400',
  },
  paused_by_limit: {
    label: 'Plan limit reached',
    desc:  'Your monthly lead cap has been reached.',
    dot:   'bg-red-500',
    ring:  'bg-red-50 dark:bg-red-900/20',
    text:  'text-red-700 dark:text-red-400',
  },
  paused_no_leads: {
    label: 'No uncalled leads',
    desc:  'All leads in your sheet have been called.',
    dot:   'bg-stone-400',
    ring:  'bg-stone-100 dark:bg-stone-800',
    text:  'text-stone-600 dark:text-stone-400',
  },
};

const RESUME_BLOCKED_MESSAGES = {
  paused_by_admin: 'This pause was set by an administrator. Contact support to resume.',
  paused_by_limit: 'Monthly lead cap reached. Contact support or upgrade your plan to continue.',
  paused_no_leads: 'No uncalled leads in your Sheet. Add new leads to continue.',
};

const WARN_BAR = {
  at_limit:   'bg-red-500',
  warning_80: 'bg-orange-500',
  warning_50: 'bg-amber-500',
};

export default function DialerControl() {
  const [dialerState, setDialerState] = useState(null);
  const [plan, setPlan]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dr, pr] = await Promise.all([
        fetch('/api/dialer-status'),
        fetch('/api/plan'),
      ]);
      const d = await dr.json();
      const p = await pr.json();
      if (!dr.ok) throw new Error(d.error || 'Failed to load dialer status');
      setDialerState(d);
      if (p.plan) setPlan(p.plan);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pause = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/dialer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', reason: 'client' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Pause failed');
      setDialerState(d);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const resume = async () => {
    if (!dialerState?.resume_allowed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/dialer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Resume failed');
      setDialerState(d);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const cfg      = STATUS_CONFIG[dialerState?.status] || STATUS_CONFIG.paused_by_client;
  const isActive = dialerState?.status === 'active';
  const blockMsg = RESUME_BLOCKED_MESSAGES[dialerState?.status];
  const warnBar  = WARN_BAR[plan?.warning_level] || 'bg-emerald-500';

  if (loading) {
    return (
      <PortalLayout title="Dialer Control">
        <div className="max-w-2xl mx-auto py-24 text-center text-sm text-stone-400">Loading…</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Dialer Control">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">Dialer Control</h1>
            <p className="text-xs text-stone-400 mt-0.5">Manage your AI calling agent</p>
          </div>
          <button
            onClick={load}
            disabled={busy}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Status card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.ring}`}>
              <span className={`w-3 h-3 rounded-full ${cfg.dot} ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-semibold tracking-tight ${cfg.text}`}>{cfg.label}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{cfg.desc}</p>
              {dialerState?.raw && (
                <p className="mt-2 text-[10px] font-mono text-stone-400 dark:text-stone-600">{dialerState.raw}</p>
              )}
            </div>
          </div>

          {/* Resume blocked message */}
          {blockMsg && (
            <div className="mt-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400">
              {blockMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex gap-3">
            {isActive ? (
              <button
                onClick={pause}
                disabled={busy}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Pausing…' : 'Pause Dialer'}
              </button>
            ) : (
              <>
                <button
                  onClick={resume}
                  disabled={busy || !dialerState?.resume_allowed}
                  title={!dialerState?.resume_allowed ? 'Resume not available in current state' : undefined}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? 'Resuming…' : 'Resume Dialer'}
                </button>
                <button
                  onClick={pause}
                  disabled={busy}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-50 transition-colors"
                >
                  {busy ? '…' : 'Re-pause'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Plan usage */}
        {plan && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">{plan.plan_name} Plan — Usage</h2>
              {plan.warning_level === 'at_limit' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">LIMIT REACHED</span>
              )}
              {plan.warning_level === 'warning_80' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">80% USED</span>
              )}
              {plan.warning_level === 'warning_50' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">50% USED</span>
              )}
            </div>

            <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${warnBar}`}
                style={{ width: `${plan.usage_percent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{plan.leads_added_this_cycle}</p>
                <p className="text-xs text-stone-400 mt-0.5">leads added</p>
              </div>
              <div>
                <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{plan.monthly_lead_cap}</p>
                <p className="text-xs text-stone-400 mt-0.5">monthly cap</p>
              </div>
              <div>
                <p className={`text-xl font-bold ${plan.at_limit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {plan.remaining_leads}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">remaining</p>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              Billing cycle: {plan.billing_cycle_start} → {plan.billing_cycle_end}
            </p>

            {plan.usage_method === 'total_rows' && (
              <p className="text-[10px] text-stone-400 italic">
                No <code>date_added</code> column detected — usage shown as total row count
              </p>
            )}
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
