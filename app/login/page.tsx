'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    if (hasToken) router.replace('/dashboard');
  }, [router]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Invalid credentials');
      setLoading(false);
      return;
    }

    document.cookie = `token=${data.token}; path=/; max-age=28800`;
    router.push('/dashboard');
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes formIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.10; }
          50%       { opacity: 0.25; }
        }

        .login-root {
          min-height: 100vh; width: 100%; display: flex;
          background: linear-gradient(110deg,#1D1C55 0%,#181750 20%,#111128 42%,#0e0e1c 58%,#1a1a1a 100%);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px; overflow: hidden; position: relative;
        }

        .lp {
          width: 46%; min-height: 100vh; padding: 44px 52px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
          animation: panelIn 0.8s cubic-bezier(.22,1,.36,1) both;
          mask-image: linear-gradient(to right, black 55%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 55%, transparent 100%);
        }
        .geo  { animation: pulse 5s ease-in-out infinite; }
        .geo2 { animation: pulse 5s ease-in-out 2.2s infinite; }

        .lp-logo { position: relative; z-index: 2; }
        .lp-logo img { height: 38px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }

        .lp-hero { position: relative; z-index: 2; }
        .lp-hero h1 {
          font-size: 40px; font-weight: 800; color: #fff;
          line-height: 1.1; letter-spacing: -0.035em; margin-bottom: 16px;
        }
        .lp-hero h1 em { font-style: normal; color: #26A9E1; text-shadow: 0 0 40px rgba(38,169,225,0.55); }
        .lp-hero p { font-size: 13px; color: rgba(255,255,255,0.40); line-height: 1.7; max-width: 270px; }

        .lp-stats { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .stat { border-top: 1px solid rgba(255,255,255,0.10); padding-top: 12px; animation: fadeUp 0.6s both; }
        .stat:nth-child(1) { animation-delay: 0.5s; }
        .stat:nth-child(2) { animation-delay: 0.65s; }
        .stat:nth-child(3) { animation-delay: 0.80s; }
        .stat-val { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.04em; line-height: 1; }
        .stat-lbl { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 4px; }

        .rp {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 48px 60px;
          animation: formIn 0.8s cubic-bezier(.22,1,.36,1) 0.15s both;
        }
        .rp-inner { width: 100%; max-width: 380px; }

        .lock-box {
          width: 52px; height: 52px;
          background: rgba(38,169,225,0.10); border: 1px solid rgba(38,169,225,0.22);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 26px;
        }
        .rp-title { font-size: 28px; font-weight: 800; color: #e0e0e0; letter-spacing: -0.03em; margin-bottom: 5px; }
        .rp-sub   { font-size: 12px; color: #555; margin-bottom: 32px; line-height: 1.5; }

        .field { margin-bottom: 16px; }
        .field-label { display: block; font-size: 10px; font-weight: 700; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .input-wrap { position: relative; }
        .login-input {
          width: 100%; padding: 12px 14px;
          border: 1px solid #383838; border-radius: 8px;
          font-size: 13px; background: rgba(255,255,255,0.04); color: #e0e0e0;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
        }
        .login-input:focus { border-color: #26A9E1; box-shadow: 0 0 0 3px rgba(38,169,225,0.12); }
        .login-input::placeholder { color: #404040; }
        .login-input.has-toggle { padding-right: 44px; }

        .toggle-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #555; padding: 4px; display: flex; align-items: center; transition: color 0.15s;
        }
        .toggle-btn:hover { color: #26A9E1; }

        .field-footer { display: flex; justify-content: flex-end; margin-top: 7px; }
        .forgot-link { font-size: 11px; color: #26A9E1; text-decoration: none; transition: opacity 0.15s; }
        .forgot-link:hover { opacity: 0.75; text-decoration: underline; }

        .err-box {
          background: rgba(92,26,26,0.85); color: #f87171;
          border: 1px solid rgba(127,29,29,0.8); border-radius: 8px;
          padding: 10px 14px; font-size: 12px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }

        .sign-btn {
          width: 100%; padding: 13px; background: #26A9E1; color: white;
          border: none; border-radius: 9px;
          font-size: 13px; font-weight: 700; font-family: inherit;
          cursor: pointer; margin-top: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(38,169,225,0.30); letter-spacing: 0.01em;
        }
        .sign-btn:hover:not(:disabled) { background: #1a96cc; transform: translateY(-1px); box-shadow: 0 6px 32px rgba(38,169,225,0.45); }
        .sign-btn:active:not(:disabled) { transform: translateY(0); }
        .sign-btn:disabled { background: #1a8fc4; cursor: not-allowed; box-shadow: none; opacity: 0.7; }

        .rp-foot { text-align: center; font-size: 11px; color: #444; margin-top: 22px; }
        .rp-foot a { color: #26A9E1; text-decoration: none; }
        .rp-foot a:hover { text-decoration: underline; }

        .rp-copy { position: absolute; bottom: 22px; right: 36px; font-size: 10px; color: #2a2a2a; }
      `}</style>

      {/* Runs outside React — handles bfcache back-button restore */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function checkAuth() {
            if (document.cookie.indexOf('token=') !== -1) {
              window.location.replace('/dashboard');
            }
          }
          checkAuth();
          window.addEventListener('pageshow', function(e) {
            if (e.persisted) checkAuth();
          });
        })();
      `}} />

      <div className="login-root">
        {/* LEFT PANEL */}
        <div className="lp">
          <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none' }}
            viewBox="0 0 500 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g className="geo">
              <circle cx="430" cy="130" r="170" fill="none" stroke="rgba(38,169,225,0.15)" strokeWidth="1"/>
              <circle cx="430" cy="130" r="110" fill="none" stroke="rgba(38,169,225,0.12)" strokeWidth="1"/>
              <circle cx="430" cy="130" r="58"  fill="none" stroke="rgba(38,169,225,0.20)" strokeWidth="1"/>
              <circle cx="430" cy="130" r="9"   fill="rgba(38,169,225,0.45)"/>
            </g>
            <g className="geo2">
              <circle cx="50"  cy="790" r="200" fill="none" stroke="rgba(38,169,225,0.09)" strokeWidth="1"/>
              <circle cx="50"  cy="790" r="130" fill="none" stroke="rgba(38,169,225,0.07)" strokeWidth="1"/>
              <circle cx="50"  cy="790" r="65"  fill="none" stroke="rgba(38,169,225,0.13)" strokeWidth="1"/>
            </g>
            <circle cx="250" cy="450" r="350" fill="none" stroke="rgba(38,169,225,0.05)" strokeWidth="1"/>
          </svg>

          <div className="lp-logo">
            <img src="/gatronova-logo.png" alt="Gatronova Group" />
          </div>

          <div className="lp-hero">
            <h1>Centralised<br />Legal <em>Management</em><br />Portal</h1>
            <p>Unified platform for litigation, contracts, and intellectual property across all 14 group companies.</p>
          </div>

          <div className="lp-stats">
            {[['284','Active cases'],['137','Contracts'],['412','IP assets']].map(([v,l]) => (
              <div key={l} className="stat">
                <div className="stat-val">{v}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <div className="rp-inner">
            <div className="lock-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#26A9E1" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <div className="rp-title">Sign in</div>
            <div className="rp-sub">Enter your credentials to access the Legal Affairs Portal.</div>

            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="field-label">Username</label>
                <div className="input-wrap">
                  <input className="login-input" type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username" required autoComplete="username" />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input className={`login-input has-toggle`}
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" required autoComplete="current-password" />
                  <button type="button" className="toggle-btn"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="field-footer">
                  <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
              </div>

              {error && (
                <div className="err-box">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button className="sign-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to portal'}
              </button>
            </form>

            <div className="rp-foot">
              Need access? <a href="mailto:legal@gatronova.com">legal@gatronova.com</a>
            </div>
          </div>
        </div>

        <div className="rp-copy">© {new Date().getFullYear()} Gatronova Group</div>
      </div>
    </>
  );
}
