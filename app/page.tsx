'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (!url.trim()) {
      setError('> ERROR: Provide a valid LinkedIn URL.');
      return;
    }
    if (!url.includes('linkedin.com/in/')) {
      setError('> ERROR: Only linkedin.com/in/ profile links are supported.');
      return;
    }
    setError('');
    setLoading(true);
    // Pass the URL to the analyze page via query param
    router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <body className="landing-page">
      <div className="scanlines" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <div className="landing-container">
        <nav className="landing-nav">
          <div className="logo-mark">
            <span className="logo-icon">⬡</span>
            <div className="logo-text">
              <span className="logo-name">CareerOS</span>
              <span className="logo-sub">v3.0.0 — powered by Apify</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#">Product</a>
            <a href="#">Methodology</a>
            <a href="#">Pricing</a>
          </div>
        </nav>

        <main className="hero">
          <div className="hero-badge font-mono">
            <span className="pulse-dot" /> SYSTEM ONLINE — LIVE DATA MODE
          </div>
          <h1 className="hero-title">
            Upload your career.<br />
            <span className="text-amber">Extract your future.</span>
          </h1>
          <p className="hero-subtitle">
            CareerOS uses real-time algorithmic analysis to map your professional profile,
            score your LinkedIn presence, and predict your next career move. Paste your
            LinkedIn URL to initialize the extraction terminal.
          </p>

          <div className="hero-input-area">
            <div className="input-wrapper">
              <Link size={18} />
              <input
                type="text"
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoComplete="off"
                disabled={loading}
              />
              <button
                id="extractBtn"
                className="btn-primary font-mono"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'INITIALIZING...' : 'INITIALIZE'} <ArrowRight size={14} />
              </button>
            </div>
            <p className="input-hint font-mono" style={{ color: 'var(--rose)' }}>
              {error}
            </p>
          </div>
        </main>

        <div className="hero-visual">
          <div className="visual-card">
            <div className="card-header border-bottom">
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                // LIVE_MONITOR
              </span>
            </div>
            <div className="visual-grid">
              <div className="v-cell pulse-1" />
              <div className="v-cell pulse-2" />
              <div className="v-cell pulse-3" />
              <div className="v-cell pulse-1" />
            </div>
          </div>
        </div>
      </div>
    </body>
  );
}
