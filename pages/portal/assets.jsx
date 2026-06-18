import { useState } from 'react';
import { assets } from '../../lib/portal/demo-data';
import PortalLayout from '../../components/portal/PortalLayout';
import PageHeader from '../../components/portal/PageHeader';

const CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'sop',        label: 'SOPs' },
  { id: 'template',   label: 'Templates' },
  { id: 'guide',      label: 'Guides' },
  { id: 'reference',  label: 'Reference' },
  { id: 'compliance', label: 'Compliance' },
];

const TYPE_ICONS = {
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  xlsx: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  ),
  csv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
};

const TYPE_COLORS = {
  pdf:   'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  xlsx:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  csv:   'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  video: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
};

const CAT_COLORS = {
  sop:        'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  template:   'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  guide:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  reference:  'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  compliance: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
};

export default function Assets() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = assets.filter(a => activeCategory === 'all' || a.category === activeCategory);
  const featured = filtered.filter(a => a.featured);
  const regular = filtered.filter(a => !a.featured);

  return (
    <PortalLayout title="Assets">
      <div className="max-w-5xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Resource Library"
          title="Assets & playbooks"
          subtitle={`${assets.length} done-for-you SOPs, templates, guides, and compliance docs — everything included with your ReWarm purchase.`}
        />

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all' ? assets.length : assets.filter(a => a.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat.label}
                <span className={`text-xs ${activeCategory === cat.id ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Featured assets */}
        {featured.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">Featured</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(asset => (
                <div
                  key={asset.id}
                  className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex flex-col hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLORS[asset.type]}`}>
                      {TYPE_ICONS[asset.type]}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Featured</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug mb-2">
                      {asset.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {asset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${CAT_COLORS[asset.category] || 'bg-stone-100 text-stone-600'}`}>
                        {asset.category}
                      </span>
                      <span className="text-xs text-stone-400">v{asset.version}</span>
                      {asset.pages && <span className="text-xs text-stone-400">{asset.pages}p</span>}
                    </div>
                    <a
                      href={asset.downloadUrl}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                      onClick={e => e.preventDefault()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular assets */}
        {regular.length > 0 && (
          <div>
            {featured.length > 0 && (
              <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">All Resources</h2>
            )}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
              {regular.map((asset, idx) => (
                <div
                  key={asset.id}
                  className={`flex items-center gap-4 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                    idx < regular.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[asset.type]}`}>
                    {TYPE_ICONS[asset.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">{asset.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">{asset.description}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${CAT_COLORS[asset.category] || 'bg-stone-100 text-stone-600'}`}>
                      {asset.category}
                    </span>
                    <span className="text-xs text-stone-400">v{asset.version}</span>
                    {asset.pages && <span className="text-xs text-stone-400">{asset.pages}p</span>}
                  </div>
                  <a
                    href={asset.downloadUrl}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                    onClick={e => e.preventDefault()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <p className="text-stone-400 text-sm">No assets in this category yet.</p>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
