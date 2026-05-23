import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Brain, Bookmark, BarChart2 } from 'lucide-react';

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="landing-page" data-testid="landing-page">
      <div className="landing-container">
        <nav className="landing-nav">
          <div className="logo-mark">
            <span className="logo-icon">⬡</span>
            <div className="logo-text">
              <span className="logo-name">CareerOS</span>
              <span className="logo-sub">v3.1.0 — multi-source</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#sources">Sources</a>
            <a onClick={() => nav('/auth')} style={{ cursor: 'pointer' }} data-testid="nav-signin-link">Sign In</a>
          </div>
        </nav>

        <main className="hero">
          <div className="hero-badge font-mono">
            <span className="pulse-dot" /> SYSTEM ONLINE — 4 SOURCES LIVE
          </div>
          <h1 className="hero-title">
            Stop hunting jobs.<br />
            <span className="text-amber">Let them queue up</span><br />
            <span className="text-cyan">for you.</span>
          </h1>
          <p className="hero-subtitle">
            CareerOS scrapes Y&nbsp;Combinator, Wellfound, RemoteOK and Hacker&nbsp;News
            simultaneously, ranks each job against your profile with Claude Sonnet 4.5,
            and gives you a dashboard that actually feels good to use.
          </p>

          <div className="hero-feature-list" id="features">
            <div className="hero-feature"><Zap size={14} />Live scraping, 600s cache</div>
            <div className="hero-feature"><Brain size={14} />AI match score per job</div>
            <div className="hero-feature"><Bookmark size={14} />Save & track applications</div>
            <div className="hero-feature"><BarChart2 size={14} />Funnel analytics</div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => nav('/auth?mode=register')} data-testid="hero-cta-signup">
              Create account <ArrowRight size={14} />
            </button>
            <button className="btn-ghost" onClick={() => nav('/auth?mode=login')} data-testid="hero-cta-signin">
              Sign in
            </button>
          </div>
        </main>

        <div className="auth-card" id="sources" data-testid="landing-sources-panel">
          <div className="auth-subtitle">// data sources online</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SourceRow label="RemoteOK" color="var(--cyan)" stat="LIVE · JSON API" />
            <SourceRow label="Y Combinator" color="#ff8c42" stat="1,468 hiring companies" />
            <SourceRow label="Hacker News" color="#ff6600" stat="Who's hiring · monthly" />
            <SourceRow label="Wellfound" color="var(--purple)" stat="URL import · scraping limited" />
          </div>
          <div style={{ marginTop: 18, padding: 12, background: 'var(--bg-200)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', lineHeight: 1.6, border: '1px solid var(--border-dim)' }}>
            <strong style={{ color: 'var(--amber)' }}>$ curl /api/jobs/search</strong><br />
            → returns ≈75 normalized roles every 10 min<br />
            → AI match score on demand<br />
            → save/track/apply pipeline
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ label, color, stat }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-200)', border: '1px solid var(--border-dim)', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{stat}</span>
    </div>
  );
}
