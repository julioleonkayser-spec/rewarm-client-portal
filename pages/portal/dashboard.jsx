import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const STATUS_COLOR = { HOT: '#10B981', WARM: '#FBBF24', COLD: '#9CA3AF', SKIP: '#D1D5DB', RETRY: '#a78bfa' };
const STATUS_BG    = { HOT: '#d1fae5', WARM: '#fef3c7', COLD: '#f3f4f6', SKIP: '#e5e7eb', RETRY: '#ede9fe' };

function StatusBadge({ status }) {
  if (!status) return <span className="text-xs text-stone-400 italic">Pending</span>;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{ background: STATUS_BG[status] || '#f3f4f6', color: STATUS_COLOR[status] || '#6b7280' }}>
      {status}
    </span>
  );
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(e => <p key={e.name} style={{ color: e.color || e.fill }}>{e.name}: <b>{e.value}</b></p>)}
    </div>
  );
};

function KpiCard({ label, value, sub, accent, ring }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5">
      <div className={`inline-flex items-center justify-center min-w-10 h-10 px-2.5 rounded-xl mb-3 ${ring}`}>
        <span className={`text-xl font-bold ${accent}`}>{value}</span>
      </div>
      <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-0.5">{label}</p>
      <p className="text-xs text-stone-400 dark:text-stone-500">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/sheets/data?t=' + Date.now());
      const d = await res.json();
      setData(d);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 30000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <PortalLayout title="Dashboard">
        <div className="max-w-6xl mx-auto py-24 text-center text-sm text-stone-400">Loading…</div>
      </PortalLayout>
    );
  }

  const sheetStatus = data?.status;
  const kpis = data?.kpis || { total: 0, hot: 0, hotPct: 0, avgQ: 0, roi: 0, pending: 0 };
  const statusBreakdown = data?.statusBreakdown || [];
  const dailyVolume = data?.dailyVolume || [];
  const allLeads = data?.allLeads || [];

  const filterOptions = ['ALL', 'HOT', 'WARM', 'COLD', 'PENDING'];
  const filtered = filter === 'ALL' ? allLeads
    : filter === 'PENDING' ? allLeads.filter(l => !l.status)
    : allLeads.filter(l => l.status === filter);

  return (
    <PortalLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">Lead Dashboard</h1>
            {lastRefresh && (
              <p className="text-xs text-stone-400 mt-0.5">
                Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · auto-refreshes every 30s
              </p>
            )}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Status banners */}
        {sheetStatus === 'not_configured' && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">No sheet connected.</span>{' '}
            <Link href="/portal/settings" className="underline font-medium">Go to Settings → Integrations</Link> to connect your Google Sheet.
          </div>
        )}
        {(sheetStatus === 'forbidden' || sheetStatus === 'not_found') && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{sheetStatus === 'forbidden' ? 'Permission denied.' : 'Sheet not found.'}</span>{' '}
            <Link href="/portal/settings" className="underline font-medium">Check Settings → Integrations</Link>.
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard label="Total Leads" value={allLeads.length}  sub="in your sheet"                accent="text-stone-900 dark:text-stone-100"     ring="bg-stone-100 dark:bg-stone-800" />
          <KpiCard label="Called"      value={kpis.total}       sub="with a result logged"         accent="text-blue-600 dark:text-blue-400"        ring="bg-blue-50 dark:bg-blue-900/20" />
          <KpiCard label="Pending"     value={kpis.pending}     sub="not yet called"               accent="text-stone-500 dark:text-stone-400"      ring="bg-stone-100 dark:bg-stone-800" />
          <KpiCard label="Hot Leads"   value={kpis.hot}         sub={`${kpis.hotPct}% of called`}  accent="text-emerald-600 dark:text-emerald-400"  ring="bg-emerald-50 dark:bg-emerald-900/20" />
          <KpiCard label="Avg Quality" value={kpis.avgQ || '—'} sub="interest score (0–10)"        accent="text-amber-600 dark:text-amber-400"      ring="bg-amber-50 dark:bg-amber-900/20" />
        </div>

        {/* Charts — only when there is called data */}
        {statusBreakdown.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">Call Outcomes</h2>
              <p className="text-xs text-stone-400 mb-4">{kpis.total} calls by result</p>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" innerRadius={42} outerRadius={65} paddingAngle={2}>
                      {statusBreakdown.map(s => <Cell key={s.name} fill={s.color || STATUS_COLOR[s.name]} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {statusBreakdown.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-stone-600 dark:text-stone-400">{s.name}</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 ml-auto pl-2">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">Call Volume</h2>
              <p className="text-xs text-stone-400 mb-4">Last 30 days</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={dailyVolume} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} interval={5}/>
                  <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<Tip />}/>
                  <Area type="monotone" dataKey="calls" name="Calls" stroke="#d97706" strokeWidth={2} fill="url(#gv)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">All Leads</h2>
              <p className="text-xs text-stone-400 mt-0.5">{filtered.length} of {allLeads.length} shown</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {filterOptions.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >{f}</button>
              ))}
            </div>
          </div>

          {allLeads.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                {sheetStatus === 'not_configured' ? 'Connect your sheet to see leads' : 'No leads in your sheet yet'}
              </p>
              {sheetStatus === 'not_configured' ? (
                <Link href="/portal/settings" className="text-xs text-amber-600 underline">Go to Settings → Integrations</Link>
              ) : (
                <p className="text-xs text-stone-400">Add rows to your Google Sheet — they appear here automatically.</p>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">No leads match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    {['Name / Phone', 'Source', 'Interest', 'Status', 'Quality', 'Date'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                  {filtered.map((lead, i) => (
                    <tr key={lead.rowIndex || i} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800 dark:text-stone-200">{lead.name || '—'}</p>
                        <p className="text-xs text-stone-400 font-mono">{lead.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">{lead.source || '—'}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs text-stone-600 dark:text-stone-300 truncate" title={lead.interest}>{lead.interest || '—'}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
                        {lead.quality > 0 ? `${lead.quality}/10` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                        {lead.dateStr ? lead.dateStr.split('T')[0] : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PortalLayout>
  );
}
