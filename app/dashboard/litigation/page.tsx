'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ConfigProvider, theme as antTheme, Drawer, Form, Input, Select,
  Button, Switch, message, Tag, Divider, Tooltip, Spin, InputNumber
} from 'antd';
import axios from 'axios';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
const DataGrid     = dynamic(() => import('@/app/components/DataGrid'), { ssr: false });

/* ─────────── helpers ─────────── */
const fmt = (d?: string|null) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtPKR = (n?: number|null) => n ? `₨${n.toLocaleString()}` : '—';
const daysUntil = (d?: string|null) => d ? Math.ceil((new Date(d).getTime()-Date.now())/(1000*86400)) : 9999;

/* ─────────── chart options ─────────── */
function barOption(months:string[],pending:number[],disposed:number[]){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    legend:{textStyle:{color:'#6b7280'},data:['Pending','Disposed'],bottom:0},
    grid:{left:10,right:10,top:10,bottom:30,containLabel:true},
    xAxis:{type:'category',data:months,axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10}},
    yAxis:{type:'value',axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10},splitLine:{lineStyle:{color:'#1a1a3a'}}},
    series:[
      {name:'Pending',type:'bar',stack:'total',data:pending,itemStyle:{color:'#26A9E1',borderRadius:[0,0,0,0]}},
      {name:'Disposed',type:'bar',stack:'total',data:disposed,itemStyle:{color:'#1D1C55',borderRadius:[3,3,0,0]}},
    ],
  };
}

function donutOption(pending:number,disposed:number){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'item',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    legend:{orient:'vertical',left:'left',textStyle:{color:'#6b7280',fontSize:11}},
    series:[{
      type:'pie',radius:['48%','72%'],
      data:[
        {name:'Pending',value:pending,itemStyle:{color:'#26A9E1'}},
        {name:'Disposed',value:disposed,itemStyle:{color:'#4ade80'}},
      ],
      label:{color:'#dde1e9',fontSize:11},
      emphasis:{itemStyle:{shadowBlur:10,shadowColor:'rgba(38,169,225,.4)'}},
    }],
  };
}

function lineOption(labels:string[],values:number[]){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    grid:{left:10,right:10,top:10,bottom:20,containLabel:true},
    xAxis:{type:'category',data:labels,axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10}},
    yAxis:{type:'value',axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10},splitLine:{lineStyle:{color:'#1a1a3a'}}},
    series:[{
      type:'line',data:values,smooth:true,
      itemStyle:{color:'#26A9E1'},
      areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(38,169,225,.25)'},{offset:1,color:'rgba(38,169,225,.01)'}]}},
      lineStyle:{width:2,color:'#26A9E1'},
    }],
  };
}

/* ─────────── column defs ─────────── */
const COL_DEFS = [
  { field:'CaseNumber',    headerName:'Case No.',       width:120, pinned:'left' as const, cellStyle:(p:any)=>({color:p.data.Status==='Disposed'?'#4a5568':'#26A9E1',fontWeight:600}) },
  { field:'CaseTitle',     headerName:'Case Title',     flex:2, minWidth:200, tooltipField:'CaseTitle' },
  { field:'CourtName',     headerName:'Court',          width:175 },
  { field:'CategoryName',  headerName:'Category',       width:155 },
  { field:'Status',        headerName:'Status',         width:105,
    cellStyle:(p:any)=>({
      color: p.value==='Disposed'?'#4ade80': p.value==='Pending'?'#fb923c':'#dde1e9',
      fontWeight:600,fontSize:'11px'
    }),
  },
  { field:'ByAgainst',     headerName:'By/Against',     width:100 },
  { field:'ExternalCounselName', headerName:'Ext. Counsel', width:155 },
  { field:'NextHearingDate', headerName:'Next Hearing', width:130,
    valueFormatter:(p:any)=>fmt(p.value),
    cellStyle:(p:any)=>{
      const d=daysUntil(p.value);
      return { color:d<=1?'#ef4444':d<=3?'#fb923c':d<=7?'#facc15':'#dde1e9', fontWeight:d<=7?700:400 };
    },
  },
  { field:'LastHearingDate', headerName:'Last Hearing', width:130, valueFormatter:(p:any)=>fmt(p.value) },
  { field:'AmountInvolved',  headerName:'Amount (PKR)', width:150, valueFormatter:(p:any)=>fmtPKR(p.value) },
  { field:'ProfessionalCost',headerName:'Prof. Cost',   width:130, valueFormatter:(p:any)=>fmtPKR(p.value) },
];

const DEFAULT_COL = { sortable:true, filter:true, resizable:true, suppressHeaderMenuButton:true };

/* ─────────── MAIN COMPONENT ─────────── */
export default function LitigationPage() {
  const [cases,      setCases]      = useState<any[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [monthly,    setMonthly]    = useState<any[]>([]);
  const [lookups,    setLookups]    = useState<any>({courts:[],categories:[],externalLawyers:[],internalLawyers:[]});
  const [loading,    setLoading]    = useState(true);
  const [courtF,     setCourtF]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [categoryF,  setCategoryF]  = useState('');
  const [search,     setSearch]     = useState('');
  const [newOpen,     setNewOpen]    = useState(false);
  const [editMode,    setEditMode]   = useState(false);
  const [detailCase,  setDetailCase] = useState<any>(null);
  const [saving,      setSaving]     = useState(false);
  const [form]                       = Form.useForm();
  const [hasStay,     setHasStay]    = useState(false);
  const [attachments, setAttachments]= useState<any[]>([]);
  const [uploading,   setUploading]  = useState<string|null>(null);
  const searchRef                    = useRef<ReturnType<typeof setTimeout>|null>(null);

  /* fetch cases */
  const fetchCases = useCallback(() => {
    setLoading(true);
    const p: Record<string,string> = {};
    if (courtF)    p.court    = courtF;
    if (statusF)   p.status   = statusF;
    if (categoryF) p.category = categoryF;
    if (search)    p.search   = search;
    axios.get('/api/cases', {params:p})
      .then(r => setCases(r.data.cases ?? []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [courtF, statusF, categoryF, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  useEffect(() => {
    axios.get('/api/dashboard/litigation-stats').then(r => setStats(r.data)).catch(()=>{});
    axios.get('/api/dashboard/litigation-monthly').then(r => setMonthly(r.data.data ?? [])).catch(()=>{});
    axios.get('/api/lookups').then(r => {
      if (r.data.courts) setLookups(r.data);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!detailCase) { setAttachments([]); return; }
    axios.get(`/api/cases/${detailCase.CaseID}/attachments`)
      .then(r => setAttachments(r.data.attachments ?? []))
      .catch(() => setAttachments([]));
  }, [detailCase]);

  /* chart data */
  const months   = monthly.map((m:any) => m.month);
  const mPending = monthly.map((m:any) => m.pending ?? 0);
  const mDisposed= monthly.map((m:any) => m.disposed ?? 0);
  const yearMap: Record<string,number> = {};
  monthly.forEach((m:any) => { const y = String(m.yr); yearMap[y] = (yearMap[y]||0) + (m.total||0); });
  const years  = Object.keys(yearMap).sort();
  const yCounts= years.map(y => yearMap[y]);

  /* upcoming hearings */
  const alertCases = cases.filter(c => {
    const d = daysUntil(c.NextHearingDate);
    return d >= 0 && d <= 7;
  }).sort((a,b) => daysUntil(a.NextHearingDate)-daysUntil(b.NextHearingDate));

  /* open edit form pre-filled */
  async function handleEditOpen() {
    if (!detailCase) return;
    try {
      const { data } = await axios.get(`/api/cases/${detailCase.CaseID}`);
      const c = data.case;
      const toDate = (d: any) => d ? new Date(d).toISOString().split('T')[0] : undefined;
      form.setFieldsValue({
        caseTitle:           c.CaseTitle,
        caseNumber:          c.CaseNumber,
        courtId:             c.CourtID,
        categoryId:          c.CategoryID,
        externalCounselId:   c.ExternalCounselID,
        internalAssociateId: c.InternalAssociateID,
        byAgainst:           c.ByAgainst,
        dateOfInstitution:   toDate(c.DateOfInstitution),
        status:              c.Status,
        hearingStatus:       c.HearingStatus,
        lastHearingDate:     toDate(c.LastHearingDate),
        nextHearingDate:     toDate(c.NextHearingDate),
        amountInvolved:      c.AmountInvolved  ? Number(c.AmountInvolved)  : undefined,
        professionalCost:    c.ProfessionalCost? Number(c.ProfessionalCost): undefined,
        interimStayOrder:    c.InterimStayOrder,
        dateOfStayOrder:     toDate(c.DateOfStayOrder),
        dateOfDisposal:      toDate(c.DateOfDisposal),
        summary:             c.Summary,
        remarks:             c.Remarks,
      });
      setHasStay(!!c.InterimStayOrder);
      setEditMode(true);
      setNewOpen(true);
    } catch {
      message.error('Failed to load case data');
    }
  }

  /* upload attachment */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file || !detailCase) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', docType);
    setUploading(docType);
    try {
      await axios.post(`/api/cases/${detailCase.CaseID}/attachments`, fd);
      message.success(`${docType} uploaded`);
      const res = await axios.get(`/api/cases/${detailCase.CaseID}/attachments`);
      setAttachments(res.data.attachments ?? []);
    } catch (err: any) {
      message.error(err.response?.data?.error ?? 'Upload failed — check Google Drive is configured');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  }

  /* submit new or edited case */
  async function handleSubmit() {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = { ...vals, interimStayOrder: vals.interimStayOrder ?? false };
      if (editMode && detailCase) {
        await axios.put(`/api/cases/${detailCase.CaseID}`, payload);
        message.success('Case updated successfully');
        setDetailCase((prev: any) => prev ? { ...prev, ...payload } : prev);
      } else {
        await axios.post('/api/cases', payload);
        message.success('Case registered successfully');
      }
      setNewOpen(false);
      setEditMode(false);
      form.resetFields();
      setHasStay(false);
      fetchCases();
    } catch(e: any) {
      if (e?.response) message.error(editMode ? 'Failed to update case' : 'Failed to save case');
    } finally { setSaving(false); }
  }

  /* search debounce */
  function handleSearch(v: string) {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearch(v), 400);
  }

  /* row style */
  const rowStyle = (p: any) => p.data.Status === 'Disposed' ? { opacity:'0.5' } : undefined;

  return (
    <ConfigProvider theme={{algorithm:antTheme.darkAlgorithm, token:{colorPrimary:'#26A9E1',colorBgBase:'#08080f',colorBgContainer:'#12122a',colorBorder:'#26264a',borderRadius:6,fontFamily:'Inter,Segoe UI,system-ui,sans-serif'}}}>
      <style>{`
        .lit-root{padding:20px;min-height:100%;display:flex;flex-direction:column;gap:16px}

        /* KPI */
        .kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .kpi{
          background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;
          padding:16px;position:relative;overflow:hidden;transition:border-color .2s;
        }
        .kpi:hover{border-color:#26264a}
        .kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--kpi-color,#26A9E1)}
        .kpi-val{font-size:28px;font-weight:800;color:var(--kpi-color,#dde1e9);line-height:1;margin-bottom:4px}
        .kpi-lbl{font-size:10.5px;color:#4a5568;font-weight:500}
        .kpi-sub{font-size:9.5px;color:#374151;margin-top:2px}

        /* ALERTS */
        .alerts-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px}
        .alerts-title{font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:6px}
        .alert-item{
          display:flex;align-items:center;gap:10px;padding:8px 10px;
          border-radius:7px;margin-bottom:6px;border:1px solid transparent;
        }
        .alert-item.green{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.15);color:#4ade80}
        .alert-item.amber{background:rgba(251,146,60,.06);border-color:rgba(251,146,60,.15);color:#fb923c}
        .alert-item.red{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2);color:#ef4444}
        .alert-case-title{font-size:11.5px;color:#c9d1db;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .alert-days{font-size:10px;font-weight:700;white-space:nowrap}
        .alert-court{font-size:10px;color:#4a5568}

        /* CHARTS */
        .charts-row{display:grid;grid-template-columns:1fr 0.65fr;gap:12px}
        .charts-row-2{display:grid;grid-template-columns:1fr;gap:12px}
        .chart-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px}
        .chart-title{font-size:11.5px;font-weight:600;color:#94a3b8;margin-bottom:8px}

        /* CONTROLS */
        .controls-bar{
          display:flex;align-items:center;gap:10px;flex-wrap:wrap;
          background:#0a0a18;border:1px solid #1e1e3a;border-radius:10px;padding:12px 16px;
        }
        .ctrl-search{
          flex:1;min-width:200px;padding:8px 12px;
          background:#12122a;border:1px solid #26264a;border-radius:6px;
          color:#dde1e9;font-size:12px;outline:none;
        }
        .ctrl-search::placeholder{color:#4a5568}
        .ctrl-search:focus{border-color:#26A9E1}
        .ctrl-select{
          padding:7px 12px;background:#12122a;border:1px solid #26264a;
          border-radius:6px;color:#dde1e9;font-size:12px;cursor:pointer;outline:none;
        }
        .ctrl-select:focus{border-color:#26A9E1}
        .ctrl-select option{background:#12122a}
        .ctrl-btn{
          padding:7px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
          border:none;transition:all .15s;
        }
        .ctrl-btn-primary{background:#26A9E1;color:#fff}
        .ctrl-btn-primary:hover{background:#1a8fc4}
        .ctrl-btn-ghost{background:#1a1a3a;color:#94a3b8;border:1px solid #26264a}
        .ctrl-btn-ghost:hover{border-color:#26A9E1;color:#26A9E1}

        /* TABLE */
        .table-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;overflow:hidden;flex:1;min-height:400px}
        .table-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1e1e3a}
        .table-hd-title{font-size:12px;font-weight:600;color:#94a3b8}
        .table-count{font-size:11px;color:#4a5568}

        /* AG GRID HEADER OVERRIDES */
        .portal-grid-wrapper .ag-header-cell-label{color:#94a3b8;font-size:11px;font-weight:600}

        /* DETAIL DRAWER */
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .detail-field{background:#12122a;border-radius:7px;padding:10px 12px}
        .detail-lbl{font-size:9.5px;color:#4a5568;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
        .detail-val{font-size:12.5px;color:#dde1e9;font-weight:500}
        .doc-slots{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
        .doc-slot{
          background:#12122a;border:1px dashed #26264a;border-radius:7px;padding:12px;
          display:flex;align-items:center;gap:8px;cursor:pointer;transition:border-color .15s;
        }
        .doc-slot:hover{border-color:#26A9E1}
        .doc-slot-name{font-size:11px;color:#6b7280;flex:1}
        .doc-slot-btn{font-size:10px;color:#26A9E1;border:1px solid #26264a;border-radius:4px;padding:2px 8px;cursor:pointer;background:none}
      `}</style>

      <div className="lit-root">

        {/* ── KPI CARDS ── */}
        <div className="kpi-row">
          {[
            { label:'Total Cases',        val:stats?.total             ?? '—', color:'#26A9E1', sub:'All registered cases' },
            { label:'Pending',            val:stats?.pending           ?? '—', color:'#fb923c', sub:'Active proceedings' },
            { label:'Disposed',           val:stats?.disposed          ?? '—', color:'#4ade80', sub:'Closed matters' },
            { label:'Hearings (7 days)',   val:stats?.hearingsUpcoming  ?? '—', color:'#facc15', sub:'Upcoming dates' },
            { label:'Critical (3 days)',   val:stats?.hearingsCritical  ?? '—', color:'#ef4444', sub:'Immediate attention' },
          ].map(k => (
            <div key={k.label} className="kpi" style={{'--kpi-color':k.color} as React.CSSProperties}>
              <div className="kpi-val">{k.val}</div>
              <div className="kpi-lbl">{k.label}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── ALERTS + DONUT ── */}
        <div className="charts-row">
          <div className="alerts-box">
            <div className="alerts-title">🔔 Upcoming Hearings — Next 7 Days</div>
            {alertCases.length === 0 && <div style={{color:'#4a5568',fontSize:'12px',textAlign:'center',padding:'20px 0'}}>No upcoming hearings in next 7 days</div>}
            {alertCases.map((c:any) => {
              const d = daysUntil(c.NextHearingDate);
              const cls = d<=1?'red':d<=3?'amber':'green';
              return (
                <div key={c.CaseID} className={`alert-item ${cls}`}>
                  <span style={{fontSize:'16px'}}>{d<=1?'🔴':d<=3?'🟠':'🟢'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="alert-case-title">{c.CaseTitle}</div>
                    <div className="alert-court">{c.CourtName} · {c.CaseNumber}</div>
                  </div>
                  <div className="alert-days">{d===0?'TODAY':d===1?'Tomorrow':`${d}d`}</div>
                </div>
              );
            })}
          </div>

          <div className="chart-box">
            <div className="chart-title">Status Distribution</div>
            {stats ? (
              <ReactECharts option={donutOption(stats.pending||0, stats.disposed||0)} style={{height:'200px'}} />
            ) : (
              <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin /></div>
            )}
          </div>
        </div>

        {/* ── MONTHLY BAR CHART ── */}
        <div className="chart-box">
          <div className="chart-title">Monthly Case Registration — Last 24 Months</div>
          {monthly.length > 0 ? (
            <ReactECharts option={barOption(months,mPending,mDisposed)} style={{height:'200px'}} />
          ) : (
            <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin /></div>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <div className="controls-bar">
          <input
            className="ctrl-search" placeholder="Search case title, number, counsel…"
            onChange={e => handleSearch(e.target.value)}
          />
          <select className="ctrl-select" value={courtF} onChange={e => setCourtF(e.target.value)}>
            <option value="">All Courts</option>
            {lookups.courts.map((c:any) => <option key={c.CourtID} value={c.CourtName}>{c.CourtName}</option>)}
          </select>
          <select className="ctrl-select" value={categoryF} onChange={e => setCategoryF(e.target.value)}>
            <option value="">All Categories</option>
            {lookups.categories.map((c:any) => <option key={c.CategoryID} value={c.CategoryName}>{c.CategoryName}</option>)}
          </select>
          <select className="ctrl-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Disposed">Disposed</option>
          </select>
          <button className="ctrl-btn ctrl-btn-ghost" onClick={() => { setCourtF(''); setStatusF(''); setCategoryF(''); setSearch(''); }}>Reset</button>
          <button className="ctrl-btn ctrl-btn-primary" onClick={() => setNewOpen(true)}>+ New Case</button>
        </div>

        {/* ── AG GRID TABLE ── */}
        <div className="table-box">
          <div className="table-hd">
            <span className="table-hd-title">⚖ All Cases</span>
            <span className="table-count">{loading ? 'Loading…' : `${cases.length} records`}</span>
          </div>
          <div className="portal-grid-wrapper" style={{height:'calc(100vh - 600px)',minHeight:'300px',width:'100%'}}>
            <DataGrid
              rowData={cases}
              columnDefs={COL_DEFS}
              defaultColDef={DEFAULT_COL}
              getRowStyle={rowStyle}
              onRowClicked={(e:any) => setDetailCase(e.data)}
              rowSelection="single"
              pagination
              paginationPageSize={25}
              paginationPageSizeSelector={[25, 50, 100]}
            />
          </div>
        </div>

      </div>

      {/* ── NEW / EDIT CASE DRAWER ── */}
      <Drawer
        title={<span style={{color:'#dde1e9',fontWeight:700}}>{editMode ? `Edit Case — ${detailCase?.CaseNumber}` : 'New Case Registration'}</span>}
        open={newOpen}
        onClose={() => { setNewOpen(false); setEditMode(false); form.resetFields(); setHasStay(false); }}
        width={750}
        styles={{body:{padding:'20px',background:'#0e0e1e'}, header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
        footer={
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
            <Button onClick={() => { setNewOpen(false); setEditMode(false); form.resetFields(); setHasStay(false); }}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSubmit}>{editMode ? 'Save Changes' : 'Register Case'}</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <Form.Item name="caseTitle" label="Case Title" rules={[{required:true,message:'Required'}]} style={{gridColumn:'1/-1'}}>
              <Input placeholder="e.g. Novatex vs NEPRA" />
            </Form.Item>
            <Form.Item name="caseNumber" label="Case Number" rules={[{required:true,message:'Required'}]}>
              <Input placeholder="e.g. SC-001/2024" />
            </Form.Item>
            <Form.Item name="courtId" label="Court" rules={[{required:true,message:'Required'}]}>
              <Select placeholder="Select court" options={lookups.courts.map((c:any)=>({value:c.CourtID,label:c.CourtName}))} />
            </Form.Item>
            <Form.Item name="categoryId" label="Category" rules={[{required:true,message:'Required'}]}>
              <Select placeholder="Select category" options={lookups.categories.map((c:any)=>({value:c.CategoryID,label:c.CategoryName}))} />
            </Form.Item>
            <Form.Item name="byAgainst" label="By / Against">
              <Select options={[{value:'By',label:'By (we filed)'},{value:'Against',label:'Against (filed on us)'}]} />
            </Form.Item>
            <Form.Item name="externalCounselId" label="External Counsel">
              <Select placeholder="Select counsel" allowClear options={lookups.externalLawyers.map((l:any)=>({value:l.LawyerID,label:l.LawyerName+(l.FirmName?` (${l.FirmName})`:'')}))}/>
            </Form.Item>
            <Form.Item name="internalAssociateId" label="Internal Associate">
              <Select placeholder="Select associate" allowClear options={lookups.internalLawyers.map((l:any)=>({value:l.LawyerID,label:l.LawyerName}))}/>
            </Form.Item>
            <Form.Item name="dateOfInstitution" label="Date of Institution">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{required:true}]} initialValue="Pending">
              <Select options={[{value:'Pending',label:'Pending'},{value:'Disposed',label:'Disposed'}]}/>
            </Form.Item>
            <Form.Item name="hearingStatus" label="Hearing Status">
              <Input placeholder="e.g. Next date fixed" />
            </Form.Item>
            <Form.Item name="lastHearingDate" label="Last Hearing Date">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="nextHearingDate" label="Next Hearing Date">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="amountInvolved" label="Amount Involved (PKR)">
              <InputNumber placeholder="e.g. 5000000" style={{width:'100%'}} min={0}/>
            </Form.Item>
            <Form.Item name="professionalCost" label="Professional Cost (PKR)">
              <InputNumber placeholder="e.g. 150000" style={{width:'100%'}} min={0}/>
            </Form.Item>
            <Form.Item name="interimStayOrder" label="Interim / Stay Order" valuePropName="checked" style={{gridColumn:'1/-1'}}>
              <Switch onChange={setHasStay} checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
            {hasStay && (
              <Form.Item name="dateOfStayOrder" label="Date of Stay Order">
                <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
              </Form.Item>
            )}
            <Form.Item name="dateOfDisposal" label="Date of Disposal">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="summary" label="Case Summary" style={{gridColumn:'1/-1'}}>
              <Input.TextArea rows={3} placeholder="Brief summary of the case" />
            </Form.Item>
            <Form.Item name="remarks" label="Remarks" style={{gridColumn:'1/-1'}}>
              <Input.TextArea rows={2} placeholder="Any additional notes" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      {/* ── CASE DETAIL DRAWER ── */}
      <Drawer
        title={
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingRight:'8px'}}>
            <span style={{color:'#dde1e9',fontWeight:700}}>Case Detail — {detailCase?.CaseNumber}</span>
            <Button size="small" onClick={handleEditOpen} style={{fontSize:'12px',background:'#1a1a3a',borderColor:'#26264a',color:'#94a3b8'}}>✏ Edit</Button>
          </div>
        }
        open={!!detailCase}
        onClose={() => setDetailCase(null)}
        width={780}
        styles={{body:{padding:'20px',background:'#0e0e1e'}, header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
      >
        {detailCase && (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {/* STATUS BANNER */}
            <div style={{
              background: detailCase.Status==='Disposed'?'rgba(74,222,128,.08)':'rgba(251,146,60,.08)',
              border:`1px solid ${detailCase.Status==='Disposed'?'rgba(74,222,128,.2)':'rgba(251,146,60,.2)'}`,
              borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',gap:'10px'
            }}>
              <span style={{fontSize:'18px'}}>{detailCase.Status==='Disposed'?'✅':'⏳'}</span>
              <div>
                <div style={{fontWeight:700,color:detailCase.Status==='Disposed'?'#4ade80':'#fb923c'}}>{detailCase.Status}</div>
                <div style={{fontSize:'11px',color:'#4a5568'}}>{detailCase.HearingStatus || 'No hearing status'}</div>
              </div>
              {detailCase.InterimStayOrder && <span style={{marginLeft:'auto',background:'rgba(239,68,68,.15)',color:'#ef4444',padding:'2px 10px',borderRadius:20,fontSize:'11px',fontWeight:600}}>🔒 Stay Order Active</span>}
            </div>

            {/* FIELDS */}
            <div className="detail-grid">
              <div className="detail-field" style={{gridColumn:'1/-1'}}>
                <div className="detail-lbl">Case Title</div>
                <div className="detail-val" style={{fontSize:'14px',fontWeight:600}}>{detailCase.CaseTitle}</div>
              </div>
              {[
                ['Case Number',detailCase.CaseNumber],
                ['Court',detailCase.CourtName||'—'],
                ['Category',detailCase.CategoryName||'—'],
                ['By / Against',detailCase.ByAgainst||'—'],
                ['External Counsel',detailCase.ExternalCounselName||'—'],
                ['Internal Associate',detailCase.InternalAssociateName||'—'],
                ['Date of Institution',fmt(detailCase.DateOfInstitution)],
                ['Last Hearing',fmt(detailCase.LastHearingDate)],
                ['Next Hearing',fmt(detailCase.NextHearingDate)],
                ['Amount Involved',fmtPKR(detailCase.AmountInvolved)],
                ['Professional Cost',fmtPKR(detailCase.ProfessionalCost)],
                ['Date of Disposal',fmt(detailCase.DateOfDisposal)],
              ].map(([l,v]) => (
                <div key={l} className="detail-field">
                  <div className="detail-lbl">{l}</div>
                  <div className="detail-val">{v}</div>
                </div>
              ))}
              {detailCase.Remarks && (
                <div className="detail-field" style={{gridColumn:'1/-1'}}>
                  <div className="detail-lbl">Remarks</div>
                  <div className="detail-val">{detailCase.Remarks}</div>
                </div>
              )}
            </div>

            <Divider style={{borderColor:'#1e1e3a',margin:'4px 0'}} />

            {/* DOCUMENT ATTACHMENTS */}
            <div>
              <div style={{fontSize:'12px',fontWeight:600,color:'#94a3b8',marginBottom:'10px'}}>📎 Document Attachments</div>
              <div className="doc-slots">
                {['Brief Summary','Plaint / Petition','Written Statement','Counter Affidavit','Para-wise Comments','CMA','Court Orders','Annexures'].map(slot => {
                  const existing = attachments.find(a => a.DocumentType === slot);
                  const busy = uploading === slot;
                  return (
                    <div key={slot} className="doc-slot">
                      <span style={{fontSize:'16px'}}>{existing ? '✅' : '📄'}</span>
                      <span className="doc-slot-name" style={{color: existing ? '#4ade80' : '#6b7280'}}>{slot}</span>
                      {existing && (
                        <a href={existing.DriveFileLink} target="_blank" rel="noreferrer"
                          className="doc-slot-btn" style={{color:'#4ade80',borderColor:'rgba(74,222,128,.4)',textDecoration:'none',marginRight:'4px'}}>
                          View
                        </a>
                      )}
                      <Tooltip title={existing ? 'Replace file' : 'Upload to Google Drive'}>
                        <label className="doc-slot-btn" style={{cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1}}>
                          {busy ? '…' : existing ? '↺' : '↑ Upload'}
                          <input type="file" style={{display:'none'}} disabled={busy}
                            onChange={e => handleUpload(e, slot)} />
                        </label>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ConfigProvider>
  );
}
