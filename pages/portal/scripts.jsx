import { useState } from 'react';
import { scripts } from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';

const CATEGORIES = [
  { id: 'call',      label: 'Call Openers' },
  { id: 'sms',       label: 'SMS Follow-up' },
  { id: 'voicemail', label: 'Voicemail' },
  { id: 'objection', label: 'Objections' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable in some contexts */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all
        ${copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border border-transparent dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-400'
        }
      `}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy script
        </>
      )}
    </button>
  );
}

function ScriptCard({ script }) {
  const [expanded, setExpanded] = useState(false);
  const lines = script.script.split('\n');
  const preview = lines[0];
  const hasMore = lines.length > 1 || script.script.length > 120;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                {script.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                script.type === 'seller'
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
              }`}>
                {script.type === 'seller' ? 'Seller' : 'Buyer'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{script.description}</p>
          </div>
        </div>

        {/* Script text */}
        <div className="mt-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl p-4">
          <pre className={`text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-sans leading-relaxed ${!expanded && hasMore ? 'line-clamp-3' : ''}`}>
            {script.script}
          </pre>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              {expanded ? 'Show less ↑' : 'Read full script ↓'}
            </button>
          )}
        </div>

        {/* Pro tip */}
        <div className="mt-3 flex items-start gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{script.tip}</p>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {script.tags.map(tag => (
            <span key={tag} className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 dark:text-stone-500 px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
        <CopyButton text={script.script} />
      </div>
    </div>
  );
}

export default function Scripts() {
  const [activeCategory, setActiveCategory] = useState('call');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = scripts.filter(s => {
    if (s.category !== activeCategory) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PortalLayout title="Scripts & Prompts">
      <div className="max-w-4xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Scripts & Prompts"
          title="Your reactivation script library"
          subtitle={`${scripts.length} field-tested call, SMS, voicemail, and objection scripts. Fill the brackets, then copy in one tap.`}
        />

        {/* Category tabs */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 w-full overflow-x-auto">
          {CATEGORIES.map(cat => {
            const count = scripts.filter(s => s.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeCategory === cat.id
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }
                `}
              >
                {cat.label}
                <span className={`text-xs ${activeCategory === cat.id ? 'text-amber-600' : 'text-stone-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
            {['all', 'seller', 'buyer'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  typeFilter === type
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
                }`}
              >
                {type === 'all' ? 'All' : type === 'seller' ? 'Seller' : 'Buyer'}
              </button>
            ))}
          </div>

          <div className="flex-1 relative min-w-48">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search scripts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Scripts list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <p className="text-stone-400 text-sm">No scripts match your filters.</p>
            <button onClick={() => { setTypeFilter('all'); setSearch(''); }} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 gap-4">
            {filtered.map(script => <ScriptCard key={script.id} script={script} />)}
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
