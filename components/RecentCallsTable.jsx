function timeAgo(d) {
  if (!d) return '—';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function maskPhone(p) {
  const d = (p || '').replace(/\D/g, '');
  return d.length >= 4 ? `****-${d.slice(-4)}` : p;
}

function StatusBadge({ s }) {
  const map = { HOT: ['#10B981', 'white'], WARM: ['#FBBF24', '#78350f'], COLD: ['#9CA3AF', 'white'], SKIP: ['#D1D5DB', '#374151'] };
  const [bg, color] = map[s] || ['#E5E7EB', '#374151'];
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: bg, color }}>{s || '—'}</span>;
}

function QualityBadge({ q }) {
  const bg = q >= 7 ? '#10B981' : q >= 5 ? '#FBBF24' : '#EF4444';
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: bg }}>{q > 0 ? `${q}/10` : '—'}</span>;
}

export default function RecentCallsTable({ calls = [], total }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1F3A70' }}>
        <h2 className="text-white font-bold text-lg">Recent Calls</h2>
        <span className="text-blue-200 text-sm">Showing {calls.length} of {total}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Time', 'Lead', 'Interest', 'Quality', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calls.length === 0
              ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">No calls recorded yet</td></tr>
              : calls.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{timeAgo(c.dateStr)}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{maskPhone(c.phone)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.interest || '—'}</td>
                  <td className="px-4 py-3"><QualityBadge q={c.quality} /></td>
                  <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
