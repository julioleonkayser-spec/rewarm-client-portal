import { useState } from 'react';
import { agentProfile } from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';

const NAV_ITEMS = [
  { id: 'profile',     label: 'Profile' },
  { id: 'business',    label: 'Business' },
  { id: 'market',      label: 'Market' },
  { id: 'integration', label: 'Integration' },
];

function SaveButton({ onClick, saved }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        saved
          ? 'bg-emerald-600 text-white'
          : 'bg-amber-600 hover:bg-amber-700 text-white'
      }`}
    >
      {saved ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Saved
        </>
      ) : 'Save Changes'}
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
  const [saved, setSaved] = useState('');

  const [profile, setProfile] = useState({
    name: agentProfile.name,
    email: agentProfile.email,
    phone: agentProfile.phone,
    website: agentProfile.website,
  });
  const [business, setBusiness] = useState({
    brokerage: agentProfile.brokerage,
    license: agentProfile.license,
    specialties: agentProfile.specialties.join(', '),
  });
  const [market, setMarket] = useState({
    city: agentProfile.market,
    priceRange: agentProfile.priceRange,
    avgDeal: '675000',
    commissionRate: '2.5',
  });
  const [integration, setIntegration] = useState({
    gumroadEnabled: true,
    webhookSecret: 'wh_rewarm_' + Math.random().toString(36).slice(2, 10),
    accessKey: agentProfile.accessKey,
    notifyEmail: agentProfile.email,
  });

  const handleSave = () => {
    setSaved(section);
    setTimeout(() => setSaved(''), 2000);
  };

  const upd = (setter) => (key) => (val) => setter(prev => ({ ...prev, [key]: val }));

  const WEBHOOK_URL = 'https://your-portal-domain.com/api/portal/gumroad-webhook';

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

              {/* Profile */}
              {section === 'profile' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Profile</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Your personal contact information</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-white">{agentProfile.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{profile.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{agentProfile.plan} · Member since {new Date(agentProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" value={profile.name} onChange={upd(setProfile)('name')} placeholder="Your full name" />
                    <Field label="Email" value={profile.email} onChange={upd(setProfile)('email')} type="email" placeholder="your@email.com" />
                    <Field label="Phone" value={profile.phone} onChange={upd(setProfile)('phone')} type="tel" placeholder="(512) 000-0000" />
                    <Field label="Website" value={profile.website} onChange={upd(setProfile)('website')} placeholder="yoursite.com" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved === 'profile'} />
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
                    <Field label="Brokerage" value={business.brokerage} onChange={upd(setBusiness)('brokerage')} placeholder="Your brokerage name" />
                    <Field label="License Number" value={business.license} onChange={upd(setBusiness)('license')} placeholder="TX #0000000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Specialties</label>
                    <input
                      type="text"
                      value={business.specialties}
                      onChange={e => setBusiness(b => ({ ...b, specialties: e.target.value }))}
                      placeholder="e.g. Single Family, Luxury, First-Time Buyers"
                      className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="mt-1 text-xs text-stone-400">Comma-separated values</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved === 'business'} />
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
                    <Field label="Primary Market" value={market.city} onChange={upd(setMarket)('city')} placeholder="e.g. Austin, TX" />
                    <Field label="Price Range" value={market.priceRange} onChange={upd(setMarket)('priceRange')} placeholder="e.g. $400K – $1.2M" />
                    <Field label="Avg Deal Size ($)" value={market.avgDeal} onChange={upd(setMarket)('avgDeal')} type="number" placeholder="675000" />
                    <Field label="Commission Rate (%)" value={market.commissionRate} onChange={upd(setMarket)('commissionRate')} type="number" placeholder="2.5" />
                  </div>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Estimated commission per deal:{' '}
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        ${Math.round(parseFloat(market.avgDeal || 0) * (parseFloat(market.commissionRate || 0) / 100)).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved === 'market'} />
                  </div>
                </>
              )}

              {/* Integration */}
              {section === 'integration' && (
                <>
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Integration</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Gumroad webhook and access key configuration</p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Gumroad Integration Active</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Webhook configured · Auto-provisioning enabled</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.gumroadEnabled}
                        onChange={e => setIntegration(i => ({ ...i, gumroadEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Webhook URL */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={WEBHOOK_URL}
                        className="flex-1 px-4 py-3 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 focus:outline-none select-all"
                      />
                      <button
                        onClick={() => navigator.clipboard?.writeText(WEBHOOK_URL)}
                        className="px-4 py-3 text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-stone-400">
                      Add this URL to your Gumroad product → Edit → Webhook. Gumroad will POST to this endpoint after each purchase.
                    </p>
                  </div>

                  {/* Access key */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Your Access Key</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={integration.accessKey}
                        className="flex-1 px-4 py-3 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 focus:outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard?.writeText(integration.accessKey)}
                        className="px-4 py-3 text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-stone-400">Unique key delivered to buyers via Gumroad receipt email.</p>
                  </div>

                  <Field
                    label="Notification Email"
                    value={integration.notifyEmail}
                    onChange={upd(setIntegration)('notifyEmail')}
                    type="email"
                    placeholder="your@email.com"
                  />

                  {/* Implementation notes */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">Gumroad Webhook Setup</p>
                    <ol className="text-xs text-stone-500 dark:text-stone-400 space-y-1.5 list-decimal list-inside">
                      <li>Go to your Gumroad product → Edit → Webhooks tab</li>
                      <li>Paste the Webhook URL above and save</li>
                      <li>On purchase, Gumroad POSTs buyer data to your endpoint</li>
                      <li>Your endpoint generates a unique access key and emails it to the buyer</li>
                      <li>The buyer enters the key on the login page to access the portal</li>
                    </ol>
                  </div>

                  <div className="flex justify-end pt-2">
                    <SaveButton onClick={handleSave} saved={saved === 'integration'} />
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
