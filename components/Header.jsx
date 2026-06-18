import { useState, useEffect } from 'react';

export default function Header({ lastUpdated, onRefresh, isDemo }) {
  const [ago, setAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      const s = Math.floor((Date.now() - new Date(lastUpdated)) / 1000);
      setAgo(s < 60 ? 'just now' : `${Math.floor(s / 60)}m ago`);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <header style={{ backgroundColor: '#1F3A70' }} className="shadow-lg">
      {isDemo && (
        <div className="bg-amber-400 text-amber-900 text-center text-xs py-1 font-semibold tracking-wide">
          DEMO DATA — Connect your Google Sheet to see live results
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">LR</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Lead Reactivation AI</span>
        </div>
        <div className="text-center hidden md:block">
          <h1 className="text-white text-2xl font-bold">Performance Dashboard</h1>
          <p className="text-blue-200 text-sm">Real-time Lead Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          {ago && <span className="text-blue-300 text-xs hidden sm:block">Updated {ago}</span>}
          <button
            onClick={onRefresh}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
