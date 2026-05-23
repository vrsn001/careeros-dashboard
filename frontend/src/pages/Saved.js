import React, { useEffect, useState } from 'react';
import { Trash2, ExternalLink, Briefcase, MapPin, Wallet, Globe, RefreshCw } from 'lucide-react';
import api, { formatApiError } from '../api';
import { useToast } from '../Toast';

const STATUSES = [
  { id: 'all', label: 'ALL' },
  { id: 'saved', label: 'SAVED' },
  { id: 'applied', label: 'APPLIED' },
  { id: 'interview', label: 'INTERVIEW' },
  { id: 'offer', label: 'OFFER' },
  { id: 'rejected', label: 'REJECTED' },
];

export default function Saved() {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all' ? '/saved-jobs' : `/saved-jobs?status=${filter}`;
      const { data } = await api.get(url);
      setItems(data.items || []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function updateStatus(id, newStatus) {
    try {
      await api.patch(`/saved-jobs/${id}`, { status: newStatus });
      toast(`status → ${newStatus}. character development.`, 'success');
      load();
    } catch (e) { toast(formatApiError(e), 'error'); }
  }

  async function remove(id) {
    if (!window.confirm('remove this job? no take-backs.')) return;
    try {
      await api.delete(`/saved-jobs/${id}`);
      toast('gone. next.', 'success');
      load();
    } catch (e) { toast(formatApiError(e), 'error'); }
  }

  return (
    <section className="content-section" data-testid="saved-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">saved jobs.</h1>
          <p className="section-subtitle">// {items.length} role{items.length === 1 ? '' : 's'} on the list. now we wait. or apply. up to you.</p>
        </div>
        <button className="toolbar-action" onClick={load} disabled={loading} data-testid="saved-refresh-btn">
          <RefreshCw size={12} /> REFRESH
        </button>
      </div>

      <div className="toolbar">
        <div className="filter-pills" data-testid="saved-filters">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className={`filter-pill ${filter === s.id ? 'active' : ''}`}
              onClick={() => setFilter(s.id)}
              data-testid={`saved-filter-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--rose)' }}>{error}</div>}

      {loading ? (
        <div className="loading-grid" data-testid="saved-loading">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state" data-testid="saved-empty">
          <Briefcase size={40} />
          <div>no saved jobs. probably for the best.<br />head to <strong style={{ color: 'var(--amber)' }}>browse</strong> and find something worth pretending to want.</div>
        </div>
      ) : (
        <div className="saved-jobs-grid" data-testid="saved-jobs-grid">
          {items.map((j) => (
            <div key={j._id} className="job-card" data-testid={`saved-card-${j._id}`}>
              <div className="job-card-header">
                <div className="job-logo">
                  {j.company_logo ? <img src={j.company_logo} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> : (j.company?.[0] || '?').toUpperCase()}
                </div>
                <div className="job-header-info">
                  <div className="job-title">{j.title}</div>
                  <div className="job-company">{j.company}</div>
                </div>
                <span className={`job-source-badge src-${j.status}`}>{j.status?.toUpperCase()}</span>
              </div>
              <div className="job-tags">
                {(j.tags || []).slice(0, 5).map((t, i) => <span key={i} className="job-tag">{t}</span>)}
              </div>
              <div className="job-meta">
                <span className="job-meta-item"><MapPin size={11} />{j.location || '—'}</span>
                {j.remote && <span className="job-meta-item"><Globe size={11} />Remote</span>}
                {j.salary && <span className="job-meta-item job-salary"><Wallet size={11} />{j.salary}</span>}
                <span className="job-meta-item" style={{ marginLeft: 'auto' }}>{j.source}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border-dim)' }}>
                <select className="form-select" style={{ padding: '6px 10px', fontSize: 10, width: 'auto', flex: 1 }} value={j.status} onChange={(e) => updateStatus(j._id, e.target.value)} data-testid={`saved-status-select-${j._id}`}>
                  <option value="saved">SAVED</option>
                  <option value="applied">APPLIED</option>
                  <option value="interview">INTERVIEW</option>
                  <option value="offer">OFFER</option>
                  <option value="rejected">REJECTED</option>
                </select>
                {j.apply_url && (
                  <a className="job-btn job-btn-primary" href={j.apply_url} target="_blank" rel="noopener noreferrer" data-testid={`saved-open-${j._id}`} style={{ flex: '0 0 auto' }}>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button className="job-btn job-btn-rose" onClick={() => remove(j._id)} data-testid={`saved-delete-${j._id}`} style={{ flex: '0 0 auto' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
