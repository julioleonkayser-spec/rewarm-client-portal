import { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';

const NAV_ITEMS = [
  { id: 'profile',  label: 'Profile' },
  { id: 'business', label: 'Business' },
  { id: 'market',   label: 'Market' },
  { id: 'access',   label: 'Access' },
];

function SaveButton({ onClick, status }) {
  return (
    <button
      onClick={onClick}
      disabled={status === 'saving'}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 ${
        status === 'saved'
          ? 'bg-emerald-600 text-white'
          : 'bg-amber-600 hover:bg-amber-700 text-white'
      }`}
    >
      {status === 'saved' ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Saved
        </>
      ) : status === 'saving' ? 'Saving…' : 'Save Changes'}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
      />
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
  });

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfileState(p => ({ ...p, ...data.profile }));
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const upd = (key) => (val) => setProfileState(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err.message);
      setSaveStatus('idle');
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Settings">
        <div className="max-w-3xl mx-auto py-24 text-center text-sm text-stone-400">Loading your settings…</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Settings">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-6">

          {/* Sidebar nav */}
          <nav className="hidden sm:flex flex-col gap-0.5 w-44 flex-shrink-0 pt-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  section === item.id
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile nav */}
          <div className="sm:hidden w-full">
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 mb-5 overflow-x-auto">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    section === item.id
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-5">

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Profile */}
              {section === 'profile' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Profile</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Your personal contact information</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" value={profile.name} onChange={upd('name')} placeholder="Your full name" />
                    <Field label="Email" value={profile.email} onChange={upd('email')} type="email" placeholder="your@email.com" />
                    <Field label="Phone" value={profile.phone} onChange={upd('phone')} type="tel" placeholder="(512) 000-0000" />
                    <Field label="Website" value={profile.website} onChange={upd('website')} placeholder="yoursite.com" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} status={saveStatus} />
                  </div>
                </>
              )}

              {/* Business */}
              {section === 'business' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Business</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Brokerage and license details</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Brokerage" value={profile.brokerage} onChange={upd('brokerage')} placeholder="Your brokerage name" />
                    <Field label="License Number" value={profile.license} onChange={upd('license')} placeholder="TX #0000000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Specialties</label>
                    <input
                      type="text"
                      value={profile.specialties}
                      onChange={e => upd('specialties')(e.target.value)}
                      placeholder="e.g. Single Family, Luxury, First-Time Buyers"
                      className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="mt-1 text-xs text-stone-400">Comma-separated values</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} status={saveStatus} />
                  </div>
                </>
              )}

              {/* Market */}
              {section === 'market' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Market</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Territory and deal parameters for your pipeline tracking</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Primary Market" value={profile.market} onChange={upd('market')} placeholder="e.g. Austin, TX" />
                    <Field label="Price Range" value={profile.priceRange} onChange={upd('priceRange')} placeholder="e.g. $400K – $1.2M" />
                    <Field label="Avg Deal Size ($)" value={profile.avgDeal} onChange={upd('avgDeal')} type="number" placeholder="675000" />
                    <Field label="Commission Rate (%)" value={profile.commissionRate} onChange={upd('commissionRate')} type="number" placeholder="2.5" />
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Estimated commission per deal:{' '}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        ${Math.round(parseFloat(profile.avgDeal || 0) * (parseFloat(profile.commissionRate || 0) / 100)).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} status={saveStatus} />
                  </div>
                </>
              )}

              {/* Access */}
              {section === 'access' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Access</h2>
                    <p className="text-xs text-stone-500 mt-0.5">How you and your buyers get into this portal</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Gumroad auto-provisioning: not connected</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Access keys aren't generated automatically yet. Buyers currently need a key shared manually after purchase.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Demo Access Key</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value="REWARM-DEMO-2024"
                        className="flex-1 px-4 py-3 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 focus:outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard?.writeText('REWARM-DEMO-2024')}
                        className="px-4 py-3 text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-stone-400">This key is hardcoded for demo access only — not unique per buyer yet.</p>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
