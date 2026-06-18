import { useState } from 'react';
import { useRouter } from 'next/router';
import { agentProfile, ONBOARDING_CHECKLIST, leads } from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';

const STEPS = [
  { id: 1, title: 'Welcome',      subtitle: 'Your reactivation portal is ready', time: '1 min' },
  { id: 2, title: 'Import Leads', subtitle: 'Bring your cold database in',        time: '5 min' },
  { id: 3, title: 'Market Setup', subtitle: 'Tell us about your territory',       time: '2 min' },
  { id: 4, title: "You're ready", subtitle: 'Time to start reactivating',         time: 'Go' },
];

const DEMO_CSV = `name,phone,type,neighborhood,priceRange
Marcus Webb,(512) 441-7823,buyer,Round Rock,$600K-$800K
Jennifer Rodriguez,(512) 334-9021,seller,Cedar Park,$480K-$550K
David Kim,(512) 709-4512,buyer,Tarrytown,$900K-$1.2M`;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState(ONBOARDING_CHECKLIST);
  const [pastedLeads, setPastedLeads] = useState('');
  const [market, setMarket] = useState({
    city: agentProfile.market,
    priceRange: agentProfile.priceRange,
    leadTypes: ['buyers', 'sellers'],
    specialties: agentProfile.specialties.join(', '),
  });
  const [saved, setSaved] = useState(false);

  const toggleCheck = (id) => {
    setChecklist(list => list.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const progress = Math.round((step - 1) / (STEPS.length - 1) * 100);

  const handleSaveMarket = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PortalLayout title="Setup Guide">
      <div className="max-w-2xl mx-auto">

        {/* Outcome promise */}
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            About 8 minutes
          </span>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            From a cold database to your first booked appointment — in four guided steps.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
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

        {/* Step content */}
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
                  Welcome, {agentProfile.name.split(' ')[0]}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                  Your ReWarm portal is live. Here's what you'll set up to run your first reactivation campaign.
                </p>

                <div className="space-y-3">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.done ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 dark:border-stone-600'
                      }`}>
                        {item.done && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${item.done ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                    <span className="font-semibold">Tip:</span> Agents who complete all 5 steps in their first week see 3× more appointments in the first 30 days.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Import leads */}
            {step === 2 && (
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-1">Import your leads</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  You currently have <span className="font-semibold text-stone-700 dark:text-stone-300">{leads.length} demo leads</span> loaded. Paste your own CSV data below to import real leads.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">Paste CSV data</label>
                    <textarea
                      rows={6}
                      value={pastedLeads}
                      onChange={e => setPastedLeads(e.target.value)}
                      placeholder={DEMO_CSV}
                      className="w-full px-4 py-3 text-sm font-mono border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                    <p className="mt-1.5 text-xs text-stone-400">Required columns: name, phone, type (buyer/seller), neighborhood, priceRange</p>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                    <span className="text-xs text-stone-400 font-medium">or connect</span>
                    <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Follow Up Boss', status: 'Available via Zapier', icon: '↗' },
                      { name: 'KvCORE', status: 'Available via Zapier', icon: '↗' },
                      { name: 'Sierra Interactive', status: 'Available via Zapier', icon: '↗' },
                      { name: 'Custom CRM', status: 'CSV export supported', icon: '↗' },
                    ].map(crm => (
                      <div key={crm.name} className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
                        <div>
                          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{crm.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{crm.status}</p>
                        </div>
                        <span className="text-stone-400 text-sm">{crm.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Market setup */}
            {step === 3 && (
              <div>
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-1">Set up your market</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  These details help personalize your scripts and pipeline tracking.
                </p>

                <div className="space-y-4">
                  {[
                    { label: 'Primary Market (City/Area)', key: 'city', placeholder: 'e.g. Austin, TX' },
                    { label: 'Price Range', key: 'priceRange', placeholder: 'e.g. $400K – $1.2M' },
                    { label: 'Specialties', key: 'specialties', placeholder: 'e.g. Single Family, Luxury, First-Time Buyers' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={market[key]}
                        onChange={e => setMarket(m => ({ ...m, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">Lead Types</label>
                    <div className="flex gap-3">
                      {['buyers', 'sellers', 'both'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={market.leadTypes.includes(type)}
                            onChange={() => setMarket(m => ({
                              ...m,
                              leadTypes: m.leadTypes.includes(type)
                                ? m.leadTypes.filter(t => t !== type)
                                : [...m.leadTypes, type]
                            }))}
                            className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-stone-700 dark:text-stone-300 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMarket}
                    className={`w-full py-3 text-sm font-semibold rounded-xl transition-all ${
                      saved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {saved ? '✓ Market saved' : 'Save market info'}
                  </button>
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
                  You're ready to go, {agentProfile.name.split(' ')[0]}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                  {leads.length} leads loaded · {leads.filter(l => l.stage === 'booked').length} appointments already booked in demo · 18 scripts ready to use
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Open Scripts', desc: 'Start with the Market Shift opener', href: '/portal/scripts', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
                    { label: 'View Pipeline', desc: 'See all 48 leads by stage', href: '/portal/crm', color: 'bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white' },
                    { label: 'See Dashboard', desc: 'Review your metrics', href: '/portal/dashboard', color: 'bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700' },
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

                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Need help? All SOPs and guides are in <a href="/portal/assets" className="text-amber-600 hover:underline">Assets</a>.
                </p>
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
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {step === 3 ? 'Finish setup →' : 'Continue →'}
              </button>
            </div>
          )}
        </div>

      </div>
    </PortalLayout>
  );
}
