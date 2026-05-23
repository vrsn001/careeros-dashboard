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
            {mode === 'login' ? (<>Welcome<br /><span className="text-amber">back, operator.</span></>) : (<>Spin up<br /><span className="text-cyan">your job radar.</span></>)}
          </h1>
          <p className="hero-subtitle">
            {mode === 'login'
              ? 'Sign in to access your saved jobs, applications and AI match scores.'
              : 'Create a free account to track jobs, get AI match scores and draft cover letters in seconds.'}
          </p>
          <div className="hero-feature-list">
            <div className="hero-feature">→ 4 job sources scraped live</div>
            <div className="hero-feature">→ Claude Sonnet 4.5 matching</div>
            <div className="hero-feature">→ Save → apply → track pipeline</div>
            <div className="hero-feature">→ Cover letter drafts</div>
          </div>
          <button className="btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 14 }} onClick={fillDemo} data-testid="auth-fill-demo-btn">
            Use demo account (demo@careeros.io)
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')} data-testid="auth-tab-login">SIGN IN</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')} data-testid="auth-tab-register">CREATE ACCOUNT</button>
          </div>
          <h2 className="auth-title">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? '// authenticate to continue' : '// 30 seconds — no credit card'}
          </p>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" data-testid="auth-input-name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@domain.com" data-testid="auth-input-email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" data-testid="auth-input-password" />
              {mode === 'register' && <span className="form-hint">Minimum 6 characters.</span>}
            </div>
            <div className="form-error" data-testid="auth-error">{error}</div>
            <button type="submit" className="btn-primary btn-block" disabled={busy} data-testid="auth-submit-btn">
              {busy ? 'PROCESSING…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={14} />
            </button>
          </form>
          <div className="auth-footer">
            {mode === 'login'
              ? <>No account? <a onClick={() => setMode('register')} data-testid="auth-switch-to-register">Create one →</a></>
              : <>Already registered? <a onClick={() => setMode('login')} data-testid="auth-switch-to-login">Sign in →</a></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
