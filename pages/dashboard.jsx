import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import KPICards from '../components/KPICards';
import ChartsSection from '../components/ChartsSection';
import RecentCallsTable from '../components/RecentCallsTable';
import Footer from '../components/Footer';

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-24 bg-blue-900" />
      <div className="max-w-7xl mx-auto px-6 py-5 space-y-4">
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}</div>
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-72 bg-gray-200 rounded-xl" />)}</div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [updated, setUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sheets/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setData(j);
      setUpdated(j.lastUpdated);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return <Skeleton />;

  return (
    <>
      <Head>
        <title>Lead Reactivation AI — Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header lastUpdated={updated} onRefresh={fetchData} isDemo={data?.isDemo} />
        <main className="max-w-7xl mx-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-red-700 text-sm">Could not load data: {error}</span>
              <button onClick={fetchData} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Retry</button>
            </div>
          )}
          {data && (
            <>
              <KPICards kpis={data.kpis} />
              <ChartsSection
                statusBreakdown={data.statusBreakdown}
                dailyVolume={data.dailyVolume}
                qualityTrend={data.qualityTrend}
              />
              <RecentCallsTable calls={data.recentCalls} total={data.kpis.total} />
            </>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
