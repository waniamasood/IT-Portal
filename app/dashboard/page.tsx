'use client';

const kpis = [
  { label:'Total Cases',      value:'284', sub:'All courts',        color:'#60a5fa' },
  { label:'Pending',          value:'189', sub:'66.5% of total',    color:'#fbbf24' },
  { label:'Disposed',         value:'95',  sub:'33.5% resolution',  color:'#4ade80' },
  { label:'Hearing Alerts',   value:'5',   sub:'Next 3 days',       color:'#f87171' },
];

const alerts = [
  { type:'critical', label:'Tomorrow — IBC-2024-041 v. FBR (Supreme Court)' },
  { type:'critical', label:'Tomorrow — GIL-2023-017 v. Landlord (High Court)' },
  { type:'warning',  label:'3 Days — NVX-2024-088 v. SSGC' },
  { type:'warning',  label:'3 Days — GPW-2022-054 v. NEPRA' },
  { type:'info',     label:'7 Days — TAX-2021-003 · FBR v. Nova Mobility' },
  { type:'info',     label:'7 Days — MIS-2023-112 · District Court' },
];

const cases = [
  { id:'CAS-2024-0084', title:'Novatex Ltd. vs FBR',          court:'High Court SHC',  cat:'Taxation',    counsel:'A. Mirza',    next:'17 Jul 2026', status:'critical', statusLabel:'High Alert' },
  { id:'CAS-2024-0079', title:'Nova Mob. vs SECP',            court:'Supreme Court',   cat:'Regulatory',  counsel:'S. Khatri',   next:'18 Jul 2026', status:'critical', statusLabel:'High Alert' },
  { id:'CAS-2024-0071', title:'GKS vs Civil Contractor',      court:'District Court',  cat:'Finance',     counsel:'R. Ahmed',    next:'24 Jul 2026', status:'warning',  statusLabel:'Pending'    },
  { id:'CAS-2024-0065', title:'Pharmnova vs DRAP',            court:'High Court SHC',  cat:'Regulatory',  counsel:'A. Mirza',    next:'31 Jul 2026', status:'warning',  statusLabel:'Pending'    },
  { id:'CAS-2023-0048', title:'Mustaqim vs Supplier',         court:'District Court',  cat:'Supply Chain',counsel:'T. Siddiqui', next:'—',            status:'success',  statusLabel:'Disposed'   },
  { id:'CAS-2023-0041', title:'Gatron Ind. vs SNGPL',         court:'High Court SHC',  cat:'Distribution',counsel:'A. Mirza',    next:'05 Aug 2026', status:'warning',  statusLabel:'Pending'    },
  { id:'CAS-2022-0033', title:'Nova Care vs Supplier',        court:'District Court',  cat:'HR',          counsel:'R. Ahmed',    next:'12 Aug 2026', status:'warning',  statusLabel:'Pending'    },
];

const categories = [
  { name:'Taxation',     pct:25 },
  { name:'Distribution', pct:20 },
  { name:'HR',           pct:15 },
  { name:'Real Estate',  pct:12 },
  { name:'Finance',      pct:10 },
  { name:'Others',       pct:18 },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
const heatRows = [
  { cat:'Taxation',    vals:[8,12,18,9,14,5,7]  },
  { cat:'Distribution',vals:[4,9,6,11,8,2,5]   },
  { cat:'HR',          vals:[2,3,7,4,5,8,4]    },
  { cat:'Real Estate', vals:[1,2,5,3,4,2,3]    },
  { cat:'Finance',     vals:[5,6,8,5,9,12,7]   },
];
const maxHeat = 18;

function heatClass(v: number) {
  const r = v / maxHeat;
  if (r === 0) return '#1a1a1a';
  if (r < 0.2)  return '#1e3a4a';
  if (r < 0.4)  return '#1a6091';
  if (r < 0.6)  return '#1976d2';
  if (r < 0.8)  return '#26A9E1';
  return '#4dd0f4';
}

const barData = [
  { yr:'2019', p:22, d:12 },
  { yr:'2020', p:30, d:18 },
  { yr:'2021', p:45, d:28 },
  { yr:'2022', p:62, d:34 },
  { yr:'2023', p:78, d:44 },
  { yr:'2024', p:95, d:55 },
  { yr:'2025', p:58, d:16, ytd:true },
];
const barMax = 95;

export default function DashboardPage() {
  return (
    <>
      <style>{`
        .pg { padding:16px 20px; background:var(--bg0); min-height:calc(100vh - 44px); }

        .pg-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:14px; }
        .pg-title { font-size:18px; font-weight:800; color:var(--text); letter-spacing:-0.02em; }
        .pg-sub   { font-size:11px; color:var(--text3); margin-top:3px; }
        .pg-actions { display:flex; gap:7px; }

        .btn {
          display:flex; align-items:center; gap:6px;
          padding:7px 14px; border-radius:7px;
          font-size:11px; font-weight:600; cursor:pointer; border:none; font-family:inherit;
          transition:all .15s;
        }
        .btn-outline { background:transparent; color:var(--text2); border:1px solid var(--border2); }
        .btn-outline:hover { border-color:var(--teal); color:var(--teal); }
        .btn-primary { background:var(--teal); color:white; }
        .btn-primary:hover { background:var(--teal2); }

        /* KPI */
        .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
        .kpi {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:10px; padding:14px 16px; position:relative; overflow:hidden;
        }
        .kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:10px 10px 0 0; }
        .kpi-label { font-size:9px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.07em; }
        .kpi-value { font-size:30px; font-weight:800; letter-spacing:-0.04em; line-height:1; margin:6px 0 3px; }
        .kpi-sub   { font-size:10px; color:var(--text3); }

        /* ALERTS */
        .alert-banner {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:10px; padding:10px 14px; margin-bottom:12px;
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        }
        .ab-title { font-size:9px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; flex-shrink:0; padding-right:10px; border-right:1px solid var(--border2); }
        .ab-pills { display:flex; gap:6px; flex-wrap:wrap; }
        .ab-pill {
          display:flex; align-items:center; gap:5px;
          padding:4px 10px; border-radius:5px; font-size:10px; font-weight:600;
          border:1px solid transparent;
        }
        .ab-pill.critical { background:rgba(220,38,38,0.12); color:#f87171; border-color:rgba(220,38,38,0.25); }
        .ab-pill.warning  { background:rgba(251,191,36,0.10); color:#fbbf24; border-color:rgba(251,191,36,0.22); }
        .ab-pill.info     { background:rgba(38,169,225,0.10); color:var(--teal); border-color:rgba(38,169,225,0.22); }
        .ab-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .critical .ab-dot { background:#ef4444; }
        .warning  .ab-dot { background:#f59e0b; }
        .info     .ab-dot { background:var(--teal); }

        /* CHARTS GRID */
        .chart-grid { display:grid; grid-template-columns:2fr 1fr; gap:10px; margin-bottom:10px; }
        .card {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:10px; overflow:hidden;
        }
        .card-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 14px; border-bottom:1px solid var(--border);
        }
        .card-title { font-size:11px; font-weight:700; color:var(--text); }
        .card-sub   { font-size:9px; color:var(--text3); margin-top:1px; }
        .card-body  { padding:14px; }
        .legend { display:flex; gap:14px; }
        .leg { display:flex; align-items:center; gap:5px; font-size:9px; color:var(--text3); }
        .leg-dot { width:8px; height:8px; border-radius:2px; }

        /* BOTTOM */
        .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }

        /* HEATMAP */
        .hm-table { width:100%; border-collapse:collapse; font-size:9px; }
        .hm-table th { color:var(--text3); font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:3px 5px; text-align:center; }
        .hm-th-label { text-align:left !important; }
        .hm-table td { padding:3px; }
        .hm-cell { height:22px; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:white; }
        .hm-row-label { font-size:9px; color:var(--text2); font-weight:600; padding:3px 8px 3px 0; white-space:nowrap; }

        /* COUNSEL */
        .counsel-row { display:flex; align-items:center; gap:9px; padding:7px 0; border-bottom:1px solid var(--border); }
        .counsel-row:last-child { border-bottom:none; }
        .c-av { width:28px; height:28px; border-radius:6px; background:var(--teal); display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:white; flex-shrink:0; }
        .c-name  { font-size:10px; font-weight:600; color:var(--text); flex:1; }
        .c-cases { font-size:9px; color:var(--text3); }
        .c-bar-wrap { width:55px; height:4px; background:var(--bg3); border-radius:2px; }
        .c-bar { height:4px; background:var(--teal); border-radius:2px; }

        /* TABLE */
        .table-card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .table-toolbar {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; border-bottom:1px solid var(--border);
          background:var(--bg3);
        }
        .tt-title { font-size:11px; font-weight:700; color:var(--text); margin-right:auto; }
        .tt-search {
          display:flex; align-items:center; gap:6px;
          background:var(--bg2); border:1px solid var(--border2);
          border-radius:6px; padding:5px 10px; font-size:10px; color:var(--text3);
        }
        .filter-chips { display:flex; gap:5px; }
        .chip {
          padding:4px 10px; border-radius:5px; font-size:9px; font-weight:700;
          border:1px solid var(--border2); background:var(--bg2); color:var(--text3); cursor:pointer;
        }
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
        .court-tag { font-size:8px; font-weight:700; padding:2px 7px; border-radius:3px; background:rgba(38,169,225,0.12); color:var(--teal); letter-spacing:.04em; }
        .status-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:4px; font-size:9px; font-weight:700; }
        .sp-critical { background:rgba(220,38,38,0.12); color:#f87171; }
        .sp-warning  { background:rgba(251,191,36,0.10); color:#fbbf24; }
        .sp-success  { background:rgba(74,222,128,0.10); color:#4ade80; }
        .date-alert  { color:#f87171; font-weight:700; }
        .date-ok     { color:var(--text2); }
        .action-btn  { padding:3px 9px; border-radius:4px; font-size:9px; font-weight:700; background:rgba(38,169,225,0.12); color:var(--teal); border:none; cursor:pointer; font-family:inherit; }
        .action-btn:hover { background:rgba(38,169,225,0.22); }

        .table-footer {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 14px; border-top:1px solid var(--border); background:var(--bg3);
        }
        .tf-info { font-size:9px; color:var(--text3); }
        .pg-btns { display:flex; gap:4px; }
        .pg-btn { padding:3px 9px; border:1px solid var(--border2); border-radius:4px; font-size:9px; color:var(--text2); background:var(--bg2); cursor:pointer; font-family:inherit; }
        .pg-btn.on { border-color:var(--teal); color:var(--teal); font-weight:700; }
      `}</style>

      <div className="pg">
        {/* PAGE HEADER */}
        <div className="pg-head">
          <div>
            <div className="pg-title">Litigation Dashboard</div>
            <div className="pg-sub">Legal Affairs Department · All Courts · FY 2025–26</div>
          </div>
          <div className="pg-actions">
            <button className="btn btn-outline">↓ Export Excel</button>
            <button className="btn btn-outline">⚙ Configure</button>
            <button className="btn btn-primary">＋ New Case</button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="kpi-row">
          {kpis.map(k => (
            <div key={k.label} className="kpi" style={{'--kpi-color':k.color} as React.CSSProperties}>
              <style>{`.kpi[style*="${k.color}"]::before { background:${k.color}; }`}</style>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{color:k.color}}>{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ALERTS */}
        <div className="alert-banner">
          <div className="ab-title">⏱ Hearing Alerts</div>
          <div className="ab-pills">
            {alerts.map((a,i) => (
              <div key={i} className={`ab-pill ${a.type}`}>
                <div className="ab-dot"/>
                {a.label}
              </div>
            ))}
          </div>
        </div>

        {/* CHARTS */}
        <div className="chart-grid">
          {/* BAR CHART */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Case Volume by Year</div>
                <div className="card-sub">Pending vs. Disposed · All Courts</div>
              </div>
              <div className="legend">
                <div className="leg"><div className="leg-dot" style={{background:'var(--teal)'}}/>Pending</div>
                <div className="leg"><div className="leg-dot" style={{background:'#60a5fa'}}/>Disposed</div>
              </div>
            </div>
            <div className="card-body">
              <svg viewBox="0 0 480 140" style={{width:'100%',overflow:'visible'}}>
                {[140,105,70,35].map((y,i) => (
                  <g key={i}>
                    <line x1="40" y1={y} x2="470" y2={y} stroke="var(--border)" strokeWidth="1"/>
                    <text x="32" y={y+4} textAnchor="end" fontSize="8" fill="var(--text3)">{(3-i)*25}</text>
                  </g>
                ))}
                {barData.map((b,i) => {
                  const x = 50 + i * 62;
                  const pH = (b.p/barMax)*110;
                  const dH = (b.d/barMax)*110;
                  return (
                    <g key={b.yr}>
                      <rect x={x} y={140-pH} width="18" height={pH} rx="2" fill="var(--teal)" opacity={b.ytd?0.5:0.85}/>
                      <rect x={x+20} y={140-dH} width="18" height={dH} rx="2" fill="#60a5fa" opacity={b.ytd?0.5:0.85}/>
                      <text x={x+18} y="155" textAnchor="middle" fontSize="8" fill="var(--text3)">{b.yr}{b.ytd?'*':''}</text>
                    </g>
                  );
                })}
                <line x1="40" y1="140" x2="470" y2="140" stroke="var(--border)" strokeWidth="1"/>
              </svg>
              <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'4px'}}>* YTD</div>
            </div>
          </div>

          {/* DONUT */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Cases by Category</div>
                <div className="card-sub">FY 2025–26</div>
              </div>
            </div>
            <div className="card-body" style={{display:'flex',alignItems:'center',gap:'16px'}}>
              <svg viewBox="0 0 120 120" width="100" height="100" style={{flexShrink:0}}>
                <circle cx="60" cy="60" r="44" fill="none" stroke="var(--bg3)" strokeWidth="20"/>
                {(() => {
                  const colors = ['var(--teal)','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
                  let offset = 0;
                  return categories.map((c,i) => {
                    const dash = (c.pct/100)*276.5;
                    const el = (
                      <circle key={c.name} cx="60" cy="60" r="44" fill="none"
                        stroke={colors[i]} strokeWidth="20"
                        strokeDasharray={`${dash} ${276.5-dash}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 60 60)"/>
                    );
                    offset += dash;
                    return el;
                  });
                })()}
                <text x="60" y="55" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text)">284</text>
                <text x="60" y="68" textAnchor="middle" fontSize="8" fill="var(--text3)">total</text>
              </svg>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                {categories.map((c,i) => {
                  const colors = ['var(--teal)','#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
                  return (
                    <div key={c.name} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'2px',background:colors[i],flexShrink:0}}/>
                      <div style={{flex:1,fontSize:'9px',color:'var(--text2)'}}>{c.name}</div>
                      <div style={{fontSize:'9px',fontWeight:700,color:'var(--text)'}}>{c.pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* HEATMAP + COUNSEL */}
        <div className="bottom-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Monthly Activity Heatmap</div>
                <div className="card-sub">Hearings per category · 2025</div>
              </div>
            </div>
            <div className="card-body">
              <table className="hm-table">
                <thead>
                  <tr>
                    <th className="hm-th-label"/>
                    {months.map(m => <th key={m}>{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heatRows.map(row => (
                    <tr key={row.cat}>
                      <td className="hm-row-label">{row.cat}</td>
                      {row.vals.map((v,i) => (
                        <td key={i}><div className="hm-cell" style={{background:heatClass(v),color:v>8?'white':'var(--text3)'}}>{v}</div></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">External Counsel</div>
                <div className="card-sub">Active cases per lawyer</div>
              </div>
            </div>
            <div className="card-body">
              {[
                {init:'AM',name:'Ayan Memon',        cases:'Supreme Court · 42 cases', pct:100},
                {init:'OS',name:'Omer Soomro & Co.',  cases:'High Court · 34 cases',    pct:81},
                {init:'AS',name:'Abid Shaban',        cases:'High Court · 28 cases',    pct:67},
                {init:'TX',name:'Taxperts',           cases:'District · 21 cases',      pct:50},
                {init:'MT',name:'Mohsin Tayebaly',    cases:'Supreme Ct · 19 cases',    pct:45},
                {init:'FG',name:'Fazle Ghani',        cases:'ISB District · 14 cases',  pct:33},
              ].map(c => (
                <div key={c.name} className="counsel-row">
                  <div className="c-av">{c.init}</div>
                  <div style={{flex:1}}>
                    <div className="c-name">{c.name}</div>
                    <div className="c-cases">{c.cases}</div>
                  </div>
                  <div className="c-bar-wrap">
                    <div className="c-bar" style={{width:`${c.pct}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CASE TABLE */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Case Register</div>
            <div className="tt-search">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search by case no., title, counsel…
            </div>
            <div className="filter-chips">
              <div className="chip on">All 284</div>
              <div className="chip">Pending</div>
              <div className="chip">Disposed</div>
              <div className="chip danger">🔴 High Alert 5</div>
            </div>
          </div>

          <table className="dt">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Case Title</th>
                <th>Court</th>
                <th>Category</th>
                <th>Counsel</th>
                <th>Next Hearing</th>
                <th>Status</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} className={c.status==='critical'?'hl-row':''}>
                  <td><span className="case-id">{c.id}</span></td>
                  <td style={{fontWeight:600,color:'var(--text)'}}>{c.title}</td>
                  <td><span className="court-tag">{c.court}</span></td>
                  <td>{c.cat}</td>
                  <td>{c.counsel}</td>
                  <td className={c.status==='critical'?'date-alert':'date-ok'}>
                    {c.status==='critical'&&'⚠ '}{c.next}
                  </td>
                  <td>
                    <span className={`status-pill sp-${c.status}`}>● {c.statusLabel}</span>
                  </td>
                  <td><button className="action-btn">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">
            <div className="tf-info">Showing 7 of 284 cases</div>
            <div className="pg-btns">
              <button className="pg-btn">‹ Prev</button>
              <button className="pg-btn on">1</button>
              <button className="pg-btn">2</button>
              <button className="pg-btn">3</button>
              <button className="pg-btn">Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
