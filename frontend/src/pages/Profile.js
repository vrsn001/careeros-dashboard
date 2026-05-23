import React, { useEffect, useState } from 'react';
import { Save, X, Plus, FileText } from 'lucide-react';
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
  const [profile, setProfile] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [locInput, setLocInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/profile');
      setProfile({ ...EMPTY, ...data });
    } catch (e) { /* ignore */ } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put('/profile', profile);
      toast('Profile saved', 'success');
      refresh();
    } catch (e) { toast(formatApiError(e), 'error'); }
    finally { setSaving(false); }
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

  if (loading) return <section className="content-section"><div className="empty-state">Loading…</div></section>;

  return (
    <section className="content-section" data-testid="profile-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Your Profile</h1>
          <p className="section-subtitle">// the AI uses this to score job fit and draft cover letters</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving} data-testid="profile-save-btn">
          <Save size={14} /> {saving ? 'SAVING…' : 'SAVE PROFILE'}
        </button>
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Identity</h3></div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} data-testid="profile-name-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Headline</label>
            <input className="form-input" value={profile.headline || ''} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Senior Full Stack Engineer" data-testid="profile-headline-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={profile.location || ''} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Remote · Bangalore" data-testid="profile-location-input" />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Preferences</h3></div>
          <div className="form-group">
            <label className="form-label">Bio / about</label>
            <textarea className="form-textarea" rows={4} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A 2-line description of who you are and what you build." data-testid="profile-bio-input" />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!profile.remote_only} onChange={(e) => setProfile({ ...profile, remote_only: e.target.checked })} data-testid="profile-remote-only-input" />
              <span>Remote-only roles</span>
            </label>
          </div>
        </div>

        <div className="card profile-card-wide">
          <div className="card-header"><h3 className="card-title">Skills</h3></div>
          <div className="skill-input">
            <input className="form-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('skills', skillInput, setSkillInput))} placeholder="Add skill and press Enter (e.g. React)" data-testid="profile-skill-input" />
            <button className="btn-secondary" onClick={() => addChip('skills', skillInput, setSkillInput)} data-testid="profile-skill-add-btn"><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.skills || []).map((s, i) => (
              <span key={i} className="skill-chip" data-testid={`profile-skill-chip-${i}`}>
                {s}
                <button onClick={() => removeChip('skills', i)} aria-label={`Remove ${s}`}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Target Roles</h3></div>
          <div className="skill-input">
            <input className="form-input" value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('preferred_roles', roleInput, setRoleInput))} placeholder="e.g. Staff Engineer" data-testid="profile-role-input" />
            <button className="btn-secondary" onClick={() => addChip('preferred_roles', roleInput, setRoleInput)}><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.preferred_roles || []).map((s, i) => (
              <span key={i} className="skill-chip">{s}<button onClick={() => removeChip('preferred_roles', i)}><X size={12} /></button></span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Target Locations</h3></div>
          <div className="skill-input">
            <input className="form-input" value={locInput} onChange={(e) => setLocInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('preferred_locations', locInput, setLocInput))} placeholder="e.g. San Francisco" data-testid="profile-location-pref-input" />
            <button className="btn-secondary" onClick={() => addChip('preferred_locations', locInput, setLocInput)}><Plus size={14} /></button>
          </div>
          <div className="skill-chips">
            {(profile.preferred_locations || []).map((s, i) => (
              <span key={i} className="skill-chip">{s}<button onClick={() => removeChip('preferred_locations', i)}><X size={12} /></button></span>
            ))}
          </div>
        </div>

        <div className="card profile-card-wide">
          <div className="card-header">
            <h3 className="card-title"><FileText size={14} style={{ display: 'inline', marginRight: 6 }} /> Resume / long-form context</h3>
            <span className="card-badge" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan-glow)', background: 'var(--cyan-dim)' }}>USED BY AI</span>
          </div>
          <textarea className="form-textarea" rows={10} value={profile.resume_text || ''} onChange={(e) => setProfile({ ...profile, resume_text: e.target.value })} placeholder="Paste your resume content here. The AI will use this to score job fit and draft cover letters." data-testid="profile-resume-input" />
          <div className="form-hint">Tip: include role titles, years of experience, key accomplishments, tech stacks, and what you're looking for next.</div>
        </div>
      </div>
    </section>
  );
}
