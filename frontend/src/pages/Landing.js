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
              <span className="logo-sub">v3.2.0 — for the unhirable</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#features">The Bit</a>
            <a href="#sources">Sources</a>
            <a onClick={() => nav('/auth')} style={{ cursor: 'pointer' }} data-testid="nav-signin-link">Log In</a>
          </div>
        </nav>

        <main className="hero">
          <div className="hero-badge font-mono">
            <span className="pulse-dot" /> 4 SOURCES SCRAPED · 0 RECRUITERS GHOSTING YOU HERE
          </div>
          <h1 className="hero-title">
            Stop applying to jobs<br />
            <span className="text-amber">that ghost you</span><br />
            <span className="text-cyan">before the interview.</span>
          </h1>
          <p className="hero-subtitle">
            CareerOS scrapes Y&nbsp;Combinator, Wellfound, RemoteOK and Hacker&nbsp;News at the same time,
            uploads your LinkedIn PDF so Claude can actually read it, then tells you — honestly —
            which jobs are worth applying to and which ones are coping. No "we'll get back to you."
          </p>

          <div className="hero-feature-list" id="features">
            <div className="hero-feature"><Zap size={14} />4 job boards, one feed</div>
            <div className="hero-feature"><Brain size={14} />Upload LinkedIn PDF → AI parses</div>
            <div className="hero-feature"><Bookmark size={14} />Track every L (and W)</div>
            <div className="hero-feature"><BarChart2 size={14} />Funnel that humbles you</div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => nav('/auth?mode=register')} data-testid="hero-cta-signup">
              Start coping smarter <ArrowRight size={14} />
            </button>
            <button className="btn-ghost" onClick={() => nav('/auth?mode=login')} data-testid="hero-cta-signin">
              I'm already here
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 18, fontStyle: 'italic', borderLeft: '2px solid var(--amber)', paddingLeft: 12 }}>
            "The first rule of CareerOS: you do not beg companies that don't want you."<br />
            <span style={{ opacity: 0.6 }}>— probably tyler durden, if he was unemployed in 2026</span>
          </div>
        </main>

        <div className="auth-card" id="sources" data-testid="landing-sources-panel">
          <div className="auth-subtitle">// data sources currently scraped</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SourceRow label="RemoteOK" color="var(--cyan)" stat="LIVE · public JSON" />
            <SourceRow label="Y Combinator" color="#ff8c42" stat="1,468 startups hiring rn" />
            <SourceRow label="Hacker News" color="#ff6600" stat="Who's Hiring · monthly" />
            <SourceRow label="Wellfound" color="var(--purple)" stat="URL import · DataDome lol" />
          </div>
          <div style={{ marginTop: 18, padding: 12, background: 'var(--bg-200)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', lineHeight: 1.6, border: '1px solid var(--border-dim)' }}>
            <strong style={{ color: 'var(--amber)' }}>$ POST /api/profile/import-pdf</strong><br />
            → upload your LinkedIn PDF<br />
            → Claude reads it (faster than any recruiter)<br />
            → every job gets a fit score 0-100<br />
            → you stop wasting time on copium roles
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
