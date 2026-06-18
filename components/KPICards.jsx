function fmt(n) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function currency(n) { return `$${n >= 1000 ? (n / 1000).toFixed(0) + 'k' : n}`; }

function Card({ value, label, sub, accent, icon }) {
  return (
    <div
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2"
      style={{ borderBottom: `4px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-black" style={{ color: '#1F3A70' }}>{value}</p>
          <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function KPICards({ kpis }) {
  const { total, hot, hotPct, avgQ, roi } = kpis;
  const qColor = avgQ >= 7 ? '#10B981' : avgQ >= 5 ? '#FBBF24' : '#EF4444';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card value={fmt(total)}    label="Total Calls"      sub="Leads called this month"      accent="#1F3A70" icon="📞" />
      <Card value={fmt(hot)}      label="Hot Leads Found"  sub={`${hotPct}% of total calls`}  accent="#10B981" icon="🔥" />
      <Card value={`${avgQ}/10`}  label="Avg Lead Quality" sub="Sentiment score"              accent={qColor}  icon="⭐" />
      <Card value={currency(roi)} label="Est. Monthly ROI" sub="30% conv × $7.5k commission"  accent="#10B981" icon="💰" />
    </div>
  );
}
