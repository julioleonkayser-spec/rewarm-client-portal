import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { sessionFetch } from '../../lib/portal/fetcher';

const NAV = [
  {
    href: '/portal/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/portal/crm',
    label: 'Pipeline',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/portal/dialer',
    label: 'Dialer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.9 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012.82 0h3a2 2 0 012 1.72c.13.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L7.09 7.64A16 16 0 0014.36 15l1-1a2 2 0 012.11-.45c.91.35 1.85.58 2.81.71A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    href: '/portal/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M5.93 18.07l-1.41 1.41M19.07 19.07l-1.41-1.41M5.93 5.93L4.52 4.52M21 12h-2M5 12H3M12 21v-2M12 5V3" />
      </svg>
    ),
  },
];

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

export default function PortalLayout({ children, title }) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [sessionPlan, setSessionPlan] = useState('ReWarm');

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('rewarm_dark') === 'true') setDark(true);

    const raw = localStorage.getItem('rewarm_session');
    if (!raw) { router.push('/portal'); return; }
    try {
      const s = JSON.parse(raw);
      // Sessions with loggedAt expire after 30 days. Sessions without it are legacy
      // (pre-TTL logins) — leave them valid so existing clients aren't locked out.
      const TTL_MS = 30 * 24 * 60 * 60 * 1000;
      if (s.loggedAt && Date.now() - s.loggedAt > TTL_MS) {
        localStorage.removeItem('rewarm_session');
        router.push('/portal');
        return;
      }
      if (s.plan) setSessionPlan(s.plan);
    } catch { router.push('/portal'); }

    sessionFetch('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.profile) setProfile(d.profile); })
      .catch(() => {});
  }, []);

  const displayName = profile?.name || '';
  const displayBrokerage = profile?.brokerage || '';
  const initials = getInitials(displayName);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('rewarm_dark', String(next));
  };

  const logout = () => {
    localStorage.removeItem('rewarm_session');
    router.push('/portal');
  };

  if (!mounted) return null;

  return (
    <>
    <Head>
      <title>{title ? `${title} — ReWarm` : 'ReWarm Portal'}</title>
    </Head>
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-60 bg-stone-900 flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}>
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white tracking-tight">RW</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">ReWarm Portal</p>
              <p className="text-xs text-stone-500 leading-tight">{sessionPlan}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-stone-800 text-amber-400 border-l-2 border-amber-500 pl-2.5'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="px-3 py-3 border-t border-stone-800 space-y-1">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-200 truncate">
                  {displayName || <span className="text-stone-500 italic text-xs">Set name in Settings</span>}
                </p>
                <p className="text-xs text-stone-500 truncate">{displayBrokerage}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-medium text-stone-500 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 px-6 h-14 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <h1 className="flex-1 text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-tight">
              {title}
            </h1>

            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-stone-300 dark:hover:bg-stone-800 transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 lg:p-8 dark:text-stone-200">
            {children}
          </main>
        </div>
      </div>
    </div>
    </>
  );
}
