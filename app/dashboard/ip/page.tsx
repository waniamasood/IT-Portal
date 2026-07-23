'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ConfigProvider, theme as antTheme, Drawer, Form, Input,
  Select, Button, message, Divider, Tooltip, Spin, InputNumber
} from 'antd';
import axios from 'axios';

import { ipDarkTheme } from '@/app/components/DataGrid';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
const DataGrid     = dynamic(() => import('@/app/components/DataGrid'), { ssr: false });

const fmt    = (d?: string|null) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const fmtPKR = (n?: number|null) => n ? `₨${n.toLocaleString()}` : '—';
const daysTo = (d?: string|null) => d ? Math.ceil((new Date(d).getTime()-Date.now())/(1000*86400)) : 9999;

function typeDonut(tm:number,pat:number,copy:number){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'item',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    legend:{orient:'vertical',left:'left',textStyle:{color:'#6b7280',fontSize:11}},
    series:[{
      type:'pie',radius:['48%','72%'],
      data:[
        {name:'Trademark',value:tm,  itemStyle:{color:'#26A9E1'}},
        {name:'Patent',   value:pat, itemStyle:{color:'#a78bfa'}},
        {name:'Copyright',value:copy,itemStyle:{color:'#fb923c'}},
      ],
      label:{color:'#dde1e9',fontSize:11},
    }],
  };
}

function statusLine(labels:string[],values:number[]){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    grid:{left:10,right:10,top:10,bottom:20,containLabel:true},
    xAxis:{type:'category',data:labels,axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10}},
    yAxis:{type:'value',axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10},splitLine:{lineStyle:{color:'#1a1a3a'}}},
    series:[{
      type:'line',data:values,smooth:true,
      itemStyle:{color:'#a78bfa'},
      areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(167,139,250,.25)'},{offset:1,color:'rgba(167,139,250,.01)'}]}},
      lineStyle:{width:2,color:'#a78bfa'},
    }],
  };
}

const COMPANIES_14 = [
  'Novatex Limited','Gatron Industries Limited','Mustaqim Dyeing','Nova Mobility',
  'Pharmnova','Krystalite','G-pac','Krystopac','G&T','G&T Global','Nova Care','Dvago','Gatronova','Gatro Power'
];

const COL_DEFS = [
  { field:'IPID',     headerName:'ID',       width:70, pinned:'left' as const, cellStyle:{color:'#a78bfa',fontWeight:600} },
  { field:'IPTitle',  headerName:'IP Title', flex:2, minWidth:180, tooltipField:'IPTitle' },
  { field:'CompanyName', headerName:'Company', width:175 },
  { field:'Category', headerName:'Type',     width:110,
    cellStyle:(p:any)=>({color:p.value==='Trademark'?'#26A9E1':p.value==='Patent'?'#a78bfa':'#fb923c',fontWeight:600,fontSize:'11px'})
  },
  { field:'Status',   headerName:'Status',  width:100,
    cellStyle:(p:any)=>({color:p.value==='Active'?'#4ade80':'#64748b',fontWeight:600,fontSize:'11px'})
  },
  { field:'ExternalCounselName',   headerName:'Ext. Counsel',  width:155 },
  { field:'InternalAssociateName', headerName:'Int. Associate', width:155 },
  { field:'DateOfIssuance', headerName:'Issued',     width:120, valueFormatter:(p:any)=>fmt(p.value) },
  { field:'DateOfExpiry',   headerName:'Expires',    width:130,
    valueFormatter:(p:any)=>fmt(p.value),
    cellStyle:(p:any)=>{
      const d=daysTo(p.value);
      return {color:d<=30?'#ef4444':d<=90?'#fb923c':'#dde1e9',fontWeight:d<=90?700:400};
    }
  },
  { field:'ProfessionalFees', headerName:'Prof. Fees', width:130, valueFormatter:(p:any)=>fmtPKR(p.value) },
  { field:'Remarks', headerName:'Remarks', width:200, tooltipField:'Remarks' },
];

const DEFAULT_COL = { sortable:true, filter:true, resizable:true, suppressHeaderMenuButton:true };

export default function IPPage() {
  const searchParams = useSearchParams();
  const [records,    setRecords]   = useState<any[]>([]);
  const [stats,      setStats]     = useState<any>(null);
  const [monthly,    setMonthly]   = useState<any[]>([]);
  const [lookups,    setLookups]   = useState<any>({companies:[],externalLawyers:[],internalLawyers:[]});
  const [loading,    setLoading]   = useState(true);
  const [companyF,   setCompanyF]  = useState(searchParams.get('company')  ?? '');
  const [categoryF,  setCategoryF] = useState(searchParams.get('category') ?? '');
  const [statusF,    setStatusF]   = useState(searchParams.get('status')   ?? '');
  const [search,     setSearch]    = useState('');
  const [newOpen,     setNewOpen]   = useState(false);
  const [editMode,    setEditMode]  = useState(false);
  const [detail,      setDetail]    = useState<any>(null);
  const [saving,      setSaving]    = useState(false);
  const [form]                      = Form.useForm();
  const [attachments, setAttachments]= useState<any[]>([]);
  const [uploading,   setUploading] = useState<string|null>(null);
  const searchRef                   = useRef<ReturnType<typeof setTimeout>|null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    const p: Record<string,string> = {};
    if (companyF)  p.company  = companyF;
    if (categoryF) p.category = categoryF;
    if (statusF)   p.status   = statusF;
    if (search)    p.search   = search;
    axios.get('/api/ip', {params:p})
      .then(r => setRecords(r.data.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [companyF, categoryF, statusF, search]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    axios.get('/api/dashboard/ip-stats').then(r => setStats(r.data)).catch(()=>{});
    axios.get('/api/dashboard/ip-monthly').then(r => setMonthly(r.data.data ?? [])).catch(()=>{});
    axios.get('/api/lookups').then(r => { if(r.data.courts) setLookups(r.data); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!detail) { setAttachments([]); return; }
    axios.get(`/api/ip/${detail.IPID}/attachments`)
      .then(r => setAttachments(r.data.attachments ?? []))
      .catch(() => setAttachments([]));
  }, [detail]);

  const months  = monthly.map((m:any) => m.month);
  const mCounts = monthly.map((m:any) => m.total ?? 0);

  const expiring = records.filter(r => {
    const d = daysTo(r.DateOfExpiry);
    return d >= 0 && d <= 90 && r.Status === 'Active';
  }).sort((a,b) => daysTo(a.DateOfExpiry)-daysTo(b.DateOfExpiry));

  async function handleEditOpen() {
    if (!detail) return;
    try {
      const { data } = await axios.get(`/api/ip/${detail.IPID}`);
      const r = data.record;
      const toDate = (d: any) => d ? new Date(d).toISOString().split('T')[0] : undefined;
      form.setFieldsValue({
        ipTitle:             r.IPTitle,
        companyId:           r.CompanyID,
        category:            r.Category,
        externalCounselId:   r.ExternalCounselID,
        internalAssociateId: r.InternalAssociateID,
        status:              r.Status,
        professionalFees:    r.ProfessionalFees ? Number(r.ProfessionalFees) : undefined,
        effectiveDate:       toDate(r.EffectiveDate),
        dateOfIssuance:      toDate(r.DateOfIssuance),
        dateOfExpiry:        toDate(r.DateOfExpiry),
        remarks:             r.Remarks,
      });
      setEditMode(true);
      setNewOpen(true);
    } catch {
      message.error('Failed to load IP record data');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file || !detail) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', docType);
    setUploading(docType);
    try {
      await axios.post(`/api/ip/${detail.IPID}/attachments`, fd);
      message.success(`${docType} uploaded`);
      const res = await axios.get(`/api/ip/${detail.IPID}/attachments`);
      setAttachments(res.data.attachments ?? []);
    } catch (err: any) {
      message.error(err.response?.data?.error ?? 'Upload failed — check Google Drive is configured');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  }

  async function handleSubmit() {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (editMode && detail) {
        await axios.put(`/api/ip/${detail.IPID}`, vals);
        message.success('IP record updated successfully');
      } else {
        await axios.post('/api/ip', vals);
        message.success('IP record registered successfully');
      }
      setNewOpen(false);
      setEditMode(false);
      form.resetFields();
      fetchRecords();
    } catch(e:any) {
      if (e?.response) message.error(editMode ? 'Failed to update IP record' : 'Failed to save IP record');
    } finally { setSaving(false); }
  }

  function handleSearch(v:string) {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearch(v), 400);
  }

  const rowStyle = (p:any) => p.data.Status === 'Expired' ? {opacity:'0.5'} : undefined;

  return (
    <ConfigProvider theme={{algorithm:antTheme.darkAlgorithm,token:{colorPrimary:'#a78bfa',colorBgBase:'#08080f',colorBgContainer:'#12122a',colorBorder:'#26264a',borderRadius:6,fontFamily:'Inter,Segoe UI,system-ui,sans-serif'}}}>
      <style>{`
        .ip-root{padding:20px;display:flex;flex-direction:column;gap:16px;min-height:100%}
        .kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .kpi{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px;position:relative;overflow:hidden}
        .kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--kpi-color,#a78bfa)}
        .kpi-val{font-size:28px;font-weight:800;color:var(--kpi-color,#dde1e9);line-height:1;margin-bottom:4px}
        .kpi-lbl{font-size:10.5px;color:#4a5568}
        .charts-row{display:grid;grid-template-columns:1fr 0.65fr;gap:12px}
        .chart-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px}
        .chart-title{font-size:11.5px;font-weight:600;color:#94a3b8;margin-bottom:8px}
        .alerts-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px}
        .alert-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;margin-bottom:6px;border:1px solid transparent}
        .alert-item.green{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.15)}
        .alert-item.amber{background:rgba(251,146,60,.06);border-color:rgba(251,146,60,.15)}
        .alert-item.red{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2)}
        .controls-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#0a0a18;border:1px solid #1e1e3a;border-radius:10px;padding:12px 16px}
        .ctrl-search{flex:1;min-width:200px;padding:8px 12px;background:#12122a;border:1px solid #26264a;border-radius:6px;color:#dde1e9;font-size:12px;outline:none}
        .ctrl-search::placeholder{color:#4a5568}
        .ctrl-search:focus{border-color:#a78bfa}
        .ctrl-select{padding:7px 12px;background:#12122a;border:1px solid #26264a;border-radius:6px;color:#dde1e9;font-size:12px;cursor:pointer;outline:none}
        .ctrl-btn{padding:7px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .15s}
        .ctrl-btn-primary{background:#a78bfa;color:#fff}
        .ctrl-btn-primary:hover{background:#8b5cf6}
        .ctrl-btn-ghost{background:#1a1a3a;color:#94a3b8;border:1px solid #26264a}
        .table-box{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;overflow:hidden;flex:1;min-height:400px}
        .table-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1e1e3a}
        .table-hd-title{font-size:12px;font-weight:600;color:#94a3b8}
        .portal-grid-wrapper .ag-header-cell-label{color:#94a3b8;font-size:11px;font-weight:600}
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .detail-field{background:#12122a;border-radius:7px;padding:10px 12px}
        .detail-lbl{font-size:9.5px;color:#4a5568;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
        .detail-val{font-size:12.5px;color:#dde1e9;font-weight:500}
        .doc-slots{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
        .doc-slot{background:#12122a;border:1px dashed #26264a;border-radius:7px;padding:12px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:border-color .15s}
        .doc-slot:hover{border-color:#a78bfa}
        .doc-slot-name{font-size:11px;color:#6b7280;flex:1}
        .doc-slot-btn{font-size:10px;color:#a78bfa;border:1px solid #26264a;border-radius:4px;padding:2px 8px;cursor:pointer;background:none}
        .type-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600}
      `}</style>

      <div className="ip-root">
        {/* KPI */}
        <div className="kpi-row">
          {[
            {label:'Total IP Records', val:stats?.total??'—',     color:'#a78bfa'},
            {label:'Active',           val:stats?.active??'—',    color:'#4ade80'},
            {label:'Trademarks',       val:stats?.trademarks??'—',color:'#26A9E1'},
            {label:'Patents',          val:stats?.patents??'—',   color:'#a78bfa'},
            {label:'Expiring (90d)',   val:stats?.expiringSoon??'—',color:'#fb923c'},
          ].map(k=>(
            <div key={k.label} className="kpi" style={{'--kpi-color':k.color} as React.CSSProperties}>
              <div className="kpi-val">{k.val}</div>
              <div className="kpi-lbl">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ALERTS + DONUT */}
        <div className="charts-row">
          <div className="alerts-box">
            <div style={{fontSize:'12px',fontWeight:700,color:'#94a3b8',marginBottom:'12px'}}>⚠️ IP Expiring Within 90 Days</div>
            {expiring.length===0 && <div style={{color:'#4a5568',fontSize:'12px',textAlign:'center',padding:'20px 0'}}>No IP records expiring in 90 days</div>}
            {expiring.slice(0,8).map((r:any)=>{
              const d=daysTo(r.DateOfExpiry);
              const cls=d<=7?'red':d<=14?'amber':'green';
              return(
                <div key={r.IPID} className={`alert-item ${cls}`}>
                  <span style={{fontSize:'15px'}}>{d<=7?'🔴':d<=14?'🟠':'🟡'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'11.5px',color:'#c9d1db',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.IPTitle}</div>
                    <div style={{fontSize:'10px',color:'#4a5568'}}>{r.CompanyName} · {r.Category}</div>
                  </div>
                  <div style={{fontSize:'10px',fontWeight:700,color:'inherit',whiteSpace:'nowrap'}}>{d===0?'TODAY':`${d}d`}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-box">
            <div className="chart-title">IP Type Distribution</div>
            {stats?(
              <ReactECharts option={typeDonut(stats.trademarks||0,stats.patents||0,stats.copyrights||0)} style={{height:'200px'}}/>
            ):(
              <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin/></div>
            )}
          </div>
        </div>

        {/* LINE CHART */}
        <div className="chart-box">
          <div className="chart-title">IP Registrations Over Time</div>
          {monthly.length>0?(
            <ReactECharts option={statusLine(months,mCounts)} style={{height:'200px'}}/>
          ):(
            <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin/></div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="controls-bar">
          <input className="ctrl-search" placeholder="Search IP title, category…" onChange={e=>handleSearch(e.target.value)}/>
          <select className="ctrl-select" value={companyF} onChange={e=>setCompanyF(e.target.value)}>
            <option value="">All Companies</option>
            {COMPANIES_14.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select className="ctrl-select" value={categoryF} onChange={e=>setCategoryF(e.target.value)}>
            <option value="">All Types</option>
            <option value="Trademark">Trademark</option>
            <option value="Patent">Patent</option>
            <option value="Copyright">Copyright</option>
          </select>
          <select className="ctrl-select" value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
          <button className="ctrl-btn ctrl-btn-ghost" onClick={()=>{setCompanyF('');setCategoryF('');setStatusF('');setSearch('');}}>Reset</button>
          <button className="ctrl-btn ctrl-btn-primary" onClick={()=>setNewOpen(true)}>+ New IP Record</button>
        </div>

        {/* AG GRID */}
        <div className="table-box">
          <div className="table-hd">
            <span className="table-hd-title">💡 All IP Records</span>
            <span style={{fontSize:'11px',color:'#4a5568'}}>{loading?'Loading…':`${records.length} records`}</span>
          </div>
          <div className="portal-grid-wrapper" style={{height:'calc(100vh - 600px)',minHeight:'300px',width:'100%'}}>
            <DataGrid
              theme={ipDarkTheme}
              rowData={records}
              columnDefs={COL_DEFS}
              defaultColDef={DEFAULT_COL}
              getRowStyle={rowStyle}
              onRowClicked={(e:any)=>setDetail(e.data)}
              rowSelection="single"
              pagination
              paginationPageSize={25}
              paginationPageSizeSelector={[25, 50, 100]}
            />
          </div>
        </div>
      </div>

      {/* NEW / EDIT IP DRAWER */}
      <Drawer
        title={<span style={{color:'#dde1e9',fontWeight:700}}>{editMode ? `Edit IP Record — #${detail?.IPID}` : 'New IP Registration'}</span>}
        open={newOpen}
        onClose={()=>{setNewOpen(false);setEditMode(false);form.resetFields();}}
        width={720}
        styles={{body:{padding:'20px',background:'#0e0e1e'},header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
        footer={
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
            <Button onClick={()=>{setNewOpen(false);setEditMode(false);form.resetFields();}}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSubmit} style={{background:'#a78bfa',borderColor:'#a78bfa'}}>{editMode ? 'Save Changes' : 'Register IP'}</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <Form.Item name="ipTitle" label="IP Title" rules={[{required:true}]} style={{gridColumn:'1/-1'}}>
              <Input placeholder="e.g. NOVATEX Trademark" />
            </Form.Item>
            <Form.Item name="companyId" label="Company" rules={[{required:true}]}>
              <Select placeholder="Select company" options={lookups.companies?.map((c:any)=>({value:c.CompanyID,label:c.CompanyName}))}/>
            </Form.Item>
            <Form.Item name="category" label="IP Type" rules={[{required:true}]}>
              <Select options={[{value:'Trademark',label:'Trademark'},{value:'Patent',label:'Patent'},{value:'Copyright',label:'Copyright'}]}/>
            </Form.Item>
            <Form.Item name="externalCounselId" label="External Counsel">
              <Select placeholder="Select counsel" allowClear options={lookups.externalLawyers?.map((l:any)=>({value:l.LawyerID,label:l.LawyerName+(l.FirmName?` (${l.FirmName})`:'')}))}/>
            </Form.Item>
            <Form.Item name="internalAssociateId" label="Internal Associate">
              <Select placeholder="Select associate" allowClear options={lookups.internalLawyers?.map((l:any)=>({value:l.LawyerID,label:l.LawyerName}))}/>
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{required:true}]} initialValue="Active">
              <Select options={[{value:'Active',label:'Active'},{value:'Expired',label:'Expired'}]}/>
            </Form.Item>
            <Form.Item name="professionalFees" label="Professional Fees (PKR)">
              <InputNumber placeholder="e.g. 50000" style={{width:'100%'}} min={0}/>
            </Form.Item>
            <Form.Item name="effectiveDate" label="Effective Date" rules={[{required:true}]}>
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="dateOfIssuance" label="Date of Issuance">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="dateOfExpiry" label="Date of Expiry" rules={[{required:true}]}>
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="remarks" label="Remarks" style={{gridColumn:'1/-1'}}>
              <Input.TextArea rows={2} placeholder="Any additional notes" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      {/* DETAIL DRAWER */}
      <Drawer
        title={
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingRight:'8px'}}>
            <span style={{color:'#dde1e9',fontWeight:700}}>IP Record Detail — #{detail?.IPID}</span>
            <Button size="small" onClick={handleEditOpen} style={{fontSize:'12px',background:'#1a1a3a',borderColor:'#26264a',color:'#94a3b8'}}>✏ Edit</Button>
          </div>
        }
        open={!!detail}
        onClose={()=>setDetail(null)}
        width={760}
        styles={{body:{padding:'20px',background:'#0e0e1e'},header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
      >
        {detail && (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div style={{
              background:detail.Status==='Active'?'rgba(74,222,128,.08)':'rgba(100,116,139,.08)',
              border:`1px solid ${detail.Status==='Active'?'rgba(74,222,128,.2)':'rgba(100,116,139,.2)'}`,
              borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',gap:'10px'
            }}>
              <span style={{fontSize:'18px'}}>{detail.Status==='Active'?'✅':'⭕'}</span>
              <div>
                <div style={{fontWeight:700,color:detail.Status==='Active'?'#4ade80':'#64748b'}}>{detail.Status}</div>
                <div style={{fontSize:'11px',color:'#4a5568'}}>
                  {detail.Category} ·{detail.CompanyName}
                </div>
              </div>
              <span style={{
                marginLeft:'auto',
                background:detail.Category==='Trademark'?'rgba(38,169,225,.15)':detail.Category==='Patent'?'rgba(167,139,250,.15)':'rgba(251,146,60,.15)',
                color:detail.Category==='Trademark'?'#26A9E1':detail.Category==='Patent'?'#a78bfa':'#fb923c',
                padding:'2px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'4px'
              }}>
                {detail.Category==='Trademark'?'™':detail.Category==='Patent'?'⚙':'©'} {detail.Category}
              </span>
            </div>

            <div className="detail-grid">
              <div className="detail-field" style={{gridColumn:'1/-1'}}>
                <div className="detail-lbl">IP Title</div>
                <div className="detail-val" style={{fontSize:'14px',fontWeight:600}}>{detail.IPTitle}</div>
              </div>
              {[
                ['Company',detail.CompanyName||'—'],
                ['IP Type',detail.Category],
                ['External Counsel',detail.ExternalCounselName||'—'],
                ['Internal Associate',detail.InternalAssociateName||'—'],
                ['Effective Date',fmt(detail.EffectiveDate)],
                ['Date of Issuance',fmt(detail.DateOfIssuance)],
                ['Date of Expiry',fmt(detail.DateOfExpiry)],
                ['Professional Fees',fmtPKR(detail.ProfessionalFees)],
              ].map(([l,v])=>(
                <div key={l} className="detail-field">
                  <div className="detail-lbl">{l}</div>
                  <div className="detail-val">{v}</div>
                </div>
              ))}
              {detail.Remarks && (
                <div className="detail-field" style={{gridColumn:'1/-1'}}>
                  <div className="detail-lbl">Remarks</div>
                  <div className="detail-val">{detail.Remarks}</div>
                </div>
              )}
            </div>

            <Divider style={{borderColor:'#1e1e3a',margin:'4px 0'}}/>
            <div>
              <div style={{fontSize:'12px',fontWeight:600,color:'#94a3b8',marginBottom:'10px'}}>📎 IP Documents</div>
              <div className="doc-slots">
                {['Application','Publication','Certificate','Opposition Document','Contesting Document','Other Annexures'].map(slot => {
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
                        <label className="doc-slot-btn" style={{cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1, color:'#a78bfa', borderColor:'#26264a'}}>
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
