import { useState } from 'react';
import { leads as initialLeads, STAGES, STAGE_CONFIG } from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';

function StagePill({ stage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'
    : 'text-stone-600 bg-stone-100 dark:bg-stone-800 dark:text-stone-400';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${color}`}>{score}</span>
  );
}

function LastContact({ lead }) {
  if (!lead.lastContact) {
    return <span className="text-xs text-stone-300 dark:text-stone-600">Never</span>;
  }
  const days = Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / 86400000);
  const overdue = days >= 7 && ['warm', 'qualified', 'contacted'].includes(lead.stage);
  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday'
    : new Date(lead.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${overdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-stone-500 dark:text-stone-400'}`}>
      {overdue && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Overdue for follow-up" />}
      {label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const colors = ['bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700', 'bg-orange-100 text-orange-700'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${color}`}>
      {initials}
    </div>
  );
}

function NotesModal({ lead, onSave, onClose }) {
  const [notes, setNotes] = useState(lead.notes);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{lead.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{lead.neighborhood} · {lead.priceRange}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Add notes about this lead…"
          className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => { onSave(notes); onClose(); }} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Save Notes
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', type: 'buyer', neighborhood: '', priceRange: '', stage: 'new' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd({
      ...form,
      id: Date.now(),
      email: '',
      score: 50,
      lastContact: null,
      addedDate: new Date().toISOString().split('T')[0],
      source: 'Manual',
      notes: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Add Lead</h2>
        <div className="space-y-3">
          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Marcus Webb' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '(512) 000-0000' },
            { label: 'Neighborhood', key: 'neighborhood', type: 'text', placeholder: 'e.g. Austin, TX' },
            { label: 'Price Range', key: 'priceRange', type: 'text', placeholder: 'e.g. $500K–$700K' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => upd(key, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Type</label>
              <select value={form.type} onChange={e => upd('type', e.target.value)} className="w-full px-3 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Stage</label>
              <select value={form.stage} onChange={e => upd('stage', e.target.value)} className="w-full px-3 py-2.5 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleAdd} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Add Lead
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 rounded-xl transition-colors hover:text-stone-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const [leads, setLeads] = useState(initialLeads);
  const [activeStage, setActiveStage] = useState('all');
  const [search, setSearch] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState('score');

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s).length;
    return acc;
  }, {});

  const filtered = leads
    .filter(l => activeStage === 'all' || l.stage === activeStage)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.neighborhood.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortKey === 'score' ? b.score - a.score : a.name.localeCompare(b.name));

  const saveNote = (id, notes) => setLeads(ls => ls.map(l => l.id === id ? { ...l, notes } : l));
  const updateStage = (id, stage) => setLeads(ls => ls.map(l => l.id === id ? { ...l, stage } : l));
  const addLead = (lead) => setLeads(ls => [lead, ...ls]);

  return (
    <PortalLayout title="Pipeline">
      {editingLead && (
        <NotesModal
          lead={editingLead}
          onSave={(notes) => saveNote(editingLead.id, notes)}
          onClose={() => setEditingLead(null)}
        />
      )}
      {showAdd && <AddLeadModal onAdd={addLead} onClose={() => setShowAdd(false)} />}

      <div className="max-w-6xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Pipeline"
          title="Lead pipeline"
          subtitle="Every cold lead, scored and staged. Filter by stage, move a lead with its pill, and log notes as conversations happen."
        />

        {/* Stage summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            return (
              <button
                key={stage}
                onClick={() => setActiveStage(stage === activeStage ? 'all' : stage)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  activeStage === stage
                    ? `${cfg.bg} ${cfg.text} border-current`
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <p className={`text-xl font-bold ${activeStage === stage ? cfg.text : 'text-stone-800 dark:text-stone-200'}`}>
                  {stageCounts[stage]}
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
              placeholder="Search by name or location…"
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
            <option value="score">Sort: Score</option>
            <option value="name">Sort: Name</option>
          </select>

          {activeStage !== 'all' && (
            <button onClick={() => setActiveStage('all')} className="text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              Clear filter
            </button>
          )}

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Lead
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Stage</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">Price Range</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Last Contact</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-stone-400">
                      No leads match your current filters.
                    </td>
                  </tr>
                ) : filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{lead.name}</p>
                          <p className="text-xs text-stone-400 truncate">{lead.neighborhood}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-xs text-stone-600 dark:text-stone-400 capitalize">{lead.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative inline-block">
                        <StagePill stage={lead.stage} />
                        <select
                          value={lead.stage}
                          onChange={e => updateStage(lead.id, e.target.value)}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          aria-label="Change stage"
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-stone-600 dark:text-stone-400">{lead.priceRange}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <LastContact lead={lead} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        {lead.notes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Has notes" />
                        )}
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

      </div>
    </PortalLayout>
  );
}
