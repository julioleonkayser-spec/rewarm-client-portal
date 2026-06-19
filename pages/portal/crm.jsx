import { useState, useEffect, useMemo } from 'react';
import PortalLayout from '../../components/portal/PortalLayout';
import { sessionFetch } from '../../lib/portal/fetcher';
import PageHeader from '../../components/portal/PageHeader';

const STAGES = ['new', 'contacted', 'warm', 'qualified', 'booked'];

const STAGE_CONFIG = {
  new:       { label: 'New',       bg: 'bg-slate-100 dark:bg-slate-800/50',    text: 'text-slate-700 dark:text-slate-300',    dot: 'bg-slate-400' },
  contacted: { label: 'Contacted', bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-700 dark:text-sky-400',         dot: 'bg-sky-400' },
  warm:      { label: 'Warm',      bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-400' },
  qualified: { label: 'Qualified', bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-400',   dot: 'bg-orange-500' },
  booked:    { label: 'Booked',    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

function StagePill({ stage }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LastCalled({ lead }) {
  if (!lead.lastCalled) {
    return <span className="text-xs text-stone-300 dark:text-stone-600">Never</span>;
  }
  const days = Math.floor((Date.now() - new Date(lead.lastCalled).getTime()) / 86400000);
  const overdue = days >= 7 && ['warm', 'qualified', 'contacted'].includes(lead.stage);
  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday'
    : new Date(lead.lastCalled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${overdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-stone-500 dark:text-stone-400'}`}>
      {overdue && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Overdue for follow-up" />}
      {label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const colors = [
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${color}`}>
      {initials}
    </div>
  );
}

function NotesModal({ lead, onSave, onClose, saving }) {
  const [notes, setNotes] = useState(lead.notes || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{lead.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{lead.phone}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {lead.originalInterest && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">{lead.originalInterest}</p>
        )}
        <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Add notes about this lead…"
          className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <p className="mt-1.5 text-xs text-stone-400">Saved directly to your Google Sheet.</p>
        <div className="flex items-center gap-3 mt-4">
          <button
            disabled={saving}
            onClick={() => onSave(notes)}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save Notes'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-stone-50 dark:border-stone-800/50">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
                <div className="h-3 w-20 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <div className="h-5 w-16 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse" />
          </td>
          <td className="py-3 px-4 hidden lg:table-cell">
            <div className="h-3.5 w-36 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          </td>
          <td className="py-3 px-4 hidden sm:table-cell">
            <div className="h-3.5 w-20 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          </td>
          <td className="py-3 px-4 hidden md:table-cell">
            <div className="h-3.5 w-16 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          </td>
          <td className="py-3 px-4">
            <div className="h-7 w-7 bg-stone-100 dark:bg-stone-800 rounded animate-pulse ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyLeads() {
  return (
    <tr>
      <td colSpan={6} className="py-20">
        <div className="max-w-xs mx-auto text-center px-4">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-400">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">No leads in your sheet yet</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-4">
            Add your contacts to your connected Google Sheet. The pipeline updates automatically after each call.
          </p>
          <a href="/portal/settings" className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
            Manage sheet connection →
          </a>
        </div>
      </td>
    </tr>
  );
}

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStage, setActiveStage] = useState('all');
  const [search, setSearch] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState('lastCalled');

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionFetch('/api/leads');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load leads');
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const stageCounts = useMemo(() => STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s).length;
    return acc;
  }, {}), [leads]);

  const filtered = useMemo(() => leads
    .filter(l => activeStage === 'all' || l.stage === activeStage)
    .filter(l => !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.originalInterest || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || '').includes(search))
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (!a.lastCalled && !b.lastCalled) return 0;
      if (!a.lastCalled) return 1;
      if (!b.lastCalled) return -1;
      return new Date(b.lastCalled) - new Date(a.lastCalled);
    }), [leads, activeStage, search, sortKey]);

  const saveNote = async (notes) => {
    if (!editingLead) return;
    setSaving(true);
    try {
      const res = await sessionFetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: editingLead.phone, notes }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setLeads(ls => ls.map(l => l.phone === editingLead.phone ? { ...l, notes } : l));
      setEditingLead(null);
    } catch (err) {
      alert('Could not save notes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout title="Pipeline">
      {editingLead && (
        <NotesModal
          lead={editingLead}
          saving={saving}
          onSave={saveNote}
          onClose={() => setEditingLead(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Pipeline"
          title="Lead pipeline"
          subtitle="Live from your Google Sheet — every lead, its call status, and notes from real calls."
        >
          <button
            onClick={fetchLeads}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </PageHeader>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-sm text-red-700 dark:text-red-400">
            Couldn't load your Sheet: {error}. Check your Google Sheets connection in Settings.
          </div>
        )}

        {/* Stage summary */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {STAGES.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            return (
              <button
                key={stage}
                onClick={() => setActiveStage(stage === activeStage ? 'all' : stage)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  activeStage === stage
                    ? `${cfg.bg} ${cfg.text} border-current`
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <p className={`text-xl font-bold ${activeStage === stage ? cfg.text : 'text-stone-800 dark:text-stone-200'}`}>
                  {stageCounts[stage] || 0}
                </p>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, phone, or interest…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="py-2 px-3 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="lastCalled">Sort: Most recent call</option>
            <option value="name">Sort: Name</option>
          </select>

          {activeStage !== 'all' && (
            <button onClick={() => setActiveStage('all')} className="text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              Clear filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Stage</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Interest</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Source</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Last Called</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {loading ? (
                  <TableSkeleton />
                ) : leads.length === 0 ? (
                  <EmptyLeads />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-stone-400 dark:text-stone-500">
                      No leads match your current filters.
                    </td>
                  </tr>
                ) : filtered.map(lead => (
                  <tr key={lead.phone} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{lead.name}</p>
                          <p className="text-xs text-stone-400 truncate">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StagePill stage={lead.stage} />
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-stone-600 dark:text-stone-400 truncate block max-w-xs">{lead.originalInterest || '—'}</span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-xs text-stone-600 dark:text-stone-400">{lead.leadSource || '—'}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <LastCalled lead={lead} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.notes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Has notes" />
                        )}
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Add/edit notes"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {leads.length} leads</span>
            {activeStage !== 'all' && (
              <span className="font-medium text-stone-500">{STAGE_CONFIG[activeStage]?.label} only</span>
            )}
          </div>
        </div>

        <p className="text-xs text-stone-400 text-center">
          New leads come from your Google Sheet — paste new rows there, or use the CSV importer in{' '}
          <a href="/portal/onboarding" className="text-amber-600 hover:underline">Setup</a>.
        </p>

      </div>
    </PortalLayout>
  );
}
