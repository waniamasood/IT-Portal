'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Court    { CourtID: number; CourtName: string; }
interface Category { CategoryID: number; CategoryName: string; }
interface Counsel  { CounselID: number; CounselName: string; FirmName: string; }
interface Lookups  { courts: Court[]; categories: Category[]; counsel: Counsel[]; }

const STATUS_OPTIONS = ['Pending','Hearing Scheduled','Stay Order','Disposed','Withdrawn','Transferred'];

function statusColor(s: string) {
  if (s === 'Disposed')          return { bg:'rgba(74,222,128,0.15)',  color:'#4ade80', border:'rgba(74,222,128,0.35)'  };
  if (s === 'Stay Order')        return { bg:'rgba(220,38,38,0.15)',   color:'#f87171', border:'rgba(220,38,38,0.35)'   };
  if (s === 'Hearing Scheduled') return { bg:'rgba(96,165,250,0.15)',  color:'#60a5fa', border:'rgba(96,165,250,0.35)'  };
  if (s === 'Withdrawn')         return { bg:'rgba(156,163,175,0.15)', color:'#9ca3af', border:'rgba(156,163,175,0.35)' };
  if (s === 'Transferred')       return { bg:'rgba(167,139,250,0.15)', color:'#a78bfa', border:'rgba(167,139,250,0.35)' };
  return                                { bg:'rgba(251,191,36,0.15)',  color:'#fbbf24', border:'rgba(251,191,36,0.35)'  };
}

export default function NewCasePage() {
  const router = useRouter();

  const [lookups, setLookups] = useState<Lookups>({ courts:[], categories:[], counsel:[] });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const [caseTitle,             setCaseTitle]             = useState('');
  const [caseNumber,            setCaseNumber]            = useState('');
  const [courtId,               setCourtId]               = useState('');
  const [categoryId,            setCategoryId]            = useState('');
  const [counselId,             setCounselId]             = useState('');
  const [internalAssociateName, setInternalAssociateName] = useState('');
  const [byOrAgainst,           setByOrAgainst]           = useState('Against');
  const [status,                setStatus]                = useState('Pending');
  const [dateOfInstitution,     setDateOfInstitution]     = useState('');
  const [amountInvolved,        setAmountInvolved]        = useState('');
  const [professionalFees,      setProfessionalFees]      = useState('');
  const [caseSummary,           setCaseSummary]           = useState('');
  const [remarks,               setRemarks]               = useState('');
  const [addHearing,            setAddHearing]            = useState(false);
  const [hearingDate,           setHearingDate]           = useState('');
  const [proceedings,           setProceedings]           = useState('');

  useEffect(() => {
    fetch('/api/lookups')
      .then(r => r.json())
      .then(data => {
        if (data.courts) setLookups(data);
        else setError('Could not load form data. Check your database connection.');
      })
      .catch(() => setError('Could not load form data. Check your database connection.'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caseTitle.trim() || !caseNumber.trim() || !courtId || !categoryId) {
      setError('Case title, case number, court, and category are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseTitle, caseNumber,
          courtId:    parseInt(courtId),
          categoryId: parseInt(categoryId),
          counselId:  counselId ? parseInt(counselId) : null,
          internalAssociateName: internalAssociateName || null,
          byOrAgainst, status,
          dateOfInstitution: dateOfInstitution || null,
          amountInvolved:    amountInvolved   ? parseFloat(amountInvolved)   : null,
          professionalFees:  professionalFees ? parseFloat(professionalFees) : null,
          caseSummary: caseSummary || null,
          remarks:     remarks     || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save case');

      if (addHearing && hearingDate) {
        await fetch('/api/hearings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId: data.caseId, hearingDate, proceedings: proceedings || null }),
        });
      }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  const sc = statusColor(status);
  const previewCourt    = lookups.courts?.find(c => String(c.CourtID) === courtId)?.CourtName;
  const previewCategory = lookups.categories?.find(c => String(c.CategoryID) === categoryId)?.CategoryName;
  const previewCounsel  = lookups.counsel?.find(c => String(c.CounselID) === counselId)?.CounselName;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* PAGE */
        .pg {
          min-height: calc(100vh - 44px);
          background: #101014;
          padding: 22px 28px 40px;
        }

        /* BREADCRUMB */
        .bc { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #555; margin-bottom: 18px; }
        .bc button { background: none; border: none; color: #555; cursor: pointer; font-size: 11px; font-family: inherit; padding: 0; transition: color .12s; }
        .bc button:hover { color: #26A9E1; }
        .bc span { color: #aaa; font-weight: 600; }

        /* FLASH */
        .flash { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 16px; }
        .flash.err { background: rgba(127,29,29,0.6); color: #fca5a5; border: 1px solid rgba(185,28,28,0.5); }
        .flash.ok  { background: rgba(20,83,45,0.6);  color: #86efac; border: 1px solid rgba(21,128,61,0.5); }

        /* OUTER CARD */
        .card {
          display: grid;
          grid-template-columns: 1fr 268px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #26264a;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        }

        /* CARD HEADER — navy, spans both columns */
        .card-hdr {
          grid-column: 1 / -1;
          display: flex; align-items: center; gap: 14px;
          padding: 0 24px;
          height: 62px;
          background: #1D1C55;
          border-bottom: 2px solid #26A9E1;
        }
        .hdr-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(38,169,225,0.2); border: 1px solid rgba(38,169,225,0.45);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .hdr-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .hdr-sub   { font-size: 10px; color: rgba(255,255,255,0.45); margin-top: 2px; }
        .hdr-steps { margin-left: auto; display: flex; align-items: center; gap: 0; }
        .st { display: flex; align-items: center; gap: 7px; padding: 0 14px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); }
        .st.on { color: #fff; }
        .st-n { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; flex-shrink: 0; }
        .st.on .st-n { background: #26A9E1; border-color: #26A9E1; color: #fff; }
        .st-sep { width: 22px; height: 1px; background: rgba(255,255,255,0.15); }

        /* FORM AREA */
        .form-area { background: #13131e; border-right: 1px solid #1e1e36; }

        /* SECTION */
        .sec { border-bottom: 1px solid #1e1e36; }
        .sec:last-child { border-bottom: none; }

        /* section header strip — clearly distinct navy tint */
        .sec-hdr {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 22px;
          background: #1a1a3a;
          border-bottom: 1px solid #26264a;
          border-left: 4px solid #26A9E1;
        }
        .sec-num {
          width: 26px; height: 26px; border-radius: 7px;
          background: #26A9E1; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(38,169,225,0.4);
        }
        .sec-title { font-size: 12px; font-weight: 700; color: #e8e8ff; }
        .sec-hint  { font-size: 10px; color: #4a4a6a; margin-left: auto; font-style: italic; }

        /* section body — slightly lighter than card bg */
        .sec-body { padding: 22px; background: #16162a; display: flex; flex-direction: column; gap: 18px; }

        /* FIELD GRID */
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

        /* FIELD */
        .f { display: flex; flex-direction: column; gap: 6px; }
        .lbl { font-size: 10px; font-weight: 700; color: #8888aa; text-transform: uppercase; letter-spacing: .08em; }
        .req { color: #f87171; }

        /* INPUT / SELECT — high contrast */
        .fi, .fs {
          height: 40px; padding: 0 13px;
          background: #0e0e1c;
          border: 1px solid #30305a;
          border-radius: 8px;
          font-size: 12px; color: #e0e0ff;
          outline: none; font-family: inherit; width: 100%;
          transition: border-color .15s, box-shadow .15s;
        }
        .fi::placeholder { color: #3a3a5a; }
        .fi:hover:not(:focus), .fs:hover:not(:focus) { border-color: #44447a; }
        .fi:focus, .fs:focus {
          border-color: #26A9E1;
          box-shadow: 0 0 0 3px rgba(38,169,225,0.15);
          background: #0b0b18;
        }
        .fs {
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236666aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 11px center; background-size: 13px; padding-right: 32px;
        }
        .fta {
          padding: 11px 13px; resize: vertical; min-height: 90px; line-height: 1.65;
          background: #0e0e1c; border: 1px solid #30305a; border-radius: 8px;
          font-size: 12px; color: #e0e0ff; outline: none; font-family: inherit; width: 100%;
          transition: border-color .15s, box-shadow .15s;
        }
        .fta::placeholder { color: #3a3a5a; }
        .fta:hover:not(:focus) { border-color: #44447a; }
        .fta:focus { border-color: #26A9E1; box-shadow: 0 0 0 3px rgba(38,169,225,0.15); background: #0b0b18; }
        input[type="date"].fi { color-scheme: dark; }

        /* PKR PREFIX */
        .pkr {
          display: flex; height: 40px;
          border: 1px solid #30305a; border-radius: 8px; overflow: hidden;
          background: #0e0e1c; transition: border-color .15s, box-shadow .15s;
        }
        .pkr:focus-within { border-color: #26A9E1; box-shadow: 0 0 0 3px rgba(38,169,225,0.15); }
        .pkr-tag {
          padding: 0 13px; background: #1D1C55;
          border-right: 1px solid #30305a;
          font-size: 10px; font-weight: 800; color: #26A9E1;
          display: flex; align-items: center; flex-shrink: 0; letter-spacing: .05em;
        }
        .pkr input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 0 12px; font-size: 12px; color: #e0e0ff; font-family: inherit;
        }
        .pkr input::placeholder { color: #3a3a5a; }

        /* HEARING TOGGLE */
        .h-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 22px; border-top: 1px solid #1e1e36;
          cursor: pointer; background: #101020; transition: background .12s;
        }
        .h-row:hover { background: #13132a; }
        .sw { width: 34px; height: 19px; border-radius: 10px; background: #252545; border: 1px solid #30305a; position: relative; transition: background .15s; flex-shrink: 0; }
        .sw.on { background: #26A9E1; border-color: #26A9E1; }
        .sw-k { width: 13px; height: 13px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left .15s; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
        .sw.on .sw-k { left: 18px; }
        .h-lbl { font-size: 11px; font-weight: 600; color: #7777aa; }
        .h-panel { padding: 18px 22px; background: #101020; border-top: 1px solid #1e1e36; }

        /* SIDEBAR */
        .sidebar {
          background: #0c0c18;
          border-left: 1px solid #1e1e36;
          display: flex; flex-direction: column;
          position: sticky; top: 44px; align-self: start;
          max-height: calc(100vh - 44px); overflow-y: auto;
        }

        /* SIDEBAR BLOCK */
        .sb { border-bottom: 1px solid #1e1e36; }
        .sb:last-child { border-bottom: none; }
        .sb-hdr {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px;
          background: #1a1a3a;
          border-bottom: 1px solid #26264a;
          border-left: 3px solid #26A9E1;
        }
        .sb-icon {
          width: 20px; height: 20px; border-radius: 5px;
          background: rgba(38,169,225,0.15); border: 1px solid rgba(38,169,225,0.3);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sb-title { font-size: 10px; font-weight: 700; color: #c8c8ff; letter-spacing: .03em; text-transform: uppercase; }
        .sb-body { padding: 12px 14px; }

        /* STATUS OPTIONS */
        .s-list { display: flex; flex-direction: column; gap: 4px; }
        .s-opt {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 7px; cursor: pointer;
          border: 1px solid transparent; font-size: 11px; font-weight: 500;
          color: #6666aa; transition: all .12s;
        }
        .s-opt:hover:not(.on) { background: #1a1a30; border-color: #30305a; color: #9999cc; }
        .s-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .s-fill { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: none; }
        .s-opt.on .s-fill { display: block; }

        /* PREVIEW */
        .prev { display: flex; flex-direction: column; }
        .prow { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 7px 0; border-bottom: 1px solid #1a1a2e; font-size: 10px; }
        .prow:first-child { padding-top: 0; }
        .prow:last-child  { border-bottom: none; padding-bottom: 0; }
        .pk { color: #55557a; font-weight: 600; flex-shrink: 0; }
        .pv { color: #ccccff; font-weight: 600; text-align: right; word-break: break-word; max-width: 148px; }
        .pv.mono { font-family: monospace; font-size: 9px; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 4px; font-size: 9px; font-weight: 700; }

        /* ACTION PANEL */
        .act { padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; background: #0c0c18; }
        .btn {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 7px; padding: 12px; border-radius: 9px; font-size: 13px; font-weight: 700;
          font-family: inherit; cursor: pointer; border: none; transition: all .15s; letter-spacing: .01em;
        }
        .btn-go {
          background: #26A9E1; color: #fff;
          box-shadow: 0 4px 22px rgba(38,169,225,0.35);
        }
        .btn-go:hover:not(:disabled) {
          background: #1a96cc;
          box-shadow: 0 6px 32px rgba(38,169,225,0.5);
          transform: translateY(-1px);
        }
        .btn-go:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; transform: none; }
        .btn-back { background: #1a1a30; color: #8888bb; border: 1px solid #2a2a4a; font-size: 12px; }
        .btn-back:hover { background: #20203a; color: #aaaacc; border-color: #35355a; }
        .act-note { font-size: 9px; color: #3a3a5a; text-align: center; }
      `}</style>

      <div className="pg">

        {/* BREADCRUMB */}
        <div className="bc">
          <button onClick={() => router.push('/dashboard')}>Dashboard</button>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:.4}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          <button onClick={() => router.push('/dashboard')}>Litigation</button>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:.4}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          <span>Register New Case</span>
        </div>

        {error   && <div className="flash err"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
        {success && <div className="flash ok"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Case registered. Redirecting to dashboard…</div>}

        <div className="card">

          {/* ── HEADER ── */}
          <div className="card-hdr">
            <div className="hdr-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#26A9E1" strokeWidth="1.8" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <div className="hdr-title">New Case Registration Form</div>
              <div className="hdr-sub">Litigation Module &nbsp;·&nbsp; Legal Affairs Department &nbsp;·&nbsp; Gatronova Group</div>
            </div>
            <div className="hdr-steps">
              {(['Case Details','Hearings','Documents'] as const).map((label, i, arr) => (
                <span key={label} style={{display:'contents'}}>
                  <div className={`st${i===0?' on':''}`}>
                    <div className="st-n">{i===0?'✓':i+1}</div>
                    {label}
                  </div>
                  {i < arr.length-1 && <div className="st-sep"/>}
                </span>
              ))}
            </div>
          </div>

          {/* ── FORM ── */}
          <form id="ncf" onSubmit={handleSubmit}>
            <div className="form-area">

              {/* 1 · Case Identification */}
              <div className="sec">
                <div className="sec-hdr">
                  <div className="sec-num">1</div>
                  <div className="sec-title">Case Identification</div>
                  <div className="sec-hint">Court assignment &amp; case details</div>
                </div>
                <div className="sec-body">
                  <div className="g2">
                    <div className="f">
                      <label className="lbl">Case Title <span className="req">*</span></label>
                      <input className="fi" type="text" value={caseTitle}
                        onChange={e => setCaseTitle(e.target.value)}
                        placeholder="e.g. XYZ Corporation vs Gatronova Ltd" required />
                    </div>
                    <div className="f">
                      <label className="lbl">Case / Suit Number <span className="req">*</span></label>
                      <input className="fi" type="text" value={caseNumber}
                        onChange={e => setCaseNumber(e.target.value)}
                        placeholder="e.g. CS-0234/2024" required />
                    </div>
                  </div>
                  <div className="g3">
                    <div className="f">
                      <label className="lbl">Court <span className="req">*</span></label>
                      <select className="fs" value={courtId} onChange={e => setCourtId(e.target.value)} required>
                        <option value="">Select court…</option>
                        {lookups.courts?.map(c => <option key={c.CourtID} value={c.CourtID}>{c.CourtName}</option>)}
                      </select>
                    </div>
                    <div className="f">
                      <label className="lbl">Category <span className="req">*</span></label>
                      <select className="fs" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                        <option value="">Select category…</option>
                        {lookups.categories?.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                      </select>
                    </div>
                    <div className="f">
                      <label className="lbl">Case Posture</label>
                      <select className="fs" value={byOrAgainst} onChange={e => setByOrAgainst(e.target.value)}>
                        <option value="Against">Against (Defendant)</option>
                        <option value="By">By (Plaintiff)</option>
                      </select>
                    </div>
                  </div>
                  <div className="f" style={{maxWidth:'280px'}}>
                    <label className="lbl">Date of Institution</label>
                    <input className="fi" type="date" value={dateOfInstitution}
                      onChange={e => setDateOfInstitution(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* 2 · Counsel */}
              <div className="sec">
                <div className="sec-hdr">
                  <div className="sec-num">2</div>
                  <div className="sec-title">Counsel &amp; Associates</div>
                  <div className="sec-hint">Legal representatives</div>
                </div>
                <div className="sec-body">
                  <div className="g2">
                    <div className="f">
                      <label className="lbl">External Counsel</label>
                      <select className="fs" value={counselId} onChange={e => setCounselId(e.target.value)}>
                        <option value="">None / Not assigned</option>
                        {lookups.counsel?.map(c => (
                          <option key={c.CounselID} value={c.CounselID}>
                            {c.CounselName}{c.FirmName ? `  —  ${c.FirmName}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="f">
                      <label className="lbl">Internal Associate (IBC)</label>
                      <input className="fi" type="text" value={internalAssociateName}
                        onChange={e => setInternalAssociateName(e.target.value)}
                        placeholder="Full name of in-house contact" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 · Financials */}
              <div className="sec">
                <div className="sec-hdr">
                  <div className="sec-num">3</div>
                  <div className="sec-title">Financial Details</div>
                  <div className="sec-hint">Amounts in PKR</div>
                </div>
                <div className="sec-body">
                  <div className="g2">
                    <div className="f">
                      <label className="lbl">Amount Involved</label>
                      <div className="pkr">
                        <div className="pkr-tag">PKR</div>
                        <input type="number" min="0" step="0.01"
                          value={amountInvolved} onChange={e => setAmountInvolved(e.target.value)}
                          placeholder="0.00" />
                      </div>
                    </div>
                    <div className="f">
                      <label className="lbl">Professional Fees</label>
                      <div className="pkr">
                        <div className="pkr-tag">PKR</div>
                        <input type="number" min="0" step="0.01"
                          value={professionalFees} onChange={e => setProfessionalFees(e.target.value)}
                          placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 · Summary */}
              <div className="sec">
                <div className="sec-hdr">
                  <div className="sec-num">4</div>
                  <div className="sec-title">Summary &amp; Remarks</div>
                  <div className="sec-hint">Background, strategy, notes</div>
                </div>
                <div className="sec-body">
                  <div className="f">
                    <label className="lbl">Case Summary</label>
                    <textarea className="fta" rows={4} value={caseSummary}
                      onChange={e => setCaseSummary(e.target.value)}
                      placeholder="Brief background — parties, subject matter, legal basis, key facts…" />
                  </div>
                  <div className="f">
                    <label className="lbl">Internal Remarks</label>
                    <textarea className="fta" rows={3} value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Legal strategy, next steps, follow-up actions…" />
                  </div>
                </div>
                <div className="h-row" onClick={() => setAddHearing(v => !v)}>
                  <div className={`sw${addHearing?' on':''}`}><div className="sw-k"/></div>
                  <span className="h-lbl">{addHearing ? 'First hearing date added' : 'Add first hearing date (optional)'}</span>
                </div>
                {addHearing && (
                  <div className="h-panel">
                    <div className="g2">
                      <div className="f">
                        <label className="lbl">Hearing Date</label>
                        <input className="fi" type="date" value={hearingDate}
                          onChange={e => setHearingDate(e.target.value)} />
                      </div>
                      <div className="f">
                        <label className="lbl">Proceedings / Notes</label>
                        <input className="fi" type="text" value={proceedings}
                          onChange={e => setProceedings(e.target.value)}
                          placeholder="What is scheduled or what happened" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </form>

          {/* ── SIDEBAR ── */}
          <div className="sidebar">

            {/* Status */}
            <div className="sb">
              <div className="sb-hdr">
                <div className="sb-icon"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#26A9E1" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <div className="sb-title">Case Status</div>
              </div>
              <div className="sb-body">
                <div className="s-list">
                  {STATUS_OPTIONS.map(s => {
                    const c = statusColor(s);
                    const on = status === s;
                    return (
                      <div key={s} className={`s-opt${on?' on':''}`}
                        style={on ? {background:c.bg, borderColor:c.border, color:c.color} : {}}
                        onClick={() => setStatus(s)}>
                        <div className="s-dot" style={on?{borderColor:c.color}:{}}>
                          <div className="s-fill" style={{background:c.color}}/>
                        </div>
                        {s}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="sb">
              <div className="sb-hdr">
                <div className="sb-icon"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#26A9E1" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
                <div className="sb-title">Live Preview</div>
              </div>
              <div className="sb-body">
                <div className="prev">
                  <div className="prow"><span className="pk">Case No.</span><span className="pv mono">{caseNumber||'—'}</span></div>
                  <div className="prow"><span className="pk">Court</span><span className="pv">{previewCourt||'—'}</span></div>
                  <div className="prow"><span className="pk">Category</span><span className="pv">{previewCategory||'—'}</span></div>
                  <div className="prow"><span className="pk">Counsel</span><span className="pv">{previewCounsel||'None'}</span></div>
                  <div className="prow"><span className="pk">Posture</span><span className="pv">{byOrAgainst}</span></div>
                  <div className="prow">
                    <span className="pk">Status</span>
                    <span className="chip" style={{background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`}}>● {status}</span>
                  </div>
                  {amountInvolved && (
                    <div className="prow"><span className="pk">Amount</span><span className="pv">PKR {parseFloat(amountInvolved).toLocaleString()}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="sb">
              <div className="sb-hdr">
                <div className="sb-icon"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#26A9E1" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></div>
                <div className="sb-title">Submit</div>
              </div>
              <div className="act">
                <button type="submit" form="ncf" className="btn btn-go" disabled={saving||success}>
                  {saving
                    ? <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}} aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>Saving…</>
                    : success
                    ? <>✓ Case Registered</>
                    : <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Register Case</>
                  }
                </button>
                <button type="button" className="btn btn-back" onClick={() => router.push('/dashboard')}>
                  Cancel &amp; Return to Dashboard
                </button>
                <div className="act-note">Fields marked <span style={{color:'#f87171'}}>*</span> are required</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
