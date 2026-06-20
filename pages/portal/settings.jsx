import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import { sessionFetch } from '../../lib/portal/fetcher';

const NAV_ITEMS = [
  { id: 'profile',      label: 'Profile' },
  { id: 'plan',         label: 'Plan' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'access',       label: 'Access' },
];

function SaveButton({ onClick, status }) {
  return (
    <button
      onClick={onClick}
      disabled={status === 'saving'}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 ${
        status === 'saved' ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
      }`}
    >
      {status === 'saved' ? 'Saved ✓' : status === 'saving' ? 'Saving…' : 'Save Changes'}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const MARKET_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial',  label: 'Commercial' },
  { value: 'mixed',       label: 'Mixed' },
  { value: 'luxury',      label: 'Luxury' },
];

const PLAN_OPTIONS = [
  { value: 'Demo',    label: 'Demo — 150 leads/mo' },
  { value: 'Starter', label: 'Starter — 150 leads/mo ($49.99)' },
  { value: 'Growth',  label: 'Growth — 350 leads/mo ($100)' },
  { value: 'Pro',     label: 'Pro — 750 leads/mo ($262.49)' },
];

const WARN_COLORS = {
  at_limit:   { bar: 'bg-red-500',    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',       msg: 'text-red-600 dark:text-red-400' },
  warning_80: { bar: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', msg: 'text-orange-600 dark:text-orange-400' },
  warning_50: { bar: 'bg-amber-500',  badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',   msg: 'text-amber-600 dark:text-amber-400' },
};

function PlanSection({ profile, onSaved }) {
  const [cycleStart, setCycleStart] = useState(profile?.billing_cycle_start || '');
  const [usage, setUsage]           = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    sessionFetch('/api/plan')
      .then(r => r.json())
      .then(d => { if (d.plan) setUsage(d.plan); })
      .catch(() => {})
      .finally(() => setLoadingUsage(false));
  }, []);

  const save = async () => {
    setSaveStatus('saving');
    try {
      const res = await sessionFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_cycle_start: cycleStart }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      onSaved?.();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch { setSaveStatus('idle'); }
  };

  const wl = usage?.warning_level;
  const wc = WARN_COLORS[wl];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Plan</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Your active plan and lead usage for the current billing cycle.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Plan</label>
          <div className="px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {profile?.plan_name || '—'}
          </div>
          <p className="mt-1 text-xs text-stone-400">To switch plans, contact support.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Billing Cycle Start</label>
          <input
            type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1 text-xs text-stone-400">Defaults to the 1st of the month if left blank.</p>
        </div>
      </div>

      {loadingUsage ? (
        <div className="rounded-xl border border-stone-100 dark:border-stone-800 p-4 text-xs text-stone-400">Loading usage…</div>
      ) : usage ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Usage this billing cycle</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                usage.usage_method === 'date_added'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {usage.usage_method === 'date_added' ? 'Exact' : 'Approximate'}
              </span>
            </div>
            {wc && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${wc.badge}`}>
                {wl === 'at_limit' ? 'LIMIT REACHED' : wl === 'warning_80' ? '80% USED' : '50% USED'}
              </span>
            )}
          </div>

          <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${wc?.bar || 'bg-emerald-500'}`}
              style={{ width: `${usage.usage_percent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-stone-500">
            <span>{usage.leads_added_this_cycle} leads added</span>
            <span>{usage.remaining_leads} of {usage.monthly_lead_cap} remaining</span>
          </div>

          <p className="text-xs text-stone-400">
            Billing cycle: {usage.billing_cycle_start} – {usage.billing_cycle_end}
          </p>

          {wl === 'at_limit' && (
            <p className={`text-xs font-medium ${wc.msg}`}>
              Monthly limit reached. Contact support to continue or upgrade your plan.
            </p>
          )}

          {usage.usage_method === 'total_rows' && (
            <p className="text-[10px] text-stone-400">
              Showing total sheet rows — once the dialer runs, usage switches to exact cycle-based counting.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex justify-end pt-1">
        <SaveButton onClick={save} status={saveStatus} />
      </div>
    </div>
  );
}

function IntegrationsSection({ profile, onSaved }) {
  const [sheetInput, setSheetInput] = useState(profile?.dataSheetId || '');
  const [verifyState, setVerifyState] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saEmail, setSaEmail] = useState('');
  const [retellAgentId, setRetellAgentId] = useState(profile?.retell_agent_id || '');

  useEffect(() => {
    sessionFetch('/api/sheets/data')
      .then(r => r.json())
      .then(d => { if (d.serviceAccountEmail) setSaEmail(d.serviceAccountEmail); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSheetInput(profile?.dataSheetId || '');
  }, [profile?.dataSheetId]);

  const verify = async () => {
    setVerifyState('loading');
    try {
      const res = await sessionFetch('/api/sheets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetInput }),
      });
      setVerifyState(await res.json());
    } catch (e) {
      setVerifyState({ ok: false, error: e.message });
    }
  };

  const save = async () => {
    setSaveStatus('saving');
    try {
      const res = await sessionFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSheetId: verifyState?.sheetId || sheetInput, retell_agent_id: retellAgentId }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      onSaved?.();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Google Sheets</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Your connected sheet is where the agent reads leads and records every call result. Connect it once.
        </p>
      </div>

      {/* Current connection status */}
      {profile?.dataSheetId && !verifyState && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Sheet connected</p>
            <p className="text-[11px] text-emerald-700/60 dark:text-emerald-400/60 font-mono truncate mt-0.5">{profile.dataSheetId}</p>
          </div>
        </div>
      )}

      {/* Step 1 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Share access with ReWarm</p>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 pl-7 leading-relaxed">
          In Google Sheets, click <strong>Share</strong> and invite this address as a <strong>Viewer</strong>. The agent needs this access to read your leads.
        </p>
        <div className="pl-7">
          {saEmail ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2.5 font-mono text-stone-700 dark:text-stone-300 break-all">{saEmail}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(saEmail)}
                className="flex-shrink-0 px-3 py-2.5 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          ) : (
            <div className="h-10 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Paste your sheet link</p>
        </div>
        <div className="pl-7 space-y-2.5">
          <input
            type="text" value={sheetInput}
            onChange={e => { setSheetInput(e.target.value); setVerifyState(null); }}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
          />
          <button
            onClick={verify}
            disabled={!sheetInput.trim() || verifyState === 'loading'}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-40 transition-colors"
          >
            {verifyState === 'loading' ? 'Checking…' : 'Check Connection'}
          </button>

          {verifyState && verifyState !== 'loading' && (
            <div className="space-y-2">
              <div className={`p-4 rounded-xl border text-sm ${verifyState.ok
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}
              >
                {verifyState.ok
                  ? <><strong>{verifyState.rowCount}</strong> {verifyState.rowCount === 1 ? 'lead' : 'leads'} found in <strong>{verifyState.tab}</strong> — ready to save.</>
                  : (verifyState.error?.toLowerCase().includes('auth') || verifyState.error?.toLowerCase().includes('token')
                      ? 'Sheet not accessible. Double-check that the address above has been added as a Viewer, then try again.'
                      : verifyState.error || 'Could not reach this sheet. Check the URL and try again.')}
              </div>
              {verifyState.ok && verifyState.missingRecommended?.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Optional columns missing: <strong>{verifyState.missingRecommended.join(', ')}</strong>. The agent works without them — adding <code>first_name</code> and <code>last_name</code> personalizes each call.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retell Agent ID */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Retell Agent ID</label>
        <input
          type="text"
          value={retellAgentId}
          onChange={e => setRetellAgentId(e.target.value)}
          placeholder="agent_xxxxxxxxxxxxxxxx"
          className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
        />
        <p className="text-xs text-stone-400">Your cloned Retell agent ID. Leave blank to use the default shared agent.</p>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={save}
          disabled={(!verifyState?.ok && !retellAgentId.trim()) || saveStatus === 'saving'}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 ${
            saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving…' : 'Save Connection'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [section, setSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [profile, setProfileState] = useState({
    name: '', email: '', brokerage: '',
    language: 'en', market_type: 'residential', timezone: '',
    plan_name: '', billing_cycle_start: '', dataSheetId: '',
  });

  const reload = () => {
    sessionFetch('/api/profile')
      .then(res => res.json())
      .then(data => { if (data.profile) setProfileState(p => ({ ...p, ...data.profile })); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const upd = key => val => setProfileState(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await sessionFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          brokerage: profile.brokerage,
          language: profile.language,
          market_type: profile.market_type,
          timezone: profile.timezone,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) { setError(err.message); setSaveStatus('idle'); }
  };

  if (loading) return (
    <PortalLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-6">
          <div className="hidden sm:flex flex-col gap-1 w-44 flex-shrink-0 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
          <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4">
            <div className="h-5 w-20 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
            <div className="h-3 w-48 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-6">
          <nav className="hidden sm:flex flex-col gap-0.5 w-44 flex-shrink-0 pt-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  section === item.id
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}>{item.label}</button>
            ))}
          </nav>

          <div className="sm:hidden w-full">
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 mb-5 overflow-x-auto">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSection(item.id)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    section === item.id
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >{item.label}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">{error}</div>
              )}

              {section === 'profile' && (<>
                <div>
                  <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Profile</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Your name and details are used by the agent on every call.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name"     value={profile.name}       onChange={upd('name')}        placeholder="Your full name" />
                  <Field label="Company"        value={profile.brokerage}  onChange={upd('brokerage')}   placeholder="Your brokerage or company" />
                  <SelectField label="Language"    value={profile.language || 'en'}           onChange={upd('language')}    options={LANGUAGE_OPTIONS} />
                  <SelectField label="Market Type" value={profile.market_type || 'residential'} onChange={upd('market_type')} options={MARKET_TYPE_OPTIONS} />
                  <Field label="Timezone"       value={profile.timezone}   onChange={upd('timezone')}    placeholder="e.g. America/Chicago" />
                  <Field label="Contact Email"  value={profile.email}      onChange={upd('email')}       type="email" placeholder="your@email.com" />
                </div>
                <div className="flex justify-end pt-2"><SaveButton onClick={handleSave} status={saveStatus} /></div>
              </>)}

              {section === 'plan'         && <PlanSection         profile={profile} onSaved={reload} />}
              {section === 'integrations' && <IntegrationsSection profile={profile} onSaved={reload} />}

              {section === 'access' && (<>
                <div>
                  <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Access</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">How you access this portal.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Passwordless sign-in via email link</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">No password required. Contact support to update your access email.</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    Your access key was included in your welcome email. Contact support if you need it resent.
                  </p>
                </div>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
