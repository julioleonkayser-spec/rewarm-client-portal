import { useState, useEffect } from 'react';
import Link from 'next/link';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const STATUS_COLOR = { HOT: '#10B981', WARM: '#FBBF24', COLD: '#9CA3AF', SKIP: '#D1D5DB' };

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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/sheets/data')
      .then(res => res.json())
      .then(d => { if (mounted) { setData(d); setLoading(false); } })
      .catch(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <PortalLayout title="Dashboard">
        <div className="max-w-6xl mx-auto py-24 text-center text-sm text-stone-400">Loading your results…</div>
      </PortalLayout>
    );
  }

  const kpis = data?.kpis || { total: 0, hot: 0, hotPct: 0, avgQ: 0, roi: 0 };
  const statusBreakdown = data?.statusBreakdown || [];
  const dailyVolume = data?.dailyVolume || [];
  const qualityTrend = data?.qualityTrend || [];
  const recentCalls = data?.recentCalls || [];
  const isDemo = data?.isDemo;

  const KPI_CARDS = [
    { label: 'Total Calls',  value: kpis.total,            sub: 'logged from your Sheet', accent: 'text-stone-900 dark:text-stone-100', ring: 'bg-stone-100 dark:bg-stone-800' },
    { label: 'Hot Leads',    value: kpis.hot,               sub: `${kpis.hotPct}% of calls`, accent: 'text-emerald-600 dark:text-emerald-400', ring: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Avg Quality',  value: kpis.avgQ,               sub: 'interest score (0–10)', accent: 'text-amber-600 dark:text-amber-400', ring: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Est. ROI',     value: `$${Math.round(kpis.roi).toLocaleString()}`, sub: 'from hot leads this period', accent: 'text-orange-600 dark:text-orange-400', ring: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <PortalLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">

        <PageHeader
          eyebrow={dateStr}
          title={greeting}
          subtitle="Real results from your reactivation calls, pulled live from your Google Sheet."
        >
          <Link
            href="/portal/crm"
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-amber-200/60 dark:shadow-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            View pipeline
          </Link>
        </PageHeader>

        {isDemo && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-800 dark:text-amber-400">
            Showing sample data — we couldn't read your Google Sheet yet. Double-check your Sheet connection in Settings, or run your first calls to see real numbers here.
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => (
            <div key={card.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
              <div className={`inline-flex items-center justify-center min-w-10 h-10 px-2.5 rounded-xl mb-3 ${card.ring}`}>
                <span className={`text-xl font-bold ${card.accent}`}>{card.value}</span>
              </div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-0.5">{card.label}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight">Call Outcomes</h2>
              <p className="text-xs text-stone-400 mt-0.5">{kpis.total} calls, by result</p>
            </div>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-stone-400 py-16 text-center">No calls logged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {statusBreakdown.map(s => <Cell key={s.name} fill={s.color || STATUS_COLOR[s.name]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              {statusBreakdown.map(s => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color || STATUS_COLOR[s.name] }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight">Call Volume</h2>
              <p className="text-xs text-stone-400 mt-0.5">Last 30 days</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyVolume} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/><stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" name="Calls" stroke="#d97706" strokeWidth={2} fill="url(#gv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality trend + recent calls */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight mb-1">Lead Quality Trend</h2>
            <p className="text-xs text-stone-400 mb-5">Avg. interest score by week</p>
            {qualityTrend.length === 0 ? (
              <p className="text-sm text-stone-400 py-12 text-center">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={qualityTrend} barSize={24} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Avg Score" radius={[6,6,0,0]} fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight mb-4">Recent Calls</h2>
            {recentCalls.length === 0 ? (
              <p className="text-sm text-stone-400 py-12 text-center">No calls logged yet. Once your agent starts dialing, results will show up here.</p>
            ) : (
              <div className="space-y-2">
                {recentCalls.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0"
                      style={{ background: `${STATUS_COLOR[c.status]}22`, color: STATUS_COLOR[c.status] }}
                    >
                      {c.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{c.interest || c.phone}</p>
                      <p className="text-xs text-stone-400 truncate">{c.source} · {c.phone}</p>
                    </div>
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex-shrink-0">{c.quality}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
