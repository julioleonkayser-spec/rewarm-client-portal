import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';

const NAV_ITEMS = [
  { id: 'profile',      label: 'Profile' },
  { id: 'business',     label: 'Business' },
  { id: 'market',       label: 'Market' },
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

function IntegrationsSection({ profile, onSaved }) {
  const [sheetInput, setSheetInput] = useState(profile?.dataSheetId || '');
  const [verifyState, setVerifyState] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saEmail, setSaEmail] = useState('');

  useEffect(() => {
    fetch('/api/sheets/data')
      .then(r => r.json())
      .then(d => { if (d.serviceAccountEmail) setSaEmail(d.serviceAccountEmail); })
      .catch(() => {});
  }, []);

  const verify = async () => {
    setVerifyState('loading');
    try {
      const res = await fetch('/api/sheets/verify', {
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
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSheetId: verifyState?.sheetId || sheetInput }),
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Google Sheets Integration</h2>
        <p className="text-xs text-stone-500 mt-0.5">Connect your leads sheet so the dashboard shows real call data.</p>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Step 1 — Share your sheet</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">Open your Google Sheet → Share → add this email as <strong>Viewer</strong>:</p>
        {saEmail ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 font-mono text-stone-700 dark:text-stone-300 break-all">{saEmail}</code>
            <button onClick={() => navigator.clipboard?.writeText(saEmail)} className="flex-shrink-0 px-3 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-lg transition-colors">Copy</button>
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">Loading…</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Step 2 — Paste your sheet URL or ID</p>
        <input
          type="text" value={sheetInput}
          onChange={e => { setSheetInput(e.target.value); setVerifyState(null); }}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={verify}
          disabled={!sheetInput.trim() || verifyState === 'loading'}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-40 transition-colors"
        >
          {verifyState === 'loading' ? 'Verifying…' : 'Verify Connection'}
        </button>

        {verifyState && verifyState !== 'loading' && (
          <div className={`p-4 rounded-xl border text-sm ${verifyState.ok
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}
          >
            {verifyState.ok
              ? <>✓ Connected — tab: <strong>{verifyState.tab}</strong>, <strong>{verifyState.rowCount}</strong> {verifyState.rowCount === 1 ? 'lead' : 'leads'} found.</>
              : verifyState.error}
          </div>
        )}
      </div>

      {profile?.dataSheetId && (
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400">
          Currently connected: <code className="font-mono text-stone-700 dark:text-stone-300 break-all">{profile.dataSheetId}</code>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={save}
          disabled={!verifyState?.ok || saveStatus === 'saving'}
          className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 ${
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
    name: '', email: '', phone: '', website: '',
    brokerage: '', license: '', specialties: '',
    market: '', priceRange: '', avgDeal: '675000', commissionRate: '2.5',
    dataSheetId: '',
  });

  const reload = () => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => { if (data.profile) setProfileState(p => ({ ...p, ...data.profile })); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const upd = key => val => setProfileState(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) { setError(err.message); setSaveStatus('idle'); }
  };

  if (loading) return <PortalLayout title="Settings"><div className="max-w-3xl mx-auto py-24 text-center text-sm text-stone-400">Loading…</div></PortalLayout>;

  return (
    <PortalLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-6">
          <nav className="hidden sm:flex flex-col gap-0.5 w-44 flex-shrink-0 pt-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  section === item.id ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}>{item.label}</button>
            ))}
          </nav>

          <div className="sm:hidden w-full">
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 mb-5 overflow-x-auto">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSection(item.id)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${section === item.id ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}
                >{item.label}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-5">
              {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">{error}</div>}

              {section === 'profile' && (<>
                <div><h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Profile</h2><p className="text-xs text-stone-500 mt-0.5">Your personal contact information</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" value={profile.name} onChange={upd('name')} placeholder="Your full name" />
                  <Field label="Email" value={profile.email} onChange={upd('email')} type="email" placeholder="your@email.com" />
                  <Field label="Phone" value={profile.phone} onChange={upd('phone')} type="tel" placeholder="(512) 000-0000" />
                  <Field label="Website" value={profile.website} onChange={upd('website')} placeholder="yoursite.com" />
                </div>
                <div className="flex justify-end pt-2"><SaveButton onClick={handleSave} status={saveStatus} /></div>
              </>)}

              {section === 'business' && (<>
                <div><h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Business</h2><p className="text-xs text-stone-500 mt-0.5">Brokerage and license details</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Brokerage" value={profile.brokerage} onChange={upd('brokerage')} placeholder="Your brokerage name" />
                  <Field label="License Number" value={profile.license} onChange={upd('license')} placeholder="TX #0000000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Specialties</label>
                  <input type="text" value={profile.specialties} onChange={e => upd('specialties')(e.target.value)} placeholder="e.g. Single Family, Luxury, First-Time Buyers" className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <p className="mt-1 text-xs text-stone-400">Comma-separated values</p>
                </div>
                <div className="flex justify-end pt-2"><SaveButton onClick={handleSave} status={saveStatus} /></div>
              </>)}

              {section === 'market' && (<>
                <div><h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Market</h2><p className="text-xs text-stone-500 mt-0.5">Territory and deal parameters</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Primary Market" value={profile.market} onChange={upd('market')} placeholder="e.g. Austin, TX" />
                  <Field label="Price Range" value={profile.priceRange} onChange={upd('priceRange')} placeholder="e.g. $400K – $1.2M" />
                  <Field label="Avg Deal Size ($)" value={profile.avgDeal} onChange={upd('avgDeal')} type="number" placeholder="675000" />
                  <Field label="Commission Rate (%)" value={profile.commissionRate} onChange={upd('commissionRate')} type="number" placeholder="2.5" />
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <p className="text-xs text-stone-500 dark:text-stone-400">Estimated commission per deal: <span className="font-semibold text-stone-700 dark:text-stone-300">${Math.round(parseFloat(profile.avgDeal||0)*(parseFloat(profile.commissionRate||0)/100)).toLocaleString()}</span></p>
                </div>
                <div className="flex justify-end pt-2"><SaveButton onClick={handleSave} status={saveStatus} /></div>
              </>)}

              {section === 'integrations' && <IntegrationsSection profile={profile} onSaved={reload} />}

              {section === 'access' && (<>
                <div><h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Access</h2><p className="text-xs text-stone-500 mt-0.5">How you access this portal</p></div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Gumroad auto-provisioning: not connected</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Buyers currently need a key shared manually after purchase.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Demo Access Key</label>
                  <div className="flex gap-2">
                    <input readOnly value="REWARM-DEMO-2024" className="flex-1 px-4 py-3 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 focus:outline-none" />
                    <button onClick={() => navigator.clipboard?.writeText('REWARM-DEMO-2024')} className="px-4 py-3 text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors flex-shrink-0">Copy</button>
                  </div>
                  <p className="mt-1.5 text-xs text-stone-400">Hardcoded demo key — not unique per buyer yet.</p>
                </div>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
