'use client';

import { useEffect, useState, useCallback } from 'react';

interface Case {
  CaseID: number;
  CaseNumber: string;
  CaseTitle: string;
  CourtName: string;
  CategoryName: string;
  CounselName: string;
  InternalAssociateName: string;
  Status: string;
  LastHearingDate: string | null;
  NextHearingDate: string | null;
}

interface Stats {
  total: number;
  pending: number;
  disposed: number;
  alerts: number;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null): number {
  if (!d) return 999;
  const diff = new Date(d).getTime() - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusClass(s: string) {
  if (s === 'Disposed')           return 'sp-success';
  if (s === 'Stay Order')         return 'sp-critical';
  if (s === 'Hearing Scheduled')  return 'sp-warning';
  return 'sp-warning';
}

function AlertPill({ days, caseTitle, court }: { days: number; caseTitle: string; court: string }) {
  const type = days <= 1 ? 'critical' : days <= 3 ? 'warning' : 'info';
  const label = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} Days`;
  return (
    <div className={`ab-pill ${type}`}>
      <div className="ab-dot" />
      {label} — {caseTitle} ({court})
    </div>
  );
}

export default function DashboardPage() {
  const [cases, setCases]   = useState<Case[]>([]);
  const [stats, setStats]   = useState<Stats>({ total:0, pending:0, disposed:0, alerts:0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)      params.set('search', search);
      if (courtFilter) params.set('court', courtFilter);
      if (filter === 'pending')  params.set('status', 'Pending');
      if (filter === 'disposed') params.set('status', 'Disposed');

      const res  = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      const all: Case[] = data.cases || [];

      setCases(all);
      setStats({
        total:    all.length,
        pending:  all.filter(c => c.Status === 'Pending' || c.Status === 'Hearing Scheduled' || c.Status === 'Stay Order').length,
        disposed: all.filter(c => c.Status === 'Disposed').length,
        alerts:   all.filter(c => daysUntil(c.NextHearingDate) <= 3).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filter, courtFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const upcomingAlerts = cases
    .filter(c => daysUntil(c.NextHearingDate) <= 7)
    .sort((a,b) => daysUntil(a.NextHearingDate) - daysUntil(b.NextHearingDate))
    .slice(0, 6);

  const kpis = [
    { label:'Total Cases',    value: stats.total,    sub:'All courts',       color:'#60a5fa' },
    { label:'Pending',        value: stats.pending,  sub:'Active cases',     color:'#fbbf24' },
    { label:'Disposed',       value: stats.disposed, sub:'Resolved cases',   color:'#4ade80' },
    { label:'Hearing Alerts', value: stats.alerts,   sub:'Next 3 days',      color:'#f87171' },
  ];

  const courts = ['Supreme Court','High Court','District Court','District Court Islamabad'];

  return (
    <>
      <style>{`
        .pg { padding:16px 20px; background:var(--bg0); min-height:calc(100vh - 44px); }
        .pg-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:14px; }
        .pg-title { font-size:18px; font-weight:800; color:var(--text); letter-spacing:-0.02em; }
        .pg-sub   { font-size:11px; color:var(--text3); margin-top:3px; }
        .pg-actions { display:flex; gap:7px; }
        .btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
        .btn-outline { background:transparent; color:var(--text2); border:1px solid var(--border2); }
        .btn-outline:hover { border-color:var(--teal); color:var(--teal); }
        .btn-primary { background:var(--teal); color:white; }
        .btn-primary:hover { background:var(--teal2); }

        .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
        .kpi { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:14px 16px; position:relative; overflow:hidden; }
        .kpi-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:10px 10px 0 0; }
        .kpi-label { font-size:9px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.07em; }
        .kpi-value { font-size:30px; font-weight:800; letter-spacing:-0.04em; line-height:1; margin:6px 0 3px; }
        .kpi-sub   { font-size:10px; color:var(--text3); }

        .alert-banner { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .ab-title { font-size:9px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; flex-shrink:0; padding-right:10px; border-right:1px solid var(--border2); }
        .ab-pills { display:flex; gap:6px; flex-wrap:wrap; }
        .ab-pill { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:5px; font-size:10px; font-weight:600; border:1px solid transparent; }
        .ab-pill.critical { background:rgba(220,38,38,0.12); color:#f87171; border-color:rgba(220,38,38,0.25); }
        .ab-pill.warning  { background:rgba(251,191,36,0.10); color:#fbbf24; border-color:rgba(251,191,36,0.22); }
        .ab-pill.info     { background:rgba(38,169,225,0.10); color:var(--teal); border-color:rgba(38,169,225,0.22); }
        .ab-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .critical .ab-dot { background:#ef4444; }
        .warning  .ab-dot { background:#f59e0b; }
        .info     .ab-dot { background:var(--teal); }
        .ab-none { font-size:11px; color:var(--text3); }

        .table-card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .table-toolbar { display:flex; align-items:center; gap:10px; padding:11px 14px; border-bottom:1px solid var(--border); background:var(--bg3); flex-wrap:wrap; }
        .tt-title { font-size:11px; font-weight:700; color:var(--text); }
        .tt-search { display:flex; align-items:center; gap:6px; background:var(--bg2); border:1px solid var(--border2); border-radius:6px; padding:5px 10px; font-size:10px; color:var(--text3); flex:1; min-width:180px; }
        .tt-search input { background:none; border:none; outline:none; color:var(--text); font-size:11px; width:100%; font-family:inherit; }
        .tt-search input::placeholder { color:var(--text3); }
        .tt-select { background:var(--bg2); border:1px solid var(--border2); border-radius:6px; padding:5px 8px; font-size:10px; color:var(--text2); outline:none; cursor:pointer; font-family:inherit; }
        .filter-chips { display:flex; gap:5px; }
        .chip { padding:4px 10px; border-radius:5px; font-size:9px; font-weight:700; border:1px solid var(--border2); background:var(--bg2); color:var(--text3); cursor:pointer; font-family:inherit; }
        .chip.on { background:var(--teal); color:white; border-color:var(--teal); }
        .chip.danger { background:rgba(220,38,38,0.12); color:#f87171; border-color:rgba(220,38,38,0.25); }

        table.dt { width:100%; border-collapse:collapse; }
        table.dt thead tr { background:var(--bg3); border-bottom:1px solid var(--border2); }
        table.dt thead th { padding:8px 12px; font-size:9px; font-weight:700; color:var(--text3); text-align:left; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
        table.dt tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
        table.dt tbody tr:hover { background:rgba(255,255,255,0.03); }
        table.dt tbody tr.hl-row { background:rgba(220,38,38,0.05); }
        table.dt tbody td { padding:8px 12px; font-size:10px; color:var(--text2); vertical-align:middle; }
        .case-id { color:var(--teal); font-weight:700; font-family:monospace; font-size:10px; }
        .court-tag { font-size:8px; font-weight:700; padding:2px 7px; border-radius:3px; background:rgba(38,169,225,0.12); color:var(--teal); letter-spacing:.04em; white-space:nowrap; }
        .status-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:9px; font-weight:700; }
        .sp-critical { background:rgba(220,38,38,0.12); color:#f87171; }
        .sp-warning  { background:rgba(251,191,36,0.10); color:#fbbf24; }
        .sp-success  { background:rgba(74,222,128,0.10); color:#4ade80; }
        .date-alert  { color:#f87171; font-weight:700; }
        .action-btn  { padding:3px 9px; border-radius:4px; font-size:9px; font-weight:700; background:rgba(38,169,225,0.12); color:var(--teal); border:none; cursor:pointer; font-family:inherit; }
        .action-btn:hover { background:rgba(38,169,225,0.22); }

        .table-footer { display:flex; align-items:center; justify-content:space-between; padding:9px 14px; border-top:1px solid var(--border); background:var(--bg3); }
        .tf-info { font-size:9px; color:var(--text3); }

        .loading-row td { text-align:center; padding:32px; color:var(--text3); font-size:11px; }
        .empty-row  td { text-align:center; padding:32px; color:var(--text3); font-size:11px; }
      `}</style>

      <div className="pg">
        {/* HEADER */}
        <div className="pg-head">
          <div>
            <div className="pg-title">Litigation Dashboard</div>
            <div className="pg-sub">Legal Affairs Department · All Courts · Live Data</div>
          </div>
          <div className="pg-actions">
            <button className="btn btn-outline">↓ Export Excel</button>
            <button className="btn btn-primary" onClick={() => window.location.href='/cases/new'}>＋ New Case</button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="kpi-row">
          {kpis.map(k => (
            <div key={k.label} className="kpi">
              <div className="kpi-bar" style={{background:k.color}}/>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{color:k.color}}>
                {loading ? '—' : k.value}
              </div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ALERTS */}
        <div className="alert-banner">
          <div className="ab-title">⏱ Hearing Alerts</div>
          <div className="ab-pills">
            {loading ? (
              <span className="ab-none">Loading alerts…</span>
            ) : upcomingAlerts.length === 0 ? (
              <span className="ab-none">No upcoming hearings in the next 7 days</span>
            ) : (
              upcomingAlerts.map(c => (
                <AlertPill
                  key={c.CaseID}
                  days={daysUntil(c.NextHearingDate)}
                  caseTitle={c.CaseTitle}
                  court={c.CourtName}
                />
              ))
            )}
          </div>
        </div>

        {/* CASE TABLE */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Case Register</div>
            <div className="tt-search">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Search by title, case no., counsel…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="tt-select" value={courtFilter} onChange={e => setCourtFilter(e.target.value)}>
              <option value="">All Courts</option>
              {courts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="filter-chips">
              <button className={`chip${filter==='all'?' on':''}`}     onClick={() => setFilter('all')}>All {!loading && stats.total}</button>
              <button className={`chip${filter==='pending'?' on':''}`}  onClick={() => setFilter('pending')}>Pending</button>
              <button className={`chip${filter==='disposed'?' on':''}`} onClick={() => setFilter('disposed')}>Disposed</button>
              <button className={`chip danger${filter==='alerts'?' on':''}`} onClick={() => setFilter('alerts')}>
                🔴 Alerts {!loading && stats.alerts}
              </button>
            </div>
          </div>

          <table className="dt">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Case No.</th>
                <th>Case Title</th>
                <th>Court</th>
                <th>Category</th>
                <th>Counsel</th>
                <th>Internal Associate</th>
                <th>Last Hearing</th>
                <th>Next Hearing</th>
                <th>Status</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={11}>Loading cases…</td></tr>
              ) : cases.length === 0 ? (
                <tr className="empty-row"><td colSpan={11}>No cases found. Add your first case using the + New Case button.</td></tr>
              ) : (
                cases.map(c => {
                  const days     = daysUntil(c.NextHearingDate);
                  const isAlert  = days <= 3;
                  return (
                    <tr key={c.CaseID} className={isAlert ? 'hl-row' : ''}>
                      <td><span className="case-id">CAS-{String(c.CaseID).padStart(4,'0')}</span></td>
                      <td style={{fontSize:'10px',color:'var(--text3)'}}>{c.CaseNumber}</td>
                      <td style={{fontWeight:600,color:'var(--text)',maxWidth:'180px'}}>{c.CaseTitle}</td>
                      <td><span className="court-tag">{c.CourtName}</span></td>
                      <td>{c.CategoryName}</td>
                      <td>{c.CounselName || '—'}</td>
                      <td>{c.InternalAssociateName || '—'}</td>
                      <td style={{fontSize:'10px',color:'var(--text3)'}}>{formatDate(c.LastHearingDate)}</td>
                      <td className={isAlert ? 'date-alert' : ''}>
                        {isAlert && '⚠ '}{formatDate(c.NextHearingDate)}
                      </td>
                      <td><span className={`status-pill ${statusClass(c.Status)}`}>● {c.Status}</span></td>
                      <td><button className="action-btn">View</button></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="table-footer">
            <div className="tf-info">
              {loading ? 'Loading…' : `Showing ${cases.length} case${cases.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
