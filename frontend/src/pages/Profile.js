import React, { useEffect, useRef, useState } from 'react';
import { Save, X, Plus, FileText, Upload, Download, Sparkles } from 'lucide-react';
import api, { formatApiError } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';

const EMPTY = {
  name: '', headline: '', location: '', bio: '',
  skills: [], preferred_roles: [], preferred_locations: [],
  remote_only: false, resume_text: '',
};

export default function Profile() {
  const { refresh } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [locInput, setLocInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/profile');
      setProfile({ ...EMPTY, ...data });
    } catch (e) {
      console.warn('[Profile] could not load profile:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put('/profile', profile);
      toast('profile saved. the AI now knows you better than your mom.', 'success');
      refresh();
    } catch (e) { toast(formatApiError(e), 'error'); }
    finally { setSaving(false); }
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast('bestie that ain\'t a PDF', 'error');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append('pdf', file);
      const { data } = await api.post('/profile/import-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      setUploadResult(data);
      setProfile({ ...EMPTY, ...(data.profile || {}) });
      refresh();
      toast(`LinkedIn parsed. updated ${data.updated_keys?.length || 0} fields.`, 'success');
    } catch (e) {
      toast(formatApiError(e), 'error');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }

  async function exportData() {
    try {
      const { data } = await api.get('/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careeros-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(`exported ${data.saved_jobs?.length || 0} jobs + your whole profile. ur welcome.`, 'success');
    } catch (e) {
      toast(formatApiError(e), 'error');
    }
  }

  function addChip(field, value, setter) {
    const v = value.trim();
    if (!v) return;
    setProfile((p) => ({ ...p, [field]: [...(p[field] || []), v] }));
    setter('');
  }

  function removeChip(field, idx) {
    setProfile((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  }

  if (loading) return <section className="content-section"><div className="empty-state">loading your origin story...</div></section>;

  return (
    <section className="content-section" data-testid="profile-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">your profile.</h1>
          <p className="section-subtitle">// the AI reads this to know how cooked you are</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="toolbar-action" onClick={exportData} data-testid="profile-export-btn">
            <Download size={12} /> EXPORT MY DATA
          </button>
          <button className="btn-primary" onClick={save} disabled={saving} data-testid="profile-save-btn">
            <Save size={14} /> {saving ? 'SAVING…' : 'SAVE PROFILE'}
          </button>
        </div>
      </div>

      {/* LinkedIn PDF Analyzer */}
      <div
        className="card"
        style={{ marginBottom: 16, border: '1px solid var(--cyan-glow)', background: 'linear-gradient(135deg, var(--cyan-dim) 0%, transparent 80%)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        data-testid="profile-linkedin-card"
      >
        <div className="card-header">
          <h3 className="card-title">
            <Sparkles size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--cyan)' }} />
            LinkedIn PDF Analyzer
          </h3>
          <span className="card-badge" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan-glow)', background: 'var(--cyan-dim)' }}>NEW</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
          Go to your LinkedIn → <strong style={{ color: 'var(--amber)' }}>More → Save to PDF</strong> → drop it here.
          Claude reads the whole thing in ~10s, fills in your skills, headline and resume, then ranks every job in the feed against it.
          No more lying about your TypeScript years.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
          data-testid="profile-pdf-input"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="profile-pdf-upload-btn"
            style={{ color: 'var(--cyan)', borderColor: 'var(--cyan-glow)', background: 'var(--cyan-dim)' }}
          >
            <Upload size={12} /> {uploading ? 'PARSING YOUR LIFE…' : 'UPLOAD LINKEDIN PDF'}
          </button>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            or drag & drop · PDF · max 8 MB
          </span>
        </div>

        {uploadResult && (
          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-200)', borderRadius: 4, border: '1px solid var(--emerald-glow)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', lineHeight: 1.6 }} data-testid="profile-pdf-result">
            ✓ parsed {uploadResult.raw_text_chars} chars · updated: {(uploadResult.updated_keys || []).join(', ')}<br />
            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>scroll down. the AI did the work for you.</span>
          </div>
        )}
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">identity</h3></div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} data-testid="profile-name-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Headline</label>
            <input className="form-input" value={profile.headline || ''} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Senior Glorified Copy-Paste Engineer" data-testid="profile-headline-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={profile.location || ''} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="My parents' basement · Remote" data-testid="profile-location-input" />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">vibes & preferences</h3></div>
          <div className="form-group">
            <label className="form-label">Bio / about</label>
            <textarea className="form-textarea" rows={4} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="2 lines max. who you are. what you build. why recruiters should slide into your DMs." data-testid="profile-bio-input" />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!profile.remote_only} onChange={(e) => setProfile({ ...profile, remote_only: e.target.checked })} data-testid="profile-remote-only-input" />
              <span>Remote-only (the office is a trap)</span>
            </label>
          </div>
        </div>

        <div className="card profile-card-wide">
          <div className="card-header"><h3 className="card-title">skills you actually have (pls be honest)</h3></div>
          <div className="skill-input">
            <input className="form-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('skills', skillInput, setSkillInput))} placeholder="type a skill, hit enter (e.g. React, gaslighting)" data-testid="profile-skill-input" />
            <button className="btn-secondary" onClick={() => addChip('skills', skillInput, setSkillInput)} data-testid="profile-skill-add-btn"><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.skills || []).map((s, i) => (
              <span key={`${s}-${i}`} className="skill-chip" data-testid={`profile-skill-chip-${i}`}>
                {s}
                <button onClick={() => removeChip('skills', i)} aria-label={`Remove ${s}`}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">dream roles</h3></div>
          <div className="skill-input">
            <input className="form-input" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('preferred_roles', roleInput, setRoleInput))} placeholder="e.g. Staff Engineer (cope)" data-testid="profile-role-input" />
            <button className="btn-secondary" onClick={() => addChip('preferred_roles', roleInput, setRoleInput)}><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.preferred_roles || []).map((s, i) => (
              <span key={`${s}-${i}`} className="skill-chip">{s}<button onClick={() => removeChip('preferred_roles', i)}><X size={12} /></button></span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">where you'd live</h3></div>
          <div className="skill-input">
            <input className="form-input" value={locInput} onChange={(e) => setLocInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('preferred_locations', locInput, setLocInput))} placeholder="e.g. Lisbon, Remote, my couch" data-testid="profile-location-pref-input" />
            <button className="btn-secondary" onClick={() => addChip('preferred_locations', locInput, setLocInput)}><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.preferred_locations || []).map((s, i) => (
              <span key={`${s}-${i}`} className="skill-chip">{s}<button onClick={() => removeChip('preferred_locations', i)}><X size={12} /></button></span>
            ))}
          </div>
        </div>

        <div className="card profile-card-wide">
          <div className="card-header">
            <h3 className="card-title"><FileText size={14} style={{ display: 'inline', marginRight: 6 }} /> your origin story (used by the AI)</h3>
            <span className="card-badge" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan-glow)', background: 'var(--cyan-dim)' }}>FEEDS THE BEAST</span>
          </div>
          <textarea className="form-textarea" rows={10} value={profile.resume_text || ''} onChange={(e) => setProfile({ ...profile, resume_text: e.target.value })} placeholder="paste your resume here. or let the LinkedIn PDF analyzer fill this for you. either way: more context = sharper match scores = less ghosting." data-testid="profile-resume-input" />
          <div className="form-hint">pro tip: include role titles, years, what you actually shipped, and the tech stack. don't lie. the AI catches it.</div>
        </div>
      </div>
    </section>
  );
}
