import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';

const STEPS = [
  { id: 1, title: 'Welcome',       subtitle: 'Your portal is live',       time: '1 min' },
  { id: 2, title: 'Connect Sheet', subtitle: 'Link your Google Sheet',     time: '3 min' },
  { id: 3, title: 'Import Leads',  subtitle: 'Add leads to your sheet',    time: '5 min' },
  { id: 4, title: "You're ready",  subtitle: 'Start reactivating',         time: 'Go' },
];

const REQUIRED_COLUMNS = ['phone_number', 'call_status'];
const RECOMMENDED_COLUMNS = [
  { name: 'first_name',        note: 'Personalizes call scripts' },
  { name: 'last_name',         note: 'Personalizes call scripts' },
  { name: 'lead_source',       note: 'Context for the agent' },
  { name: 'original_interest', note: 'What the lead originally inquired about' },
  { name: 'date_added',        note: 'Auto-set after first call — enables accurate usage tracking' },
];

export default function Onboarding() {
  const [step, setStep]               = useState(1);
  const [firstName, setFirstName] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (!d.profile) return;
        setFirstName(d.profile.name?.split(' ')[0] || '');
        if (d.profile.dataSheetId) setConnected(true);
      })
      .catch(() => {});
  }, []);

  const progress = Math.round((step - 1) / (STEPS.length - 1) * 100);

  useEffect(() => {
    if (step === 4) {
      localStorage.removeItem('rewarm_first_run');
      localStorage.setItem('rewarm_onboarded', '1');
    }
  }, [step]);

  return (
    <PortalLayout title="Getting Started">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            About 9 minutes
          </span>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Connect your Google Sheet and add your first leads — that's it.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  step === s.id ? 'text-amber-600' : step > s.id ? 'text-stone-500' : 'text-stone-300 dark:text-stone-600'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.id
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : step === s.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                }`}>
                  {step > s.id ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : s.id}
                </span>
                <span className="hidden sm:block">{s.title}</span>
              </button>
            ))}
          </div>
          <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8">

            {/* Step 1: Welcome */}
            {step === 1 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-1">
                  {firstName ? `Welcome, ${firstName}` : 'Welcome to ReWarm'}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                  Your AI voice agent calls leads from your Google Sheet — by name, interest, and source — and books appointments for you. Setup takes about 9 minutes.
                </p>

                <div className="space-y-2.5">
                  {[
                    { num: '01', title: 'Connect your Google Sheet', desc: 'The agent reads leads and writes results directly — your sheet is the single source of truth.' },
                    { num: '02', title: 'Add your leads', desc: "Paste your cold database into the sheet. Any contact that hasn't heard from you in months is a candidate." },
                    { num: '03', title: 'Watch the pipeline fill', desc: 'Results appear after each call — status, quality score, and booking confirmation in real time.' },
                  ].map(item => (
                    <div key={item.num} className="flex items-start gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                      <span className="text-xs font-bold text-stone-300 dark:text-stone-600 tabular-nums mt-0.5 flex-shrink-0 w-5">{item.num}</span>
                      <div>
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{item.title}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Get started →
                </button>
              </div>
            )}

            {/* Step 2: Connect Sheet */}
            {step === 2 && (
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-1">Connect your sheet</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Link your Google Sheet so the agent can read leads and write results automatically.
                </p>

                {connected ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Sheet connected ✓</p>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-3">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      To connect your Google Sheet, go to <strong>Settings → Integrations</strong>. Once connected there, ReWarm will use that sheet automatically.
                    </p>
                    <a
                      href="/portal/settings"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                    >
                      Go to Settings →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Import leads */}
            {step === 3 && (
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-1">Add your leads</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Paste your leads directly into your Google Sheet. The dashboard picks up new rows on the next refresh.
                </p>

                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Required columns</p>
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_COLUMNS.map(col => (
                        <code key={col} className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-lg px-2 py-1.5 text-stone-600 dark:text-stone-400 font-mono">
                          {col}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Recommended columns</p>
                    <div className="space-y-2">
                      {RECOMMENDED_COLUMNS.map(({ name, note }) => (
                        <div key={name} className="flex items-start gap-3">
                          <code className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-lg px-2 py-1.5 text-stone-600 dark:text-stone-400 font-mono whitespace-nowrap">{name}</code>
                          <span className="text-xs text-stone-400 mt-1.5">{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      <strong>Usage note:</strong> Each row in your sheet counts as one lead toward your monthly cap. The <code>date_added</code> column is written automatically after each call for accurate per-cycle tracking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-2">
                  {firstName ? `You're all set, ${firstName}` : "You're all set"}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                  Your agent calls leads straight from your Google Sheet, personalized to each one.
                </p>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'View Pipeline',    desc: 'See leads and call status',                                              href: '/portal/crm',       color: 'bg-amber-600 hover:bg-amber-700 text-white' },
                    { label: 'See Dashboard',    desc: 'Review call results live',                                               href: '/portal/dashboard',  color: 'bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white' },
                    { label: 'Start Your Agent', desc: 'Turn on your AI calling agent and start reaching leads automatically.',  href: '/portal/dialer',     color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  ].map(action => (
                    <a
                      key={action.label}
                      href={action.href}
                      className={`block px-4 py-4 rounded-xl text-center transition-colors ${action.color}`}
                    >
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs mt-1 opacity-70">{action.desc}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation footer */}
          {step < 4 && (
            <div className="px-6 sm:px-8 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="text-sm font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Back
              </button>
              <span className="text-xs text-stone-400">Step {step} of {STEPS.length} · {STEPS[step - 1].time}</span>
              <button
                onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                disabled={false}
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:cursor-not-allowed transition-colors"
              >
                {step === 3 ? 'Finish →' : 'Continue →'}
              </button>
            </div>
          )}
        </div>

      </div>
    </PortalLayout>
  );
}
