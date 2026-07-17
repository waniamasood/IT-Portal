'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fp-root {
          min-height: 100vh; width: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(110deg,#1D1C55 0%,#181750 20%,#111128 42%,#0e0e1c 58%,#1a1a1a 100%);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .fp-card {
          background: #222; border: 1px solid #333; border-radius: 16px;
          padding: 48px 44px; width: 100%; max-width: 420px;
          animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) both;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .fp-icon {
          width: 56px; height: 56px;
          background: rgba(38,169,225,0.10); border: 1px solid rgba(38,169,225,0.22);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
        }
        .fp-title { font-size: 24px; font-weight: 800; color: #e0e0e0; letter-spacing: -0.03em; margin-bottom: 8px; }
        .fp-sub   { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 32px; }
        .fp-box {
          background: rgba(38,169,225,0.06); border: 1px solid rgba(38,169,225,0.18);
          border-radius: 10px; padding: 20px;
          display: flex; gap: 14px; align-items: flex-start; margin-bottom: 28px;
        }
        .fp-box-icon { flex-shrink: 0; margin-top: 1px; }
        .fp-box-title { font-size: 13px; font-weight: 700; color: #e0e0e0; margin-bottom: 4px; }
        .fp-box-text  { font-size: 12px; color: #888; line-height: 1.6; }
        .fp-box-email { color: #26A9E1; font-weight: 600; }
        .back-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px;
          background: transparent; color: #a0a0a0;
          border: 1px solid #383838; border-radius: 9px;
          font-size: 13px; font-weight: 600; font-family: inherit;
          text-decoration: none; transition: border-color 0.2s, color 0.2s;
        }
        .back-btn:hover { border-color: #26A9E1; color: #26A9E1; }
        .fp-copy { text-align: center; margin-top: 24px; font-size: 11px; color: #333; }
      `}</style>

      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#26A9E1" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>

          <div className="fp-title">Forgot password?</div>
          <div className="fp-sub">
            This portal uses administrator-managed credentials. To reset your password, please contact your system administrator.
          </div>

          <div className="fp-box">
            <div className="fp-box-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#26A9E1" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div className="fp-box-title">Contact IT / System Administrator</div>
              <div className="fp-box-text">
                Send an email to <span className="fp-box-email">legal@gatronova.com</span> with your name and department.
                Your credentials will be reset within one business day.
              </div>
            </div>
          </div>

          <Link href="/login" className="back-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Sign In
          </Link>

          <div className="fp-copy">© {new Date().getFullYear()} Gatronova Group</div>
        </div>
      </div>
    </>
  );
}
