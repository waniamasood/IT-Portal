'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ConfigProvider, theme as antTheme, Drawer, Form, Input,
  Select, Button, message, Divider, Tooltip, Spin, InputNumber
} from 'antd';
import axios from 'axios';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
const DataGrid     = dynamic(() => import('@/app/components/DataGrid'), { ssr: false });

const fmt    = (d?: string|null) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const daysTo = (d?: string|null) => d ? Math.ceil((new Date(d).getTime()-Date.now())/(1000*86400)) : 9999;

function monthBarOption(months:string[],ongoing:number[],expired:number[]){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    legend:{textStyle:{color:'#6b7280'},data:['Ongoing','Expired'],bottom:0},
    grid:{left:10,right:10,top:10,bottom:30,containLabel:true},
    xAxis:{type:'category',data:months,axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10}},
    yAxis:{type:'value',axisLine:{lineStyle:{color:'#26264a'}},axisLabel:{color:'#6b7280',fontSize:10},splitLine:{lineStyle:{color:'#1a1a3a'}}},
    series:[
      {name:'Ongoing',type:'bar',stack:'s',data:ongoing,itemStyle:{color:'#4ade80',borderRadius:[0,0,0,0]}},
      {name:'Expired',type:'bar',stack:'s',data:expired,itemStyle:{color:'#374151',borderRadius:[3,3,0,0]}},
    ],
  };
}

function statusDonut(ongoing:number,expired:number){
  return {
    backgroundColor:'transparent',
    tooltip:{trigger:'item',backgroundColor:'#1a1a3a',borderColor:'#26A9E1',textStyle:{color:'#dde1e9'}},
    legend:{orient:'vertical',left:'left',textStyle:{color:'#6b7280',fontSize:11}},
    series:[{
      type:'pie',radius:['48%','72%'],
      data:[
        {name:'Ongoing',value:ongoing,itemStyle:{color:'#4ade80'}},
        {name:'Expired',value:expired,itemStyle:{color:'#374151'}},
      ],
      label:{color:'#dde1e9',fontSize:11},
    }],
  };
}

const COL_DEFS = [
  { field:'ContractID',    headerName:'ID',           width:70,  pinned:'left' as const, cellStyle:{color:'#26A9E1',fontWeight:600} },
  { field:'ContractTitle', headerName:'Contract Title', flex:2, minWidth:180, tooltipField:'ContractTitle' },
  { field:'FirstParty',    headerName:'First Party',  width:160 },
  { field:'SecondParty',   headerName:'Second Party', width:160 },
  { field:'CompanyName',   headerName:'Company',      width:150 },
  { field:'DepartmentName',headerName:'Department',   width:130 },
  { field:'CategoryName',  headerName:'Category',     width:170 },
  { field:'Status',        headerName:'Status',       width:105,
    cellStyle:(p:any)=>({color:p.value==='Ongoing'?'#4ade80':p.value==='Expired'?'#64748b':'#dde1e9',fontWeight:600,fontSize:'11px'})
  },
  { field:'DateOfSigning', headerName:'Signed',       width:120, valueFormatter:(p:any)=>fmt(p.value) },
  { field:'DateOfExpiry',  headerName:'Expiry',       width:130,
    valueFormatter:(p:any)=>fmt(p.value),
    cellStyle:(p:any)=>{
      const d=daysTo(p.value);
      return {color:d<=7?'#ef4444':d<=14?'#fb923c':d<=30?'#facc15':'#dde1e9',fontWeight:d<=30?700:400};
    }
  },
  { field:'ExternalPartyName',    headerName:'External Party', width:160 },
  { field:'InternalAssociateName',headerName:'Int. Associate', width:150 },
];

const DEFAULT_COL = { sortable:true, filter:true, resizable:true, suppressHeaderMenuButton:true };

export default function ContractsPage() {
  const searchParams = useSearchParams();
  const [contracts,  setContracts]  = useState<any[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [monthly,    setMonthly]    = useState<any[]>([]);
  const [lookups,    setLookups]    = useState<any>({contractCategories:[],companies:[],departments:[],externalLawyers:[],internalLawyers:[]});
  const [loading,    setLoading]    = useState(true);
  const [companyF,   setCompanyF]   = useState(searchParams.get('company')  ?? '');
  const [statusF,    setStatusF]    = useState(searchParams.get('status')   ?? '');
  const [categoryF,  setCategoryF]  = useState(searchParams.get('category') ?? '');
  const [search,     setSearch]     = useState('');
  const [newOpen,     setNewOpen]    = useState(false);
  const [editMode,    setEditMode]   = useState(false);
  const [detail,      setDetail]     = useState<any>(null);
  const [saving,      setSaving]     = useState(false);
  const [form]                       = Form.useForm();
  const [attachments, setAttachments]= useState<any[]>([]);
  const [uploading,   setUploading]  = useState<string|null>(null);
  const searchRef                    = useRef<ReturnType<typeof setTimeout>|null>(null);

  const fetchContracts = useCallback(() => {
    setLoading(true);
    const p: Record<string,string> = {};
    if (companyF)  p.company  = companyF;
    if (statusF)   p.status   = statusF;
    if (categoryF) p.category = categoryF;
    if (search)    p.search   = search;
    axios.get('/api/contracts', {params:p})
      .then(r => setContracts(r.data.contracts ?? []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [companyF, statusF, categoryF, search]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  useEffect(() => {
    axios.get('/api/dashboard/contracts-stats').then(r => setStats(r.data)).catch(()=>{});
    axios.get('/api/dashboard/contracts-monthly').then(r => setMonthly(r.data.data ?? [])).catch(()=>{});
    axios.get('/api/lookups').then(r => { if (r.data.courts) setLookups(r.data); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!detail) { setAttachments([]); return; }
    axios.get(`/api/contracts/${detail.ContractID}/attachments`)
      .then(r => setAttachments(r.data.attachments ?? []))
      .catch(() => setAttachments([]));
  }, [detail]);

  const months   = monthly.map((m:any) => m.month);
  const mOngoing = monthly.map((m:any) => m.ongoing ?? 0);
  const mExpired = monthly.map((m:any) => m.expired ?? 0);

  const expiringContracts = contracts.filter(c => {
    const d = daysTo(c.DateOfExpiry);
    return d >= 0 && d <= 30 && c.Status === 'Ongoing';
  }).sort((a,b) => daysTo(a.DateOfExpiry)-daysTo(b.DateOfExpiry));

  async function handleEditOpen() {
    if (!detail) return;
    try {
      const { data } = await axios.get(`/api/contracts/${detail.ContractID}`);
      const c = data.contract;
      const toDate = (d: any) => d ? new Date(d).toISOString().split('T')[0] : undefined;
      form.setFieldsValue({
        contractTitle:       c.ContractTitle,
        firstParty:          c.FirstParty,
        secondParty:         c.SecondParty,
        companyId:           c.CompanyID,
        departmentId:        c.DepartmentID,
        categoryId:          c.CategoryID,
        externalPartyId:     c.ExternalPartyID,
        internalAssociateId: c.InternalAssociateID,
        effectiveDate:       toDate(c.EffectiveDate),
        dateOfSigning:       toDate(c.DateOfSigning),
        dateOfExpiry:        toDate(c.DateOfExpiry),
        summary:             c.Summary,
        remarks:             c.Remarks,
        status:              c.Status,
      });
      setEditMode(true);
      setNewOpen(true);
    } catch {
      message.error('Failed to load contract data');
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
      await axios.post(`/api/contracts/${detail.ContractID}/attachments`, fd);
      message.success(`${docType} uploaded`);
      const res = await axios.get(`/api/contracts/${detail.ContractID}/attachments`);
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
        await axios.put(`/api/contracts/${detail.ContractID}`, vals);
        message.success('Contract updated successfully');
      } else {
        await axios.post('/api/contracts', vals);
        message.success('Contract registered successfully');
      }
      setNewOpen(false);
      setEditMode(false);
      form.resetFields();
      fetchContracts();
    } catch(e:any) {
      if (e?.response) message.error(editMode ? 'Failed to update contract' : 'Failed to save contract');
    } finally { setSaving(false); }
  }

  function handleSearch(v: string) {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearch(v), 400);
  }

  const rowStyle = (p: any) => p.data.Status === 'Expired' ? { opacity:'0.5' } : undefined;

  return (
    <ConfigProvider theme={{algorithm:antTheme.darkAlgorithm,token:{colorPrimary:'#26A9E1',colorBgBase:'#08080f',colorBgContainer:'#12122a',colorBorder:'#26264a',borderRadius:6,fontFamily:'Inter,Segoe UI,system-ui,sans-serif'}}}>
      <style>{`
        .con-root{padding:20px;display:flex;flex-direction:column;gap:16px;min-height:100%}
        .kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        .kpi{background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:16px;position:relative;overflow:hidden}
        .kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--kpi-color,#26A9E1)}
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
        .ctrl-search:focus{border-color:#26A9E1}
        .ctrl-select{padding:7px 12px;background:#12122a;border:1px solid #26264a;border-radius:6px;color:#dde1e9;font-size:12px;cursor:pointer;outline:none}
        .ctrl-btn{padding:7px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .15s}
        .ctrl-btn-primary{background:#26A9E1;color:#fff}
        .ctrl-btn-primary:hover{background:#1a8fc4}
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
        .doc-slot:hover{border-color:#26A9E1}
        .doc-slot-name{font-size:11px;color:#6b7280;flex:1}
        .doc-slot-btn{font-size:10px;color:#26A9E1;border:1px solid #26264a;border-radius:4px;padding:2px 8px;cursor:pointer;background:none}
      `}</style>

      <div className="con-root">
        {/* KPI */}
        <div className="kpi-row">
          {[
            {label:'Total Contracts',val:stats?.total??'—',color:'#26A9E1'},
            {label:'Ongoing',val:stats?.ongoing??'—',color:'#4ade80'},
            {label:'Expired',val:stats?.expired??'—',color:'#64748b'},
            {label:'Expiring (30d)',val:stats?.expiringSoon??'—',color:'#fb923c'},
            {label:'Critical (7d)',val:stats?.expiringCritical??'—',color:'#ef4444'},
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
            <div style={{fontSize:'12px',fontWeight:700,color:'#94a3b8',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
              ⚠️ Contracts Expiring Within 30 Days
            </div>
            {expiringContracts.length===0 && <div style={{color:'#4a5568',fontSize:'12px',textAlign:'center',padding:'20px 0'}}>No contracts expiring in 30 days</div>}
            {expiringContracts.map((c:any)=>{
              const d=daysTo(c.DateOfExpiry);
              const cls=d<=7?'red':d<=14?'amber':'green';
              const ico=d<=7?'🔴':d<=14?'🟠':'🟢';
              return(
                <div key={c.ContractID} className={`alert-item ${cls}`}>
                  <span style={{fontSize:'16px'}}>{ico}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'11.5px',color:'#c9d1db',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.ContractTitle}</div>
                    <div style={{fontSize:'10px',color:'#4a5568'}}>{c.CompanyName} · {fmt(c.DateOfExpiry)}</div>
                  </div>
                  <div style={{fontSize:'10px',fontWeight:700,color:'inherit',whiteSpace:'nowrap'}}>{d===0?'TODAY':`${d}d`}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-box">
            <div className="chart-title">Ongoing vs Expired</div>
            {stats ? (
              <ReactECharts option={statusDonut(stats.ongoing||0,stats.expired||0)} style={{height:'200px'}}/>
            ):(
              <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin/></div>
            )}
          </div>
        </div>

        {/* MONTHLY BAR */}
        <div className="chart-box">
          <div className="chart-title">Monthly Contract Signings — Last 24 Months</div>
          {monthly.length>0?(
            <ReactECharts option={monthBarOption(months,mOngoing,mExpired)} style={{height:'200px'}}/>
          ):(
            <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}><Spin/></div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="controls-bar">
          <input className="ctrl-search" placeholder="Search title, parties…" onChange={e=>handleSearch(e.target.value)}/>
          <select className="ctrl-select" value={companyF} onChange={e=>setCompanyF(e.target.value)}>
            <option value="">All Companies</option>
            {lookups.companies?.map((c:any)=><option key={c.CompanyID} value={c.CompanyName}>{c.CompanyName}</option>)}
          </select>
          <select className="ctrl-select" value={categoryF} onChange={e=>setCategoryF(e.target.value)}>
            <option value="">All Categories</option>
            {lookups.contractCategories?.map((c:any)=><option key={c.CategoryID} value={c.CategoryName}>{c.CategoryName}</option>)}
          </select>
          <select className="ctrl-select" value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Expired">Expired</option>
          </select>
          <button className="ctrl-btn ctrl-btn-ghost" onClick={()=>{setCompanyF('');setStatusF('');setCategoryF('');setSearch('');}}>Reset</button>
          <button className="ctrl-btn ctrl-btn-primary" onClick={()=>setNewOpen(true)}>+ New Contract</button>
        </div>

        {/* AG GRID */}
        <div className="table-box">
          <div className="table-hd">
            <span className="table-hd-title">📄 All Contracts</span>
            <span style={{fontSize:'11px',color:'#4a5568'}}>{loading?'Loading…':`${contracts.length} records`}</span>
          </div>
          <div className="portal-grid-wrapper" style={{height:'calc(100vh - 600px)',minHeight:'300px',width:'100%'}}>
            <DataGrid
              rowData={contracts}
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

      {/* NEW / EDIT CONTRACT DRAWER */}
      <Drawer
        title={<span style={{color:'#dde1e9',fontWeight:700}}>{editMode ? `Edit Contract — #${detail?.ContractID}` : 'New Contract Registration'}</span>}
        open={newOpen}
        onClose={()=>{setNewOpen(false);setEditMode(false);form.resetFields();}}
        width={750}
        styles={{body:{padding:'20px',background:'#0e0e1e'},header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
        footer={
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
            <Button onClick={()=>{setNewOpen(false);setEditMode(false);form.resetFields();}}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={handleSubmit}>{editMode ? 'Save Changes' : 'Register Contract'}</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <Form.Item name="contractTitle" label="Contract Title" rules={[{required:true}]} style={{gridColumn:'1/-1'}}>
              <Input placeholder="e.g. IT Services Agreement" />
            </Form.Item>
            <Form.Item name="firstParty" label="First Party" rules={[{required:true}]}>
              <Input placeholder="e.g. Novatex Limited" />
            </Form.Item>
            <Form.Item name="secondParty" label="Second Party" rules={[{required:true}]}>
              <Input placeholder="e.g. TechCorp Solutions" />
            </Form.Item>
            <Form.Item name="companyId" label="Company" rules={[{required:true}]}>
              <Select placeholder="Select company" options={lookups.companies?.map((c:any)=>({value:c.CompanyID,label:c.CompanyName}))}/>
            </Form.Item>
            <Form.Item name="departmentId" label="Department" rules={[{required:true}]}>
              <Select placeholder="Select department" options={lookups.departments?.map((d:any)=>({value:d.DepartmentID,label:d.DepartmentName}))}/>
            </Form.Item>
            <Form.Item name="categoryId" label="Category" rules={[{required:true}]}>
              <Select placeholder="Select category" options={lookups.contractCategories?.map((c:any)=>({value:c.CategoryID,label:c.CategoryName}))}/>
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{required:true}]} initialValue="Ongoing">
              <Select options={[{value:'Ongoing',label:'Ongoing'},{value:'Expired',label:'Expired'}]}/>
            </Form.Item>
            <Form.Item name="externalPartyId" label="External Party">
              <Select placeholder="Select external lawyer" allowClear options={lookups.externalLawyers?.map((l:any)=>({value:l.LawyerID,label:l.LawyerName}))}/>
            </Form.Item>
            <Form.Item name="internalAssociateId" label="Internal Associate">
              <Select placeholder="Select associate" allowClear options={lookups.internalLawyers?.map((l:any)=>({value:l.LawyerID,label:l.LawyerName}))}/>
            </Form.Item>
            <Form.Item name="effectiveDate" label="Effective Date" rules={[{required:true}]}>
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="dateOfSigning" label="Date of Signing">
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="dateOfExpiry" label="Date of Expiry" rules={[{required:true}]} style={{gridColumn:'1/-1'}}>
              <Input type="date" style={{background:'#12122a',border:'1px solid #26264a',color:'#dde1e9',borderRadius:6,padding:'6px 10px',width:'100%'}}/>
            </Form.Item>
            <Form.Item name="summary" label="Agreement Summary" style={{gridColumn:'1/-1'}}>
              <Input.TextArea rows={3} placeholder="Brief description of the agreement" />
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
            <span style={{color:'#dde1e9',fontWeight:700}}>Contract Detail — #{detail?.ContractID}</span>
            <Button size="small" onClick={handleEditOpen} style={{fontSize:'12px',background:'#1a1a3a',borderColor:'#26264a',color:'#94a3b8'}}>✏ Edit</Button>
          </div>
        }
        open={!!detail}
        onClose={()=>setDetail(null)}
        width={780}
        styles={{body:{padding:'20px',background:'#0e0e1e'},header:{background:'#0a0a18',borderBottom:'1px solid #1e1e3a'}}}
      >
        {detail && (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div style={{
              background:detail.Status==='Ongoing'?'rgba(74,222,128,.08)':'rgba(100,116,139,.08)',
              border:`1px solid ${detail.Status==='Ongoing'?'rgba(74,222,128,.2)':'rgba(100,116,139,.2)'}`,
              borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',gap:'10px'
            }}>
              <span style={{fontSize:'18px'}}>{detail.Status==='Ongoing'?'🟢':'⭕'}</span>
              <div>
                <div style={{fontWeight:700,color:detail.Status==='Ongoing'?'#4ade80':'#64748b'}}>{detail.Status}</div>
                {detail.DateOfExpiry && <div style={{fontSize:'11px',color:'#4a5568'}}>Expires: {fmt(detail.DateOfExpiry)}</div>}
              </div>
              {daysTo(detail.DateOfExpiry)<=30 && detail.Status==='Ongoing' && (
                <span style={{marginLeft:'auto',background:'rgba(251,146,60,.15)',color:'#fb923c',padding:'2px 10px',borderRadius:20,fontSize:'11px',fontWeight:600}}>
                  ⚠ Expiring in {daysTo(detail.DateOfExpiry)}d
                </span>
              )}
            </div>

            <div className="detail-grid">
              <div className="detail-field" style={{gridColumn:'1/-1'}}>
                <div className="detail-lbl">Contract Title</div>
                <div className="detail-val" style={{fontSize:'14px',fontWeight:600}}>{detail.ContractTitle}</div>
              </div>
              {[
                ['First Party',detail.FirstParty],
                ['Second Party',detail.SecondParty],
                ['Company',detail.CompanyName||'—'],
                ['Department',detail.DepartmentName||'—'],
                ['Category',detail.CategoryName||'—'],
                ['External Party',detail.ExternalPartyName||'—'],
                ['Internal Associate',detail.InternalAssociateName||'—'],
                ['Effective Date',fmt(detail.EffectiveDate)],
                ['Date of Signing',fmt(detail.DateOfSigning)],
                ['Date of Expiry',fmt(detail.DateOfExpiry)],
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
              <div style={{fontSize:'12px',fontWeight:600,color:'#94a3b8',marginBottom:'10px'}}>📎 Document Attachments</div>
              <div className="doc-slots">
                {['Signed Contract Copy','Annexures','Addendum 1','Addendum 2','Related Agreements','Other Documents'].map(slot => {
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
