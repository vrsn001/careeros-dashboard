import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { formatApiError } from '../api';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    setError('');
  }, [mode]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
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
    setEmail('demo@careeros.io');
    setPassword('demo1234');
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
            {mode === 'login' ? (<>Welcome back,<br /><span className="text-amber">you magnificent disaster.</span></>) : (<>Make an account,<br /><span className="text-cyan">join the unhirables.</span></>)}
          </h1>
          <p className="hero-subtitle">
            {mode === 'login'
              ? "Sign in to see your saved jobs and how many recruiters have left you on read."
              : "30 seconds. No credit card. No 'we'll be in touch'. Just upload your LinkedIn PDF and let the algorithm tell you who you actually are."}
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
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')} data-testid="auth-tab-login">LOG IN</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')} data-testid="auth-tab-register">SIGN UP</button>
          </div>
          <h2 className="auth-title">{mode === 'login' ? 'sign in.' : 'we have cookies (figurative).'}</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? '// the algorithm missed you' : '// 30 sec setup. fr.'}
          </p>
          <form onSubmit={submit}>
            {mode === 'register' && (
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
              {busy ? 'LOADING…' : mode === 'login' ? 'LOG ME IN' : 'YEET, MAKE ACCOUNT'} <ArrowRight size={14} />
            </button>
          </form>
          <div className="auth-footer">
            {mode === 'login'
              ? <>new here? <a onClick={() => setMode('register')} data-testid="auth-switch-to-register">make an account →</a></>
              : <>already on the grind? <a onClick={() => setMode('login')} data-testid="auth-switch-to-login">log in →</a></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
