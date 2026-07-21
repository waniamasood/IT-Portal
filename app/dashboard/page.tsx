'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { message } from 'antd';

interface Stats { total:number; pending:number; disposed:number; hearingsUpcoming:number; hearingsCritical:number; totalAmountInvolved:number; totalProfessionalCost:number; }
interface CStats { total:number; ongoing:number; expired:number; expiringSoon:number; expiringCritical:number; }
interface IPStats { total:number; active:number; expired:number; expiringSoon:number; trademarks:number; patents:number; copyrights:number; }

const fmtPKR = (n:number) => n >= 1e7 ? `₨${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₨${(n/1e5).toFixed(1)}L` : `₨${n.toLocaleString()}`;

export default function OverviewPage() {
  const [lit,      setLit]     = useState<Stats|null>(null);
  const [con,      setCon]     = useState<CStats|null>(null);
  const [ip,       setIP]      = useState<IPStats|null>(null);
  const [sending,    setSending]   = useState(false);
  const [reminderTo, setReminderTo] = useState('');
  const [msgApi,     msgCtx]        = message.useMessage();

  const sendReminder = async () => {
    setSending(true);
    try {
      const { data } = await axios.post('/api/reminders', reminderTo ? { to: reminderTo } : {});
      const channels: string[] = [];
      if (data.to) channels.push(`email → ${data.to}`);
      if (data.whatsappTo?.length) channels.push(`WhatsApp → ${data.whatsappTo.join(', ')}`);
      if (channels.length) {
        msgApi.success(`Reminder sent (${data.itemCount} item${data.itemCount !== 1 ? 's' : ''}): ${channels.join(' · ')}`);
      }
      if (data.emailError) msgApi.warning(`Email not sent: ${data.emailError}`);
      if (data.whatsappError) msgApi.warning(`WhatsApp not sent: ${data.whatsappError}`);
    } catch (err: any) {
      msgApi.error(err?.response?.data?.error ?? 'Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    axios.get('/api/dashboard/litigation-stats').then(r => setLit(r.data)).catch(() => {});
    axios.get('/api/dashboard/contracts-stats').then(r => setCon(r.data)).catch(() => {});
    axios.get('/api/dashboard/ip-stats').then(r => setIP(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        .ov-root{padding:24px;min-height:100%}
        .ov-hero{
          background:linear-gradient(135deg,#1D1C55 0%,#141435 50%,#0c0c20 100%);
          border:1px solid #26264a;border-radius:12px;padding:28px 32px;
          margin-bottom:24px;position:relative;overflow:hidden;
        }
        .ov-hero::before{
          content:'';position:absolute;top:-30px;right:-30px;
          width:200px;height:200px;border-radius:50%;
          background:radial-gradient(circle,rgba(38,169,225,.15),transparent 70%);
        }
        .ov-hero-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
        .ov-hero-sub{font-size:13px;color:#94a3b8}
        .ov-hero-meta{display:flex;gap:16px;margin-top:12px}
        .ov-hero-badge{
          padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;
          background:rgba(38,169,225,.15);color:#26A9E1;border:1px solid rgba(38,169,225,.3);
        }

        .ov-portals{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
        .ov-portal-card{
          background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;padding:20px;
          transition:border-color .2s;cursor:pointer;text-decoration:none;display:block;
        }
        .ov-portal-card:hover{border-color:#26A9E1}
        .ov-portal-hd{display:flex;align-items:center;gap:10px;margin-bottom:16px}
        .ov-portal-ico{
          width:38px;height:38px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;font-size:18px;
        }
        .ov-portal-name{font-size:14px;font-weight:700;color:#dde1e9}
        .ov-portal-sub{font-size:11px;color:#4a5568;margin-top:1px}
        .ov-portal-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ov-stat-box{background:#12122a;border-radius:7px;padding:12px}
        .ov-stat-val{font-size:22px;font-weight:700;color:#dde1e9;line-height:1}
        .ov-stat-lbl{font-size:10px;color:#4a5568;margin-top:3px}
        .ov-stat-val.teal{color:#26A9E1}
        .ov-stat-val.green{color:#4ade80}
        .ov-stat-val.amber{color:#fb923c}
        .ov-stat-val.red{color:#ef4444}

        .ov-alerts-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px}
        .ov-alert-card{
          background:#0e0e1e;border-radius:10px;padding:18px;border:1px solid #1e1e3a;
        }
        .ov-alert-title{font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:6px}
        .ov-alert-big{font-size:36px;font-weight:800;margin-bottom:4px}
        .ov-alert-desc{font-size:11px;color:#4a5568}

        .ov-footer{text-align:center;padding:20px;color:#2a2a4a;font-size:10.5px}

        .ov-reminder-bar{
          display:flex;align-items:center;justify-content:space-between;
          background:#0e0e1e;border:1px solid #1e1e3a;border-radius:10px;
          padding:14px 20px;margin-bottom:24px;
        }
        .ov-reminder-info{font-size:12px;color:#94a3b8}
        .ov-reminder-info strong{color:#dde1e9;font-size:13px;display:block;margin-bottom:2px}
        .ov-reminder-right{display:flex;align-items:center;gap:10px}
        .ov-to-input{
          background:#12122a;border:1px solid #26264a;border-radius:7px;
          padding:8px 12px;font-size:13px;color:#dde1e9;width:240px;outline:none;
        }
        .ov-to-input::placeholder{color:#4a5568}
        .ov-to-input:focus{border-color:#26A9E1}
        .ov-send-btn{
          background:#26A9E1;color:#fff;border:none;border-radius:7px;
          padding:8px 20px;font-size:13px;font-weight:600;cursor:pointer;
          display:flex;align-items:center;gap:8px;transition:background .2s;white-space:nowrap;
        }
        .ov-send-btn:hover{background:#1d8fc0}
        .ov-send-btn:disabled{background:#1a1a3a;color:#4a5568;cursor:not-allowed}
      `}</style>
      {msgCtx}
      <div className="ov-root">
        {/* HERO */}
        <div className="ov-hero">
          <div className="ov-hero-title">Gatronova Legal Management Portal</div>
          <div className="ov-hero-sub">Centralised view across Litigation, Contracts, and Intellectual Property</div>
          <div className="ov-hero-meta">
            <span className="ov-hero-badge">⚖ Litigation</span>
            <span className="ov-hero-badge">📄 Contracts</span>
            <span className="ov-hero-badge">💡 IP Management</span>
          </div>
        </div>

        {/* THREE PORTALS */}
        <div className="ov-portals">
          {/* LITIGATION */}
          <a href="/dashboard/litigation" className="ov-portal-card">
            <div className="ov-portal-hd">
              <div className="ov-portal-ico" style={{background:'rgba(29,28,85,.6)',border:'1px solid #26264a'}}>⚖</div>
              <div>
                <div className="ov-portal-name">Litigation</div>
                <div className="ov-portal-sub">Active case management</div>
              </div>
            </div>
            <div className="ov-portal-stats">
              <div className="ov-stat-box">
                <div className="ov-stat-val teal">{lit?.total ?? '—'}</div>
                <div className="ov-stat-lbl">Total Cases</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val amber">{lit?.pending ?? '—'}</div>
                <div className="ov-stat-lbl">Pending</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val green">{lit?.disposed ?? '—'}</div>
                <div className="ov-stat-lbl">Disposed</div>
              </div>
              <div className="ov-stat-box">
                <div className={`ov-stat-val${(lit?.hearingsCritical ?? 0) > 0 ? ' red' : ''}`}>{lit?.hearingsUpcoming ?? '—'}</div>
                <div className="ov-stat-lbl">Hearings (7d)</div>
              </div>
            </div>
          </a>

          {/* CONTRACTS */}
          <a href="/dashboard/contracts" className="ov-portal-card">
            <div className="ov-portal-hd">
              <div className="ov-portal-ico" style={{background:'rgba(16,64,50,.6)',border:'1px solid #1e3a30'}}>📄</div>
              <div>
                <div className="ov-portal-name">Contracts</div>
                <div className="ov-portal-sub">Contract lifecycle tracking</div>
              </div>
            </div>
            <div className="ov-portal-stats">
              <div className="ov-stat-box">
                <div className="ov-stat-val teal">{con?.total ?? '—'}</div>
                <div className="ov-stat-lbl">Total Contracts</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val green">{con?.ongoing ?? '—'}</div>
                <div className="ov-stat-lbl">Ongoing</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val" style={{color:'#64748b'}}>{con?.expired ?? '—'}</div>
                <div className="ov-stat-lbl">Expired</div>
              </div>
              <div className="ov-stat-box">
                <div className={`ov-stat-val${(con?.expiringCritical ?? 0) > 0 ? ' red' : ' amber'}`}>{con?.expiringSoon ?? '—'}</div>
                <div className="ov-stat-lbl">Expiring (30d)</div>
              </div>
            </div>
          </a>

          {/* IP */}
          <a href="/dashboard/ip" className="ov-portal-card">
            <div className="ov-portal-hd">
              <div className="ov-portal-ico" style={{background:'rgba(50,30,70,.6)',border:'1px solid #3a1e4a'}}>💡</div>
              <div>
                <div className="ov-portal-name">IP Management</div>
                <div className="ov-portal-sub">Trademark, Patent, Copyright</div>
              </div>
            </div>
            <div className="ov-portal-stats">
              <div className="ov-stat-box">
                <div className="ov-stat-val teal">{ip?.total ?? '—'}</div>
                <div className="ov-stat-lbl">Total IP</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val green">{ip?.active ?? '—'}</div>
                <div className="ov-stat-lbl">Active</div>
              </div>
              <div className="ov-stat-box">
                <div className="ov-stat-val amber">{ip?.trademarks ?? '—'}</div>
                <div className="ov-stat-lbl">Trademarks</div>
              </div>
              <div className="ov-stat-box">
                <div className={`ov-stat-val${(ip?.expiringSoon ?? 0) > 0 ? ' amber' : ''}`}>{ip?.expiringSoon ?? '—'}</div>
                <div className="ov-stat-lbl">Expiring (90d)</div>
              </div>
            </div>
          </a>
        </div>

        {/* REMINDER BAR */}
        <div className="ov-reminder-bar">
          <div className="ov-reminder-info">
            <strong>Reminders — Email &amp; WhatsApp</strong>
            Send a consolidated alert covering critical hearings, expiring contracts, and IP renewals. Email goes to the address below (or REMINDER_TO); WhatsApp goes to the number(s) configured in REMINDER_WHATSAPP_TO.
          </div>
          <div className="ov-reminder-right">
            <input
              className="ov-to-input"
              type="email"
              placeholder="Recipient (blank = uses REMINDER_TO in .env.local)"
              value={reminderTo}
              onChange={e => setReminderTo(e.target.value)}
              disabled={sending}
            />
            <button className="ov-send-btn" onClick={sendReminder} disabled={sending}>
              {sending ? '⏳ Sending…' : '📧 Send'}
            </button>
          </div>
        </div>

        {/* ALERT SUMMARY */}
        <div className="ov-alerts-row">
          <div className="ov-alert-card">
            <div className="ov-alert-title">🔴 Critical Hearings</div>
            <div className="ov-alert-big" style={{color:'#ef4444'}}>{lit?.hearingsCritical ?? 0}</div>
            <div className="ov-alert-desc">Hearings within 3 days requiring immediate attention</div>
          </div>
          <div className="ov-alert-card">
            <div className="ov-alert-title">🟠 Contracts Expiring</div>
            <div className="ov-alert-big" style={{color:'#fb923c'}}>{con?.expiringCritical ?? 0}</div>
            <div className="ov-alert-desc">Contracts expiring within 7 days</div>
          </div>
          <div className="ov-alert-card">
            <div className="ov-alert-title">🟡 IP Renewals</div>
            <div className="ov-alert-big" style={{color:'#facc15'}}>{ip?.expiringSoon ?? 0}</div>
            <div className="ov-alert-desc">IP records expiring within 90 days needing renewal</div>
          </div>
        </div>

        {/* TOTAL EXPOSURE */}
        {lit && (
          <div style={{background:'#0e0e1e',border:'1px solid #1e1e3a',borderRadius:'10px',padding:'20px',marginBottom:'24px'}}>
            <div style={{fontSize:'12px',fontWeight:600,color:'#94a3b8',marginBottom:'12px'}}>Litigation Financial Exposure</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              <div>
                <div style={{fontSize:'11px',color:'#4a5568',marginBottom:'4px'}}>Total Amount Involved</div>
                <div style={{fontSize:'24px',fontWeight:'800',color:'#26A9E1'}}>{fmtPKR(lit.totalAmountInvolved)}</div>
              </div>
              <div>
                <div style={{fontSize:'11px',color:'#4a5568',marginBottom:'4px'}}>Total Professional Cost</div>
                <div style={{fontSize:'24px',fontWeight:'800',color:'#4ade80'}}>{fmtPKR(lit.totalProfessionalCost)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="ov-footer">Gatronova Legal Management Portal · Confidential · {new Date().getFullYear()}</div>
      </div>
    </>
  );
}
