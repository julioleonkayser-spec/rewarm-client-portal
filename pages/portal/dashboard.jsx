import Link from 'next/link';
import {
  leads, weeklyActivity, STAGE_CHART_DATA,
  priorityActions, kpiTrends, weeklyGoal, marketPulse, agentProfile,
} from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const booked = leads.filter(l => l.stage === 'booked').length;
const qualified = leads.filter(l => l.stage === 'qualified').length;
const warm = leads.filter(l => l.stage === 'warm').length;
const contacted = leads.filter(l => ['contacted','warm','qualified','booked'].includes(l.stage)).length;
const total = leads.length;

const commission = 675000 * 0.025;
const pipeline = Math.round(booked * commission + qualified * commission * 0.5 + warm * commission * 0.2);

const KPI_CARDS = [
  { key: 'total',     label: 'Total Leads', value: total,     sub: 'in your database',  accent: 'text-stone-900 dark:text-stone-100', ring: 'bg-stone-100 dark:bg-stone-800' },
  { key: 'contacted', label: 'Contacted',   value: contacted, sub: `${Math.round(contacted/total*100)}% reached`, accent: 'text-sky-600 dark:text-sky-400',    ring: 'bg-sky-50 dark:bg-sky-900/20' },
  { key: 'warm',      label: 'Warm',        value: warm,      sub: 'responded warmly',  accent: 'text-amber-600 dark:text-amber-400',  ring: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'qualified', label: 'Qualified',   value: qualified, sub: 'motivated & able',  accent: 'text-orange-600 dark:text-orange-400', ring: 'bg-orange-50 dark:bg-orange-900/20' },
  { key: 'booked',    label: 'Booked',      value: booked,    sub: 'appointments set',  accent: 'text-emerald-600 dark:text-emerald-400', ring: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{label}</p>
      {payload.map(e => (
        <p key={e.name} style={{ color: e.color || e.fill }} className="text-xs capitalize">
          {e.name}: <span className="font-semibold">{e.value}</span>
        </p>
      ))}
    </div>
  );
};

function ChannelIcon({ channel }) {
  return channel === 'call' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  );
}

export default function Dashboard() {
  const recentBooked = leads.filter(l => l.stage === 'booked');
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const goalPct = Math.round(weeklyGoal.completed / weeklyGoal.target * 100);

  return (
    <PortalLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Greeting */}
        <PageHeader
          eyebrow={dateStr}
          title={`${greeting}, ${agentProfile.name.split(' ')[0]}`}
          subtitle={`You have ${priorityActions.length} high-intent leads worth a touch today and ${booked} appointments on the books. Here's where your attention pays off.`}
        >
          <Link
            href="/portal/crm"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-amber-200/60 dark:shadow-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Start calling
          </Link>
        </PageHeader>

        {/* Today's Focus — the conversion-aware action centerpiece */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Today's Focus</h2>
              <span className="text-xs text-stone-400">· {priorityActions.length} leads ranked by intent</span>
            </div>
            <Link href="/portal/crm" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              View pipeline →
            </Link>
          </div>

          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {priorityActions.map((a) => {
              const initials = a.name.split(' ').map(n => n[0]).join('').slice(0,2);
              return (
                <li key={a.id} className="group flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-stone-600 dark:text-stone-300">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{a.name}</p>
                      {a.stale && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded">Going cold</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{a.reason}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-stone-400">Suggested:</span>
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded-lg">
                      {a.suggestedScript}
                    </span>
                  </div>
                  <Link
                    href="/portal/scripts"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                  >
                    <ChannelIcon channel={a.channel} />
                    {a.channel === 'call' ? 'Call' : 'Text'}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Weekly goal strip */}
          <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Weekly goal · <span className="text-stone-800 dark:text-stone-200 font-semibold">{weeklyGoal.completed}/{weeklyGoal.target}</span> {weeklyGoal.label}
              </p>
              <p className="text-xs font-semibold text-amber-600">{goalPct}%</p>
            </div>
            <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </section>

        {/* KPI cards with momentum */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {KPI_CARDS.map((card) => {
            const trend = kpiTrends[card.key];
            return (
              <div key={card.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center justify-center min-w-10 h-10 px-2.5 rounded-xl ${card.ring}`}>
                    <span className={`text-xl font-bold ${card.accent}`}>{card.value}</span>
                  </div>
                  {trend && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                      {trend.delta}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-0.5">{card.label}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Pipeline value banner */}
        <div className="relative overflow-hidden bg-stone-900 dark:bg-stone-800 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wide mb-1">Estimated Pipeline Value</p>
              <p className="text-4xl font-bold text-white tracking-tight">${pipeline.toLocaleString()}</p>
              <p className="text-sm text-stone-400 mt-1.5">
                {booked} booked + {qualified} qualified · Avg deal $675K · 2.5% commission
              </p>
            </div>
            <div className="flex gap-6 sm:text-right">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{booked}</p>
                <p className="text-xs text-stone-500 mt-0.5">appointments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{warm}</p>
                <p className="text-xs text-stone-500 mt-0.5">warm leads</p>
              </div>
            </div>
          </div>

          {/* Market pulse — local credibility proof points */}
          <div className="relative mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-4">
            {marketPulse.map((m) => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold text-white tracking-tight">{m.value}</p>
                  <svg viewBox="0 0 24 24" fill="none" stroke={m.trend === 'up' ? '#34d399' : '#fbbf24'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    {m.trend === 'up' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                </div>
                <p className="text-[11px] text-stone-400 leading-tight mt-0.5">{m.label}</p>
                <p className="text-[10px] text-stone-500 leading-tight mt-0.5 hidden sm:block">{m.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight">Leads by Stage</h2>
              <p className="text-xs text-stone-400 mt-0.5">{total} total leads across your pipeline</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={STAGE_CHART_DATA} barSize={30} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafaf9' }} />
                <Bar dataKey="count" name="Leads" radius={[6,6,0,0]}>
                  {STAGE_CHART_DATA.map(e => <Cell key={e.name} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight">Weekly Activity</h2>
              <p className="text-xs text-stone-400 mt-0.5">Contacts, replies, and qualifications by week</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyActivity} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="contacted" name="Contacted" stroke="#38bdf8" strokeWidth={2} fill="url(#gc)" dot={false} />
                <Area type="monotone" dataKey="replied"   name="Replied"   stroke="#fbbf24" strokeWidth={2} fill="url(#gr)" dot={false} />
                <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#34d399" strokeWidth={2} fill="url(#gq)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booked + funnel */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight mb-4">Booked Appointments</h2>
            <div className="space-y-3">
              {recentBooked.map(lead => (
                <div key={lead.id} className="flex items-center gap-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{lead.name}</p>
                    <p className="text-xs text-stone-500 truncate">{lead.neighborhood} · {lead.type === 'buyer' ? 'Buyer' : 'Seller'} · {lead.priceRange}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                    Booked
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight mb-5">Conversion Funnel</h2>
            <div className="space-y-3">
              {[
                { label: 'Total',     value: total,     color: 'bg-slate-300',  pct: 100 },
                { label: 'Contacted', value: contacted, color: 'bg-sky-300',    pct: Math.round(contacted/total*100) },
                { label: 'Warm',      value: warm,      color: 'bg-amber-300',  pct: Math.round(warm/total*100) },
                { label: 'Qualified', value: qualified, color: 'bg-orange-300', pct: Math.round(qualified/total*100) },
                { label: 'Booked',    value: booked,    color: 'bg-emerald-400',pct: Math.round(booked/total*100) },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400">{row.label}</span>
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{row.value} <span className="text-stone-400">({row.pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color} transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
