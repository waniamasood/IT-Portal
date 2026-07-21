'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const portal =
    pathname.startsWith('/dashboard/litigation') ? 'litigation' :
    pathname.startsWith('/dashboard/contracts')  ? 'contracts'  :
    pathname.startsWith('/dashboard/ip')         ? 'ip'         : 'overview';

  useEffect(() => {
    const check = () => {
      const ok = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      if (!ok) router.replace('/login');
    };
    check();
    window.addEventListener('pageshow', check);
    return () => window.removeEventListener('pageshow', check);
  }, [router]);

  function logout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.replace('/login');
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden}
        body{background:#08080f;color:#dde1e9;font-family:'Inter','Segoe UI',system-ui,sans-serif;font-size:13px}
        a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#26264a;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#26A9E1}

        /* ─── SHELL ─── */
        .shell{display:flex;height:100vh;width:100vw;overflow:hidden}

        /* ─── SIDEBAR ─── */
        .sb{
          width:220px;min-width:220px;
          background:linear-gradient(180deg,#0c0c1d 0%,#090915 100%);
          border-right:1px solid #16163a;
          display:flex;flex-direction:column;overflow:hidden;
          position:relative;z-index:10;
        }
        .sb-logo{
          padding:16px 14px 12px;
          border-bottom:1px solid #16163a;
          display:flex;align-items:center;gap:10px;flex-shrink:0;
        }
        .sb-emblem{
          width:34px;height:34px;flex-shrink:0;
          background:linear-gradient(135deg,#1D1C55 0%,#26A9E1 100%);
          border-radius:9px;display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:900;color:#fff;letter-spacing:-0.5px;
          box-shadow:0 4px 12px rgba(38,169,225,0.3);
        }
        .sb-brand{line-height:1.2}
        .sb-brand-name{font-size:11.5px;font-weight:700;color:#e4e8f0}
        .sb-brand-sub{font-size:9.5px;color:#4a5568;margin-top:1px}

        .sb-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 0 10px}
        .sb-section{margin-bottom:2px}
        .sb-section-label{
          padding:10px 14px 4px;
          font-size:9px;font-weight:700;letter-spacing:1.4px;
          text-transform:uppercase;color:#26A9E1;opacity:.8;
        }
        .sb-link{
          display:flex;align-items:center;gap:8px;
          padding:8px 14px;font-size:11.5px;color:#6b7280;
          cursor:pointer;transition:all .15s;border-left:2px solid transparent;
          white-space:nowrap;
        }
        .sb-link:hover{color:#c9d1db;background:rgba(38,169,225,.06);border-left-color:#26264a}
        .sb-link.active{color:#26A9E1;background:rgba(38,169,225,.1);border-left-color:#26A9E1;font-weight:600}
        .sb-link-ico{width:15px;text-align:center;font-size:13px;flex-shrink:0}
        .sb-badge{
          margin-left:auto;font-size:9px;font-weight:700;
          padding:1px 7px;border-radius:10px;
          background:rgba(38,169,225,.18);color:#26A9E1;
        }
        .sb-badge.warn{background:rgba(251,146,60,.18);color:#fb923c}
        .sb-badge.danger{background:rgba(239,68,68,.18);color:#ef4444}
        .sb-divider{height:1px;background:#16163a;margin:6px 14px}
        .sb-sub{
          padding:5px 14px 5px 30px;font-size:10.5px;color:#4a5568;cursor:pointer;transition:color .12s;
        }
        .sb-sub:hover{color:#94a3b8}

        .sb-foot{
          flex-shrink:0;padding:10px 12px;border-top:1px solid #16163a;
          display:flex;align-items:center;gap:8px;
        }
        .sb-av{
          width:30px;height:30px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,#1D1C55,#26A9E1);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;color:#fff;
        }
        .sb-user-name{font-size:11px;font-weight:600;color:#dde1e9}
        .sb-user-role{font-size:9px;color:#4a5568;margin-top:1px}
        .sb-logout-btn{
          margin-left:auto;width:28px;height:28px;border-radius:6px;
          background:none;border:1px solid #1e1e36;
          color:#4a5568;cursor:pointer;display:flex;align-items:center;justify-content:center;
          transition:all .15s;font-size:13px;flex-shrink:0;
        }
        .sb-logout-btn:hover{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1)}

        /* ─── MAIN ─── */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

        /* ─── TOPBAR ─── */
        .topbar{
          height:48px;flex-shrink:0;
          background:#0a0a18;border-bottom:1px solid #16163a;
          display:flex;align-items:stretch;justify-content:space-between;
          padding:0;
        }
        .tb-left{display:flex;align-items:stretch}
        .tb-tab{
          display:flex;align-items:center;gap:6px;
          padding:0 22px;font-size:12px;font-weight:500;color:#4a5568;cursor:pointer;
          border-bottom:2px solid transparent;transition:all .15s;text-decoration:none;
        }
        .tb-tab:hover{color:#94a3b8;background:rgba(38,169,225,.04)}
        .tb-tab.active{color:#26A9E1;border-bottom-color:#26A9E1;background:rgba(38,169,225,.07)}
        .tb-tab-ico{font-size:14px}

        .tb-right{
          display:flex;align-items:center;gap:8px;padding:0 16px;
        }
        .tb-pill{
          padding:5px 12px;border-radius:6px;
          background:#111128;border:1px solid #1e1e36;
          font-size:10.5px;color:#4a5568;
        }
        .tb-notif{
          width:30px;height:30px;border-radius:7px;
          background:#111128;border:1px solid #1e1e36;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;position:relative;font-size:14px;
          transition:all .15s;
        }
        .tb-notif:hover{border-color:#26A9E1;color:#26A9E1}
        .tb-dot{
          position:absolute;top:5px;right:5px;
          width:6px;height:6px;border-radius:50%;background:#ef4444;
          border:1.5px solid #0a0a18;
        }

        /* ─── CONTENT ─── */
        .content{flex:1;overflow-y:auto;overflow-x:hidden}
      `}</style>

      <div className="shell">
        {/* ── SIDEBAR ── */}
        <aside className="sb">
          <div className="sb-logo">
            <div className="sb-emblem">GN</div>
            <div className="sb-brand">
              <div className="sb-brand-name">Gatronova Legal</div>
              <div className="sb-brand-sub">Legal Management Portal</div>
            </div>
          </div>

          <div className="sb-scroll">
            {/* Overview always */}
            <div className="sb-section">
              <div className="sb-section-label">Overview</div>
              <a href="/dashboard" className={`sb-link${portal==='overview'?' active':''}`}>
                <span className="sb-link-ico">⊞</span>Dashboard
              </a>
            </div>

            <div className="sb-divider" />

            {/* LITIGATION NAV */}
            {portal === 'litigation' && (
              <>
                <div className="sb-section">
                  <div className="sb-section-label">Litigation Portal</div>
                  <a href="/dashboard/litigation" className={`sb-link${pathname==='/dashboard/litigation'?' active':''}`}>
                    <span className="sb-link-ico">⚖</span>All Cases
                  </a>
                  <a href="/dashboard/litigation?status=Pending" className="sb-link">
                    <span className="sb-link-ico">⏳</span>Pending Cases
                  </a>
                  <a href="/dashboard/litigation?status=Disposed" className="sb-link">
                    <span className="sb-link-ico">✓</span>Disposed Cases
                  </a>
                  <a href="/dashboard/litigation?filter=hearings" className="sb-link">
                    <span className="sb-link-ico">📅</span>Upcoming Hearings
                    <span className="sb-badge warn">7d</span>
                  </a>
                  <a href="/dashboard/litigation?filter=stay" className="sb-link">
                    <span className="sb-link-ico">🔒</span>Stay Orders
                  </a>
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">By Court</div>
                  {['Supreme Court','High Court of Sindh','District Courts Karachi','District Courts Islamabad'].map(c=>(
                    <div key={c}>
                      <a href={`/dashboard/litigation?court=${encodeURIComponent(c)}`} className="sb-link">
                        <span className="sb-link-ico">🏛</span>{c.replace('District Courts ','DC ')}
                      </a>
                      <div className="sb-sub">→ Pending</div>
                      <div className="sb-sub">→ Disposed</div>
                    </div>
                  ))}
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">Search By</div>
                  {['Lawyer','Case Number','Category','IBC / Dept'].map(s=>(
                    <div key={s} className="sb-link"><span className="sb-link-ico">⌕</span>{s}</div>
                  ))}
                </div>
              </>
            )}

            {/* CONTRACTS NAV */}
            {portal === 'contracts' && (
              <>
                <div className="sb-section">
                  <div className="sb-section-label">Contracts Portal</div>
                  <a href="/dashboard/contracts" className={`sb-link${pathname==='/dashboard/contracts'?' active':''}`}>
                    <span className="sb-link-ico">📄</span>All Contracts
                  </a>
                  <a href="/dashboard/contracts?status=Ongoing" className="sb-link">
                    <span className="sb-link-ico">🟢</span>Ongoing
                  </a>
                  <a href="/dashboard/contracts?status=Expired" className="sb-link">
                    <span className="sb-link-ico">🔴</span>Expired
                  </a>
                  <a href="/dashboard/contracts?filter=expiring" className="sb-link">
                    <span className="sb-link-ico">⚠</span>Expiring Soon
                    <span className="sb-badge warn">30d</span>
                  </a>
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">By Category</div>
                  {['SLA','Manpower','Supply','Transport','Sale Purchase','Bank Facilities','Rent / Tenancy','MOU','Addendums'].map(c=>(
                    <div key={c} className="sb-link"><span className="sb-link-ico">›</span>{c}</div>
                  ))}
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">By Location</div>
                  {['Head Office','Factory'].map(l=>(
                    <div key={l}>
                      <div className="sb-link"><span className="sb-link-ico">🏢</span>{l}</div>
                      <div className="sb-sub">→ Ongoing</div>
                      <div className="sb-sub">→ Expired</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* IP NAV */}
            {portal === 'ip' && (
              <>
                <div className="sb-section">
                  <div className="sb-section-label">IP Management</div>
                  <a href="/dashboard/ip" className={`sb-link${pathname==='/dashboard/ip'?' active':''}`}>
                    <span className="sb-link-ico">💡</span>All IP Records
                  </a>
                  <a href="/dashboard/ip?status=Active" className="sb-link">
                    <span className="sb-link-ico">✓</span>Active
                  </a>
                  <a href="/dashboard/ip?status=Expired" className="sb-link">
                    <span className="sb-link-ico">✕</span>Expired
                  </a>
                  <a href="/dashboard/ip?filter=expiring" className="sb-link">
                    <span className="sb-link-ico">⚠</span>Expiring Soon
                    <span className="sb-badge warn">90d</span>
                  </a>
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">By Type</div>
                  {['Trademark','Patent','Copyright'].map(t=>(
                    <div key={t}>
                      <a href={`/dashboard/ip?category=${t}`} className="sb-link">
                        <span className="sb-link-ico">{t==='Trademark'?'™':t==='Patent'?'⚙':'©'}</span>{t}
                      </a>
                      <div className="sb-sub">→ Active</div>
                      <div className="sb-sub">→ Expired</div>
                    </div>
                  ))}
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">14 Companies</div>
                  {['Novatex','Gatron Ind.','Pharmnova','Nova Mobility','Krystalite','G-pac','Dvago','Gatro Power'].map(c=>(
                    <div key={c} className="sb-link"><span className="sb-link-ico">›</span>{c}</div>
                  ))}
                </div>
              </>
            )}

            {/* OVERVIEW NAV */}
            {portal === 'overview' && (
              <>
                <div className="sb-section">
                  <div className="sb-section-label">Portals</div>
                  <a href="/dashboard/litigation" className="sb-link">
                    <span className="sb-link-ico">⚖</span>Litigation
                  </a>
                  <a href="/dashboard/contracts" className="sb-link">
                    <span className="sb-link-ico">📄</span>Contracts
                  </a>
                  <a href="/dashboard/ip" className="sb-link">
                    <span className="sb-link-ico">💡</span>IP Management
                  </a>
                </div>
                <div className="sb-divider" />
                <div className="sb-section">
                  <div className="sb-section-label">Quick Links</div>
                  <div className="sb-link"><span className="sb-link-ico">🔔</span>All Alerts</div>
                  <div className="sb-link"><span className="sb-link-ico">📅</span>Hearing Calendar</div>
                  <div className="sb-link"><span className="sb-link-ico">📊</span>Reports</div>
                </div>
              </>
            )}
          </div>

          <div className="sb-foot">
            <div className="sb-av">AD</div>
            <div>
              <div className="sb-user-name">Admin</div>
              <div className="sb-user-role">LAD Administrator</div>
            </div>
            <button className="sb-logout-btn" onClick={logout} title="Sign out">↩</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          {/* TOPBAR */}
          <header className="topbar">
            <div className="tb-left">
              <a href="/dashboard"        className={`tb-tab${portal==='overview'   ?' active':''}`}><span className="tb-tab-ico">⊞</span>Overview</a>
              <a href="/dashboard/litigation" className={`tb-tab${portal==='litigation'?' active':''}`}><span className="tb-tab-ico">⚖</span>Litigation</a>
              <a href="/dashboard/contracts"  className={`tb-tab${portal==='contracts' ?' active':''}`}><span className="tb-tab-ico">📄</span>Contracts</a>
              <a href="/dashboard/ip"         className={`tb-tab${portal==='ip'        ?' active':''}`}><span className="tb-tab-ico">💡</span>IP Management</a>
            </div>
            <div className="tb-right">
              <span className="tb-pill">Gatronova Group</span>
              <span className="tb-pill">{new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}</span>
              <div className="tb-notif"><span>🔔</span><div className="tb-dot"/></div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="content">{children}</div>
        </div>
      </div>
    </>
  );
}
