import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, RefreshCw, ExternalLink, BookmarkPlus, Sparkles, MapPin, Briefcase, Wallet, X, Copy, Globe, Wand2, Link2, ArrowUpDown,
} from 'lucide-react';
import api, { formatApiError } from '../api';
import { useToast } from '../Toast';

const ALL_SOURCES = [
  { id: 'remoteok', label: 'RemoteOK', color: 'var(--cyan)' },
  { id: 'ycombinator', label: 'Y Combinator', color: '#ff8c42' },
  { id: 'hackernews', label: "HN Who's Hiring", color: '#ff6600' },
  { id: 'wellfound', label: 'Wellfound', color: 'var(--purple)' },
];

export default function Browse() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [activeSources, setActiveSources] = useState(ALL_SOURCES.map((s) => s.id));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [scoreMap, setScoreMap] = useState({}); // external_id → {score, one_liner}
  const [ranking, setRanking] = useState(false);
  const [sortByScore, setSortByScore] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  async function fetchJobs(opts = {}) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (activeSources.length && activeSources.length < ALL_SOURCES.length) {
        params.set('sources', activeSources.join(','));
      }
      params.set('per_source', '25');
      if (opts.refresh) params.set('refresh', 'true');
      const { data } = await api.get(`/jobs/search?${params.toString()}`);
      setData(data);
      // Refreshing invalidates previous rank scores
      setScoreMap({});
      setSortByScore(false);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchSaved() {
    try {
      const { data } = await api.get('/saved-jobs');
      setSavedIds(new Set((data.items || []).map((j) => j.external_id)));
    } catch (e) {
      // Non-fatal: the user can still browse without seeing saved badges.
      console.warn('[Browse] could not load saved jobs:', e);
    }
  }

  useEffect(() => {
    fetchJobs();
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSource(id) {
    setActiveSources((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  const jobs = data?.jobs || [];
  const visibleJobs = useMemo(() => {
    if (!sortByScore || Object.keys(scoreMap).length === 0) return jobs;
    return [...jobs].sort((a, b) => {
      const sa = scoreMap[a.external_id]?.score ?? -1;
      const sb = scoreMap[b.external_id]?.score ?? -1;
      return sb - sa;
    });
  }, [jobs, sortByScore, scoreMap]);

  async function runRank() {
    if (jobs.length === 0) {
      toast('Load jobs first', 'error');
      return;
    }
    setRanking(true);
    try {
      const payload = { jobs: jobs.slice(0, 60).map((j) => ({
        external_id: j.external_id,
        title: j.title,
        company: j.company,
        tags: j.tags,
        location: j.location,
        remote: j.remote,
        description: j.description,
      })) };
      const { data } = await api.post('/ai/rank', payload);
      setScoreMap(data.scores || {});
      setSortByScore(true);
      toast(`judged ${data.ranked_count || 0} jobs. truth hurts.`, 'success');
    } catch (e) {
      toast(formatApiError(e), 'error');
    } finally {
      setRanking(false);
    }
  }

  async function saveJob(job, status = 'saved') {
    try {
      await api.post('/saved-jobs', { job, status });
      setSavedIds((s) => new Set([...s, job.external_id]));
      toast(`saved · ${job.title.slice(0, 30)}… don't ghost yourself.`, 'success');
    } catch (e) {
      toast(formatApiError(e), 'error');
    }
  }

  return (
    <section className="content-section" data-testid="browse-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">browse jobs.</h1>
          <p className="section-subtitle">// 4 sources, 10 min cache, 0 ghost interviews</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="toolbar-action" onClick={() => setImportOpen(true)} data-testid="browse-import-btn">
            <Link2 size={12} /> IMPORT URL
          </button>
          <button className="toolbar-action" onClick={runRank} disabled={ranking || jobs.length === 0} data-testid="browse-rank-btn" style={{ color: 'var(--purple)', borderColor: 'var(--purple-glow)', background: 'var(--purple-dim)' }}>
            <Wand2 size={12} /> {ranking ? 'JUDGING YOU…' : 'GHOST CHECK'}
          </button>
          {Object.keys(scoreMap).length > 0 && (
            <button className="toolbar-action" onClick={() => setSortByScore((s) => !s)} data-testid="browse-sort-btn" style={{ color: sortByScore ? 'var(--amber)' : 'var(--text-secondary)' }}>
              <ArrowUpDown size={12} /> {sortByScore ? 'SORTED · BEST FIRST' : 'SORT BY FIT'}
            </button>
          )}
          <button className="toolbar-action" onClick={() => fetchJobs({ refresh: true })} disabled={loading} data-testid="browse-refresh-btn">
            <RefreshCw size={12} /> {loading ? 'FETCHING…' : 'REFRESH'}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar" data-testid="browse-search-bar">
          <Search size={14} />
          <input
            type="text"
            placeholder="search role, company, stack… (or just type 'remote' and pray)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            data-testid="browse-search-input"
          />
        </div>
        <div className="filter-pills" data-testid="browse-source-filters">
          {ALL_SOURCES.map((s) => (
            <button
              key={s.id}
              className={`filter-pill ${activeSources.includes(s.id) ? 'active' : ''}`}
              onClick={() => toggleSource(s.id)}
              data-testid={`browse-source-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 11 }} onClick={() => fetchJobs()} data-testid="browse-search-submit-btn">
          SEARCH
        </button>
      </div>

      {data?.status && (
        <div className="source-status" data-testid="browse-source-status">
          {ALL_SOURCES.map((s) => {
            const st = data.status[s.id];
            if (!st) return null;
            const count = data.by_source?.[s.id]?.length || 0;
            return (
              <span key={s.id} className="source-chip" data-testid={`browse-status-${s.id}`}>
                <span className={`dot ${st === 'ok' ? 'ok' : st === 'empty' ? 'empty' : 'error'}`} />
                {s.label} — {st === 'ok' ? `${count} roles` : st === 'empty' ? 'no roles' : 'limited / blocked'}
              </span>
            );
          })}
        </div>
      )}

      {error && <div className="empty-state" data-testid="browse-error" style={{ color: 'var(--rose)' }}>{error}</div>}

      {loading && !data ? (
        <div className="loading-grid" data-testid="browse-loading">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : visibleJobs.length === 0 ? (
        <div className="empty-state" data-testid="browse-empty">
          <Briefcase size={40} />
          <div>0 jobs. maybe the job wasn't real anyway.<br />try different keywords or hit refresh.</div>
        </div>
      ) : (
        <div className="jobs-grid" data-testid="browse-jobs-grid">
          {visibleJobs.map((job) => (
            <JobCard
              key={job.external_id}
              job={job}
              saved={savedIds.has(job.external_id)}
              score={scoreMap[job.external_id]}
              onSave={() => saveJob(job)}
              onOpen={() => setActiveJob(job)}
            />
          ))}
        </div>
      )}

      {activeJob && <JobModal job={activeJob} onClose={() => setActiveJob(null)} onSave={(s) => saveJob(activeJob, s)} alreadySaved={savedIds.has(activeJob.external_id)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onSaved={(j) => { setSavedIds((s) => new Set([...s, j.external_id])); toast(`imported · ${j.title?.slice(0,30) || 'job'} · saved.`, 'success'); }} />}
    </section>
  );
}

function scoreColor(s) {
  return s >= 80 ? 'var(--emerald)' : s >= 60 ? 'var(--amber)' : s >= 40 ? 'var(--purple)' : 'var(--rose)';
}

function JobCard({ job, saved, onSave, onOpen, score }) {
  const col = score ? scoreColor(score.score) : null;
  return (
    <div className="job-card" data-testid={`job-card-${job.external_id}`} style={score ? { boxShadow: `inset 3px 0 0 ${col}` } : undefined}>
      {score && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: `color-mix(in srgb, ${col} 15%, transparent)`, border: `1px solid ${col}`, borderRadius: 20, padding: '2px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: col }} data-testid={`job-score-${job.external_id}`}>
          <Sparkles size={11} /> {score.score}
        </div>
      )}
      <div className="job-card-header" style={score ? { paddingRight: 60 } : undefined}>
        <div className="job-logo">
          {job.company_logo ? <img src={job.company_logo} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> : (job.company?.[0] || '?').toUpperCase()}
        </div>
        <div className="job-header-info">
          <div className="job-title" onClick={onOpen} style={{ cursor: 'pointer' }} data-testid={`job-title-${job.external_id}`}>{job.title}</div>
          <div className="job-company">{job.company}</div>
        </div>
        {!score && <span className={`job-source-badge src-${job.source}`}>{job.source === 'ycombinator' ? 'YC' : job.source === 'hackernews' ? 'HN' : job.source === 'remoteok' ? 'RMTOK' : 'WLFND'}</span>}
      </div>
      {score && (
        <div style={{ fontSize: 11, color: col, fontStyle: 'italic', marginBottom: 10, borderLeft: `2px solid ${col}`, paddingLeft: 8 }} data-testid={`job-score-reason-${job.external_id}`}>
          {score.one_liner}
        </div>
      )}
      <div className="job-tags">
        {(job.tags || []).slice(0, 5).map((t, i) => <span key={`${t}-${i}`} className="job-tag">{t}</span>)}
      </div>
      <div className="job-meta">
        <span className="job-meta-item"><MapPin size={11} />{job.location || '—'}</span>
        {job.remote && <span className="job-meta-item"><Globe size={11} />Remote</span>}
        {job.salary && <span className="job-meta-item job-salary"><Wallet size={11} />{job.salary}</span>}
      </div>
      {job.description && <div className="job-description">{job.description}</div>}
      <div className="job-actions">
        <button className="job-btn job-btn-primary" onClick={onOpen} data-testid={`job-open-${job.external_id}`}>
          <Sparkles size={12} /> Details + AI
        </button>
        <button className="job-btn job-btn-ghost" onClick={onSave} disabled={saved} data-testid={`job-save-${job.external_id}`}>
          <BookmarkPlus size={12} /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function JobModal({ job, onClose, onSave, alreadySaved }) {
  const toast = useToast();
  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [cover, setCover] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [tone, setTone] = useState('professional');

  async function runMatch() {
    setMatchLoading(true);
    setMatchError('');
    setMatch(null);
    try {
      const { data } = await api.post('/ai/match', { job });
      setMatch(data);
    } catch (e) {
      setMatchError(formatApiError(e));
    } finally {
      setMatchLoading(false);
    }
  }

  async function runCover() {
    setCoverLoading(true);
    setCoverError('');
    setCover(null);
    try {
      const { data } = await api.post('/ai/cover-letter', { job, tone });
      setCover(data);
    } catch (e) {
      setCoverError(formatApiError(e));
    } finally {
      setCoverLoading(false);
    }
  }

  function copyCover() {
    if (!cover?.cover_letter) return;
    navigator.clipboard.writeText(cover.cover_letter).then(() => toast('copied. paste it and pray.', 'success'));
  }

  const scoreColor = (s) => s >= 80 ? 'var(--emerald)' : s >= 60 ? 'var(--amber)' : s >= 40 ? 'var(--purple)' : 'var(--rose)';

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="job-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close" data-testid="job-modal-close">
          <X size={18} />
        </button>
        <div className="modal-header">
          <div className="modal-title" data-testid="job-modal-title">{job.title}</div>
          <div className="modal-sub">
            {job.company} · <span className={`job-source-badge src-${job.source}`} style={{ marginLeft: 6 }}>{job.source}</span>
            {job.location && <> · {job.location}</>}
            {job.salary && <> · <span style={{ color: 'var(--emerald)' }}>{job.salary}</span></>}
          </div>
        </div>

        <div className="job-tags">{(job.tags || []).map((t, i) => <span key={`${t}-${i}`} className="job-tag">{t}</span>)}</div>

        {job.description && (
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto', padding: 12, background: 'var(--bg-200)', borderRadius: 4, border: '1px solid var(--border-dim)' }} data-testid="job-modal-description">
            {job.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {job.apply_url && (
            <a className="btn-primary" href={job.apply_url} target="_blank" rel="noopener noreferrer" data-testid="job-modal-apply-btn">
              <ExternalLink size={12} /> SEND IT
            </a>
          )}
          <button className="btn-secondary" onClick={() => onSave('saved')} disabled={alreadySaved} data-testid="job-modal-save-btn">
            <BookmarkPlus size={12} /> {alreadySaved ? 'SAVED' : 'SAVE FOR LATER'}
          </button>
          <button className="btn-secondary" onClick={() => onSave('applied')} data-testid="job-modal-mark-applied-btn">
            mark as applied (cope)
          </button>
        </div>

        {/* AI MATCH */}
        <div style={{ marginTop: 22, borderTop: '1px solid var(--border-dim)', paddingTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>am I cooked? — AI match</h3>
            <button className="toolbar-action" onClick={runMatch} disabled={matchLoading} data-testid="job-modal-match-btn">
              <Sparkles size={12} /> {matchLoading ? 'JUDGING…' : match ? 'RE-JUDGE' : 'RUN MATCH'}
            </button>
          </div>
          {matchError && <div style={{ color: 'var(--rose)', fontSize: 12, fontFamily: 'var(--font-mono)' }} data-testid="job-modal-match-error">{matchError}</div>}
          {match && (
            <div className="match-result" data-testid="job-modal-match-result">
              <div className="match-row">
                <div className="match-score-circle" style={{ background: `color-mix(in srgb, ${scoreColor(match.score)} 15%, transparent)`, border: `2px solid ${scoreColor(match.score)}`, color: scoreColor(match.score) }}>
                  <span className="num">{match.score}</span>
                  <span className="label">SCORE</span>
                </div>
                <div>
                  <div className="match-verdict" style={{ color: scoreColor(match.score) }}>{match.verdict}</div>
                  <div className="match-narrative">{match.why_fits}</div>
                </div>
              </div>
              {match.gaps?.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>GAPS TO CLOSE</div>
                  <ul className="match-gaps">{match.gaps.map((g, i) => <li key={`gap-${i}`}>{g}</li>)}</ul>
                </>
              )}
              {match.next_steps && <div className="match-next">→ {match.next_steps}</div>}
            </div>
          )}
        </div>

        {/* AI COVER LETTER */}
        <div style={{ marginTop: 22, borderTop: '1px solid var(--border-dim)', paddingTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>beg with style — cover letter</h3>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select className="form-select" style={{ padding: '6px 10px', fontSize: 11, width: 'auto' }} value={tone} onChange={(e) => setTone(e.target.value)} data-testid="job-modal-cover-tone">
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="casual">Casual</option>
              </select>
              <button className="toolbar-action" onClick={runCover} disabled={coverLoading} data-testid="job-modal-cover-btn">
                <Sparkles size={12} /> {coverLoading ? 'WRITING…' : cover ? 'RE-DRAFT' : 'DRAFT IT'}
              </button>
            </div>
          </div>
          {coverError && <div style={{ color: 'var(--rose)', fontSize: 12, fontFamily: 'var(--font-mono)' }} data-testid="job-modal-cover-error">{coverError}</div>}
          {cover && (
            <div className="cover-output" data-testid="job-modal-cover-output">
              {cover.subject && <div className="cover-subject">subject: {cover.subject}</div>}
              <div className="cover-body">{cover.cover_letter}</div>
              <div className="cover-actions">
                <button className="btn-secondary" onClick={copyCover} data-testid="job-modal-cover-copy-btn"><Copy size={12} /> Copy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ImportModal({ onClose, onSaved }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  async function fetchPreview() {
    setError('');
    setPreview(null);
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/jobs/import', { url: url.trim(), save: false });
      setPreview(data.job);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveIt() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/jobs/import', { url: url.trim(), save: true, status: 'saved' });
      if (data.saved) {
        onSaved(data.job);
        onClose();
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="import-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close" data-testid="import-modal-close">
          <X size={18} />
        </button>
        <div className="modal-header">
          <div className="modal-title">import a wellfound job.</div>
          <div className="modal-sub">// paste a wellfound.com/jobs/… URL — we'll parse it</div>
        </div>

        <div className="form-group">
          <label className="form-label">Wellfound job URL</label>
          <input
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wellfound.com/jobs/12345-senior-glorified-typist"
            onKeyDown={(e) => e.key === 'Enter' && fetchPreview()}
            data-testid="import-modal-url-input"
            autoFocus
          />
          <div className="form-hint">
            heads up: wellfound's bot protection is mid. if the import fails, hit
            <strong style={{ color: 'var(--amber)' }}> open original</strong> and YOLO it manually.
          </div>
        </div>

        {error && <div className="form-error" data-testid="import-modal-error" style={{ minHeight: 0, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={fetchPreview} disabled={loading || !url.trim()} data-testid="import-modal-preview-btn">
            {loading && !preview ? 'FETCHING…' : 'PREVIEW'}
          </button>
          {url.trim() && (
            <a className="btn-ghost" href={url.trim()} target="_blank" rel="noopener noreferrer" data-testid="import-modal-open-original">
              <ExternalLink size={12} /> Open Original
            </a>
          )}
        </div>

        {preview && (
          <div className="match-result" style={{ borderColor: 'var(--cyan-glow)', background: 'var(--bg-200)', marginTop: 16 }} data-testid="import-modal-preview">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <div className="job-logo">{(preview.company?.[0] || '?').toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="job-title" data-testid="import-modal-preview-title">{preview.title}</div>
                <div className="job-company">{preview.company}</div>
              </div>
              <span className="job-source-badge src-wellfound">WLFND</span>
            </div>
            {preview.description && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxHeight: 160, overflowY: 'auto', padding: 10, background: 'var(--bg-base)', borderRadius: 4, border: '1px solid var(--border-dim)', lineHeight: 1.55 }}>
                {preview.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-primary" onClick={saveIt} disabled={loading} data-testid="import-modal-save-btn">
                <BookmarkPlus size={12} /> {loading ? 'SAVING…' : 'SAVE TO PIPELINE'}
              </button>
              <button className="btn-ghost" onClick={() => setPreview(null)} data-testid="import-modal-clear-btn">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
