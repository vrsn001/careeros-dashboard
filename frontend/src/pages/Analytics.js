import React, { useEffect, useRef, useState } from 'react';
import { Send, MailOpen, Video, Trophy, BookmarkCheck, Star } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import api from '../api';

Chart.register(...registerables);

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const funnelRef = useRef(null);
  const sourceRef = useRef(null);
  const chartsRef = useRef([]);

  useEffect(() => {
    api.get('/saved-jobs/stats').then((r) => setStats(r.data)).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (!stats) return;
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    if (funnelRef.current) {
      const s = stats.by_status || {};
      chartsRef.current.push(new Chart(funnelRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'],
          datasets: [{
            data: [s.saved || 0, s.applied || 0, s.interview || 0, s.offer || 0, s.rejected || 0],
            backgroundColor: ['#4B5568', '#22D3EE', '#FFD90F', '#10B981', '#F43F5E'],
            borderColor: '#101620', borderWidth: 3, hoverOffset: 8,
          }],
        },
        options: {
          cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { color: '#8B95A8', padding: 14, boxWidth: 10, font: { family: 'JetBrains Mono', size: 10 } } } },
          animation: { animateScale: true, duration: 1200 },
        },
      }));
    }

    if (sourceRef.current) {
      const src = stats.by_source || {};
      const labels = Object.keys(src);
      const counts = labels.map((k) => src[k]);
      const colors = labels.map((k) => k === 'remoteok' ? '#22D3EE' : k === 'ycombinator' ? '#ff8c42' : k === 'hackernews' ? '#ff6600' : k === 'wellfound' ? '#A855F7' : '#8B95A8');
      chartsRef.current.push(new Chart(sourceRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderRadius: 3 }] },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#8B95A8', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false } },
            y: { ticks: { color: '#8B95A8', font: { family: 'JetBrains Mono', size: 10 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
          },
        },
      }));
    }

    return () => chartsRef.current.forEach((c) => c.destroy());
  }, [stats]);

  const s = stats?.by_status || {};
  const total = s.total || 0;
  const response = s.applied ? Math.round(((s.interview + s.offer) / s.applied) * 100) : 0;

  return (
    <section className="content-section" data-testid="analytics-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">the funnel of cope.</h1>
          <p className="section-subtitle">// where your applications go to die. but make it data-driven.</p>
        </div>
      </div>

      <div className="kpi-grid" data-testid="analytics-kpis">
        <Kpi color="kpi-cyan" icon={<Send size={20} />} value={s.applied || 0} label="apps sent into the void" />
        <Kpi color="kpi-amber" icon={<MailOpen size={20} />} value={s.interview || 0} label="callbacks (real ones)" />
        <Kpi color="kpi-purple" icon={<Video size={20} />} value={`${response}%`} label="response rate" />
        <Kpi color="kpi-emerald" icon={<Trophy size={20} />} value={s.offer || 0} label="offers · brag time" />
        <Kpi color="kpi-rose" icon={<BookmarkCheck size={20} />} value={s.saved || 0} label="saved · cope queue" />
        <Kpi color="kpi-indigo" icon={<Star size={20} />} value={total} label="total roles tracked" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">where they ended up</h3><span className="card-badge font-mono">LIVE</span></div>
          <div style={{ position: 'relative', height: 280 }}><canvas ref={funnelRef} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">by source</h3></div>
          <div style={{ position: 'relative', height: 280 }}><canvas ref={sourceRef} /></div>
        </div>
      </div>

      {total === 0 && (
        <div className="empty-state" data-testid="analytics-empty" style={{ marginTop: 24 }}>
          no jobs tracked. the chart can't graph nothing.<br />save something from <strong style={{ color: 'var(--amber)' }}>browse</strong> first.
        </div>
      )}
    </section>
  );
}

function Kpi({ color, icon, value, label }) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-number">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
