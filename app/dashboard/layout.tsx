'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

function logout() {
  document.cookie = 'token=; path=/; max-age=0';
  window.location.href = '/login';
}

const courtItems = [
  { label: 'All Cases',   count: 284, sub: [] },
  { label: 'Supreme Court',  count: 42,  sub: ['Pending (28)', 'Disposed (14)'] },
  { label: 'High Court',     count: 87,  sub: ['Pending (61)', 'Disposed (26)'] },
  { label: 'District Courts',count: 134, sub: ['Pending (98)', 'Disposed (36)'] },
  { label: 'District Courts ISB', count: 23, sub: ['Pending (18)', 'Disposed (5)'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  // If token is gone (logout or expired), kick back to login on back-button too
  useEffect(() => {
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    if (!hasToken) router.replace('/login');
  }, [router]);

  // Re-check on every browser visibility change (tab switch, back/forward)
  useEffect(() => {
    const onVisible = () => {
      const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      if (!hasToken) router.replace('/login');
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [router]);

  return (
    <>
      {/* Runs outside React — kicks unauthenticated users out on bfcache restore */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function checkAuth() {
            if (document.cookie.indexOf('token=') === -1) {
              window.location.replace('/login');
            }
          }
          checkAuth();
          window.addEventListener('pageshow', function(e) {
            if (e.persisted) checkAuth();
          });
        })();
      `}} />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg0:#1a1a1a; --bg1:#222; --bg2:#2a2a2a; --bg3:#333;
          --border:#3a3a3a; --border2:#444;
          --text:#e0e0e0; --text2:#a0a0a0; --text3:#666;
          --teal:#26A9E1; --teal2:#1a8fc4;
          --navy:#1D1C55;
          --red-bg:rgba(220,38,38,0.15); --red:#f87171;
          --amber-bg:rgba(251,191,36,0.12); --amber:#fbbf24;
          --green-bg:rgba(74,222,128,0.12); --green:#4ade80;
        }
        body { background: var(--bg0); color: var(--text); font-family: system-ui,-apple-system,sans-serif; font-size:12px; }

        .shell { display:flex; min-height:100vh; }

        /* SIDEBAR */
        .sidebar {
          width:200px; flex-shrink:0;
          background:var(--bg1); border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          position:fixed; top:0; bottom:0; left:0; overflow-y:auto; z-index:50;
        }
        .sidebar::-webkit-scrollbar { width:3px; }
        .sidebar::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }

        .sb-head {
          padding:14px; border-bottom:1px solid var(--border);
          display:flex; align-items:center; gap:9px; flex-shrink:0;
        }
        .sb-mark {
          width:28px; height:28px; background:var(--teal);
          border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .sb-name { font-size:11px; font-weight:700; color:var(--text); line-height:1.2; }
        .sb-sub  { font-size:8px; color:var(--text3); margin-top:1px; }

        .sb-logo-img { height:22px; width:auto; object-fit:contain; filter:brightness(0) invert(1); }

        .sb-sec { padding:8px 0 2px; }
        .sb-sec-label {
          font-size:8px; font-weight:700; color:var(--text3);
          text-transform:uppercase; letter-spacing:.1em;
          padding:0 14px 4px;
        }
        .sb-item {
          display:flex; align-items:center; gap:7px;
          padding:7px 14px; font-size:10px; color:var(--text2);
          border-left:2px solid transparent; cursor:pointer;
          transition:all .12s; text-decoration:none;
        }
        .sb-item:hover  { background:rgba(38,169,225,0.07); color:var(--teal); }
        .sb-item.active { background:rgba(38,169,225,0.12); color:var(--teal); border-left-color:var(--teal); font-weight:600; }
        .sb-cnt {
          margin-left:auto; font-size:8px; font-weight:700;
          padding:1px 6px; border-radius:8px;
          background:rgba(38,169,225,0.15); color:var(--teal);
        }
        .sb-cnt.danger { background:rgba(220,38,38,0.2); color:var(--red); }
        .sb-sub-item {
          padding:4px 14px 4px 32px; font-size:9px; color:var(--text3); cursor:pointer;
        }
        .sb-sub-item:hover { color:var(--teal); }
        .sb-divider { height:1px; background:var(--border); margin:6px 12px; }

        .sb-foot {
          margin-top:auto; padding:12px 14px;
          border-top:1px solid var(--border);
          display:flex; align-items:center; gap:8px; flex-shrink:0;
        }
        .sb-av {
          width:28px; height:28px; border-radius:50%;
          background:var(--teal); display:flex; align-items:center; justify-content:center;
          font-size:10px; font-weight:700; color:white; flex-shrink:0;
        }
        .sb-uname { font-size:10px; font-weight:600; color:var(--text); }
        .sb-urole { font-size:8px; color:var(--text3); }
        .sb-logout {
          margin-left:auto; background:none; border:none;
          color:var(--text3); cursor:pointer; padding:4px;
          transition:color .15s; display:flex; align-items:center;
        }
        .sb-logout:hover { color:var(--red); }

        /* TOPBAR */
        .topbar {
          position:fixed; top:0; left:200px; right:0; height:44px;
          background:var(--bg1); border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 18px; z-index:40;
        }
        .tb-tabs { display:flex; gap:2px; background:var(--bg2); border-radius:7px; padding:3px; }
        .tb-tab {
          padding:5px 14px; border-radius:5px;
          font-size:10px; color:var(--text2); cursor:pointer; transition:all .12s;
        }
        .tb-tab:hover { color:var(--text); }
        .tb-tab.active { background:var(--bg3); color:var(--text); font-weight:600; }

        .tb-right { display:flex; align-items:center; gap:8px; }
        .tb-search {
          display:flex; align-items:center; gap:6px;
          background:var(--bg2); border:1px solid var(--border2);
          border-radius:7px; padding:6px 12px;
          font-size:10px; color:var(--text3);
        }
        .tb-icon {
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          border-radius:6px; border:1px solid var(--border2); background:var(--bg2);
          color:var(--text2); cursor:pointer; position:relative; transition:all .12s;
        }
        .tb-icon:hover { border-color:var(--teal); color:var(--teal); }
        .notif-dot {
          width:6px; height:6px; background:#dc2626; border-radius:50%;
          position:absolute; top:5px; right:5px; border:1.5px solid var(--bg1);
        }

        /* MAIN */
        .main { margin-left:200px; margin-top:44px; flex:1; min-width:0; }
      `}</style>

      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-head">
            <img src="/gatronova-logo.png" alt="Gatronova" className="sb-logo-img" />
          </div>

          <div className="sb-sec">
            <div className="sb-sec-label">Overview</div>
            <div className={`sb-item${pathname==='/dashboard'?' active':''}`} onClick={() => router.push('/dashboard')}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-sec-label">Litigation</div>
            {courtItems.map(item => (
              <div key={item.label}>
                <div className="sb-item">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 22V12h18v10M1 12l11-9 11 9"/></svg>
                  {item.label}
                  <span className="sb-cnt">{item.count}</span>
                </div>
                {item.sub.map(s => <div key={s} className="sb-sub-item">↳ {s}</div>)}
              </div>
            ))}
          </div>

          <div className="sb-divider"/>

          <div className="sb-sec">
            <div className="sb-sec-label">Views</div>
            <div className="sb-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Pending Cases
            </div>
            <div className="sb-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Disposed Cases
            </div>
            <div className="sb-item" onClick={() => router.push('/cases/new')}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Case Form
              <span className="sb-cnt danger">+</span>
            </div>
          </div>

          <div className="sb-divider"/>

          <div className="sb-sec">
            <div className="sb-sec-label">Search By</div>
            {['Lawyer','IBC','Department','Company','Case No.','Category'].map(s => (
              <div key={s} className="sb-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {s}
              </div>
            ))}
          </div>

          <div className="sb-foot">
            <div className="sb-av">AD</div>
            <div>
              <div className="sb-uname">Admin</div>
              <div className="sb-urole">LAD Administrator</div>
            </div>
            <button className="sb-logout" onClick={logout} aria-label="Sign out" title="Sign out">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </aside>

        {/* TOPBAR */}
        <header className="topbar">
          <div className="tb-tabs">
            {['Overview','Litigation','Contracts','IP'].map(t => (
              <div key={t} className={`tb-tab${t==='Litigation'?' active':''}`}>{t}</div>
            ))}
          </div>
          <div className="tb-right">
            <div className="tb-search">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search cases, contracts, IP…
            </div>
            <div className="tb-icon">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              <div className="notif-dot"/>
            </div>
            <div className="tb-icon">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="main">
          {children}
        </main>
      </div>
    </>
  );
}
