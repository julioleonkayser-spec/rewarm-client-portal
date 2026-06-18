import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, LabelList,
} from 'recharts';

const STATUS_COLORS = { HOT: '#10B981', WARM: '#FBBF24', COLD: '#9CA3AF', SKIP: '#D1D5DB' };

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{title}</h3>
      <div style={{ height: 260 }}>{children}</div>
    </div>
  );
}

export default function ChartsSection({ statusBreakdown, dailyVolume, qualityTrend }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />)}
      </div>
    );
  }

  const lastScore  = qualityTrend[qualityTrend.length - 1]?.score ?? 0;
  const prevScore  = qualityTrend[qualityTrend.length - 2]?.score ?? 0;
  const trendColor = lastScore >= prevScore ? '#10B981' : '#F59E0B';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card title="Call Results Breakdown">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusBreakdown}
              cx="50%" cy="45%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {statusBreakdown.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || '#9CA3AF'} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Daily Call Volume (Last 30 Days)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyVolume} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="calls" stroke="#1F3A70" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Quality Score Trend (Weekly)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={qualityTrend} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip />
            <ReferenceLine y={7} stroke="#10B981" strokeDasharray="4 2" />
            <Bar dataKey="score" fill={trendColor} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="score" position="top" style={{ fontSize: 10, fill: '#6B7280' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
