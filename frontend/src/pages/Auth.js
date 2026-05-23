import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FileText, Linkedin } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api, { formatApiError } from '../api';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfMode, setPdfMode] = useState(false);
  const pdfRef = useRef(null);
  const { login, register, setUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    setError('');
    setPdfFile(null);
    setPdfMode(false);
  }, [mode]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (pdfMode && mode === 'register') {
        // Register-from-PDF flow
        if (!pdfFile) {
          setError('drop a LinkedIn PDF first.');
          setBusy(false);
          return;
        }
        const form = new FormData();
        form.append('pdf', pdfFile);
        const { data } = await api.post(
          `/auth/register-from-pdf?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 }
        );
        localStorage.setItem('careeros_token', data.token);
        setUser(data.user);
      } else if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      nav('/app/browse', { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setMode('login');
    setPdfMode(false);
    setEmail('demo@careeros.io');
    setPassword('demo1234');
  }

  function enableLinkedInMode() {
    setMode('register');
    setPdfMode(true);
  }

  return (
    <div className="landing-page" data-testid="auth-page">
      <div className="landing-container" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="hero">
          <div className="logo-mark" style={{ marginBottom: 24 }}>
            <span className="logo-icon">⬡</span>
            <div className="logo-text">
              <span className="logo-name">CareerOS</span>
              <span className="logo-sub">// terminal access</span>
            </div>
          </div>
          <h1 className="hero-title" style={{ fontSize: 44 }}>
            {pdfMode ? (<>Drop your<br /><span className="text-cyan">LinkedIn PDF</span>,<br />we'll do the rest.</>)
              : mode === 'login' ? (<>Welcome back,<br /><span className="text-amber">you magnificent disaster.</span></>)
              : (<>Make an account,<br /><span className="text-cyan">join the unhirables.</span></>)}
          </h1>
          <p className="hero-subtitle">
            {pdfMode
              ? "no questions, no résumé builder slog. give us your LinkedIn export and we'll auto-fill everything. then we rank every job for you."
              : mode === 'login'
              ? "sign in to see your saved jobs and how many recruiters have left you on read."
              : "30 seconds. no credit card. no 'we'll be in touch'."}
          </p>
          <div className="hero-feature-list">
            <div className="hero-feature">→ Upload LinkedIn PDF · AI parses it</div>
            <div className="hero-feature">→ Honest match scores (no copium)</div>
            <div className="hero-feature">→ Cover letters that don't sound AI</div>
            <div className="hero-feature">→ Export your whole career in 1 click</div>
          </div>
          <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 14 }} onClick={fillDemo} data-testid="auth-fill-demo-btn">
            Use demo account (no commitment, like your last 3 ex's)
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' && !pdfMode ? 'active' : ''}`} onClick={() => { setMode('login'); setPdfMode(false); }} data-testid="auth-tab-login">LOG IN</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setPdfMode(false); }} data-testid="auth-tab-register">SIGN UP</button>
          </div>

          {/* Continue with LinkedIn PDF — primary onboarding */}
          {mode === 'register' && !pdfMode && (
            <button
              type="button"
              onClick={enableLinkedInMode}
              data-testid="auth-linkedin-btn"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#0a66c2', color: '#fff', border: '1px solid #0a66c2',
                padding: '12px 18px', borderRadius: 4, fontSize: 13, fontWeight: 700,
                letterSpacing: 0.5, fontFamily: 'var(--font-mono)', marginBottom: 14,
                cursor: 'pointer', transition: 'all var(--trans-fast)',
              }}
            >
              <Linkedin size={16} /> CONTINUE WITH LINKEDIN PDF
            </button>
          )}
          {mode === 'register' && !pdfMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
              <span>OR · WITH EMAIL</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
            </div>
          )}

          <h2 className="auth-title">
            {pdfMode ? 'continue with linkedin pdf.' : mode === 'login' ? 'sign in.' : 'we have cookies (figurative).'}
          </h2>
          <p className="auth-subtitle">
            {pdfMode ? '// account + profile in 1 step' : mode === 'login' ? '// the algorithm missed you' : '// 30 sec setup. fr.'}
          </p>

          <form onSubmit={submit}>
            {pdfMode && (
              <div className="form-group">
                <label className="form-label">LinkedIn PDF</label>
                <div
                  onClick={() => pdfRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setPdfFile(f); }}
                  style={{
                    border: `2px dashed ${pdfFile ? 'var(--emerald)' : 'var(--cyan-glow)'}`,
                    borderRadius: 4, padding: 18, background: pdfFile ? 'var(--emerald-dim)' : 'var(--cyan-dim)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    fontSize: 12, fontFamily: 'var(--font-mono)', color: pdfFile ? 'var(--emerald)' : 'var(--cyan)',
                  }}
                  data-testid="auth-pdf-drop"
                >
                  <FileText size={20} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {pdfFile
                      ? <><strong>{pdfFile.name}</strong><br /><span style={{ opacity: 0.7 }}>{(pdfFile.size / 1024).toFixed(0)} KB · click to change</span></>
                      : <>click or drag your LinkedIn PDF here<br /><span style={{ opacity: 0.6 }}>(LinkedIn → More → Save to PDF)</span></>}
                  </div>
                </div>
                <input
                  ref={pdfRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setPdfFile(e.target.files?.[0])}
                  data-testid="auth-pdf-input"
                />
              </div>
            )}
            {mode === 'register' && !pdfMode && (
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="goes by..." data-testid="auth-input-name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@unemployment.gov (jk)" data-testid="auth-input-email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" data-testid="auth-input-password" />
              {mode === 'register' && <span className="form-hint">6+ chars. don't reuse the one from that breach.</span>}
            </div>
            <div className="form-error" data-testid="auth-error">{error}</div>
            <button type="submit" className="btn-primary btn-block" disabled={busy} data-testid="auth-submit-btn">
              {busy ? (pdfMode ? 'CLAUDE IS READING…' : 'LOADING…')
                : pdfMode ? 'CREATE + PARSE PDF'
                : mode === 'login' ? 'LOG ME IN'
                : 'YEET, MAKE ACCOUNT'} <ArrowRight size={14} />
            </button>
          </form>
          <div className="auth-footer">
            {pdfMode
              ? <>changed your mind? <a onClick={() => setPdfMode(false)} data-testid="auth-back-to-email">use email instead →</a></>
              : mode === 'login'
              ? <>new here? <a onClick={() => setMode('register')} data-testid="auth-switch-to-register">make an account →</a></>
              : <>already on the grind? <a onClick={() => setMode('login')} data-testid="auth-switch-to-login">log in →</a></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
