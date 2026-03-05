'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
    LayoutDashboard, Briefcase, Bookmark, Star, BarChart2, Network,
    Send, MailOpen, Video, Trophy, BookmarkCheck, Bell, Search,
    Sun, Moon, PanelLeftClose, PlusCircle, Share2, RefreshCw, FileText,
    ZoomIn, ZoomOut, LayoutGrid, List, ExternalLink, MapPin,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ---- DEFAULT/DEMO DATA ----
const DEMO_DATA = {
    name: 'Demo User',
    headline: 'Full Stack Engineer',
    location: 'India',
    about: 'A passionate engineer exploring new frontiers in tech.',
    followers: 2100,
    connections: 843,
    profileViews: 1247,
    profilePicture: null,
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'GraphQL', 'Figma'],
    experience: [
        { title: 'Senior Frontend Engineer', company: 'Google', duration: '2022 – Present', location: 'Remote' },
        { title: 'Software Engineer', company: 'Swiggy', duration: '2020 – 2022', location: 'Bangalore' },
        { title: 'Junior Developer', company: 'Startup XYZ', duration: '2019 – 2020', location: 'Delhi' },
    ],
    education: [
        { school: 'IIT Delhi', degree: 'B.Tech', field: 'Computer Science' },
    ],
    certifications: [],
};

type ProfileData = typeof DEMO_DATA;

type Section = 'overview' | 'saved-jobs' | 'bookmarks' | 'linkedin' | 'analytics' | 'mindmap';

function DashboardContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url') || '';
    const isDemo = searchParams.get('demo') === 'true';

    const [profile, setProfile] = useState<ProfileData>(DEMO_DATA);
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [dateStr, setDateStr] = useState('');
    const [isLight, setIsLight] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewGrid, setViewGrid] = useState(true);

    // Chart refs
    const funnelRef = useRef<HTMLCanvasElement>(null);
    const weeklyRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<Chart[]>([]);

    // Extract real data from sessionStorage
    useEffect(() => {
        if (!isDemo) {
            const stored = sessionStorage.getItem('careeros_profile');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setProfile({ ...DEMO_DATA, ...parsed });
                } catch { }
            }
        }
        // Use URL name as fallback
        const match = url.match(/in\/([^/]+)/);
        if (match) {
            const name = match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            setProfile((prev) => ({ ...prev, name: prev.name === 'Demo User' ? name : prev.name }));
        }
    }, [url, isDemo]);

    // Date/time ticker
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setDateStr(now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // Charts
    useEffect(() => {
        if (activeSection !== 'analytics') return;
        chartInstances.current.forEach((c) => c.destroy());
        chartInstances.current = [];

        const chartStyle = {
            color: '#8B95A8',
            borderColor: 'rgba(255,255,255,0.06)',
            tickColor: '#4B5568',
        };

        if (funnelRef.current) {
            chartInstances.current.push(new Chart(funnelRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Applied', 'Responded', 'Interview', 'Offer'],
                    datasets: [{
                        data: [53, 18, 7, 2],
                        backgroundColor: ['rgba(34,211,238,0.8)', 'rgba(255,217,15,0.8)', 'rgba(168,85,247,0.8)', 'rgba(16,185,129,0.8)'],
                        borderWidth: 0,
                    }],
                },
                options: {
                    cutout: '70%',
                    plugins: { legend: { labels: { color: chartStyle.color, boxWidth: 10, font: { family: 'JetBrains Mono', size: 10 } } } },
                },
            }));
        }

        if (weeklyRef.current) {
            chartInstances.current.push(new Chart(weeklyRef.current, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        { label: 'Applications', data: [4, 7, 5, 9, 6, 3, 8], borderColor: '#22D3EE', tension: 0.4, fill: true, backgroundColor: 'rgba(34,211,238,0.05)', pointBackgroundColor: '#22D3EE', pointRadius: 3 },
                        { label: 'Responses', data: [1, 2, 1, 3, 2, 1, 2], borderColor: '#FFD90F', tension: 0.4, fill: true, backgroundColor: 'rgba(255,217,15,0.05)', pointBackgroundColor: '#FFD90F', pointRadius: 3 },
                    ],
                },
                options: {
                    plugins: { legend: { labels: { color: chartStyle.color, boxWidth: 10, font: { family: 'JetBrains Mono', size: 10 } } } },
                    scales: {
                        x: { grid: { color: chartStyle.borderColor }, ticks: { color: chartStyle.tickColor, font: { family: 'JetBrains Mono', size: 10 } } },
                        y: { grid: { color: chartStyle.borderColor }, ticks: { color: chartStyle.tickColor, font: { family: 'JetBrains Mono', size: 10 } } },
                    },
                },
            }));
        }

        return () => chartInstances.current.forEach((c) => c.destroy());
    }, [activeSection]);

    const initials = profile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    const linkedinScore = Math.min(100, Math.max(30,
        50 +
        Math.min(20, (profile.skills?.length || 0) * 2) +
        Math.min(15, (profile.experience?.length || 0) * 3) +
        (profile.about && profile.about.length > 50 ? 10 : 0) +
        (profile.profileViews > 1000 ? 5 : 0)
    ));

    const navItems: { id: Section; label: string; icon: React.ReactNode; badge?: string }[] = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} />, badge: '6' },
        { id: 'saved-jobs', label: 'Saved Jobs', icon: <Briefcase size={16} />, badge: '18' },
        { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={16} />, badge: '12' },
        { id: 'linkedin', label: 'LinkedIn Score', icon: <Star size={16} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
        { id: 'mindmap', label: 'Job Mind Map', icon: <Network size={16} /> },
    ];

    return (
        <body className={isLight ? 'light-mode' : ''}>
            <div className="scanlines" aria-hidden="true" />
            <div className="noise" aria-hidden="true" />

            <div className="app-layout">
                {/* SIDEBAR */}
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
                    <div className="sidebar-header">
                        <div className="logo-mark">
                            <span className="logo-icon">⬡</span>
                            <div className="logo-text">
                                <span className="logo-name">CareerOS</span>
                                <span className="logo-sub">v3.0.0-nextjs</span>
                            </div>
                        </div>
                        <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="Toggle Sidebar">
                            <PanelLeftClose size={18} />
                        </button>
                    </div>

                    <div className="profile-card">
                        <div className="avatar-wrapper">
                            <div className="avatar-ring" />
                            <div className="avatar font-mono" id="profileAvatar">{initials}</div>
                            <span className="status-dot online" />
                        </div>
                        <div className="profile-info">
                            <h2 className="profile-name">{profile.name}</h2>
                            <p className="profile-role">{profile.headline}</p>
                            {profile.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                    <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{profile.location}</span>
                                </div>
                            )}
                            <div className="profile-tags">
                                <span className="tag tag-amber">Open to Work</span>
                            </div>
                        </div>
                    </div>

                    <nav className="sidebar-nav" role="navigation">
                        <span className="nav-label">MODULES</span>
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                                onClick={(e) => { e.preventDefault(); setActiveSection(item.id); setSidebarOpen(false); }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                            </a>
                        ))}
                    </nav>

                    <div className="sidebar-stats">
                        <span className="nav-label">QUICK STATS</span>
                        <div className="stat-row">
                            <span className="stat-label">Profile Views</span>
                            <span className="stat-value cyan">{profile.profileViews.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Connections</span>
                            <span className="stat-value amber">{profile.connections.toLocaleString()}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">LinkedIn Score</span>
                            <span className="stat-value emerald">{linkedinScore}/100</span>
                        </div>
                        <div className="stat-bar-label">Profile Strength</div>
                        <div className="stat-bar-track">
                            <div className="stat-bar-fill" style={{ width: `${linkedinScore}%` }} />
                        </div>
                        <span className="stat-bar-text">{linkedinScore >= 70 ? 'STRONG' : linkedinScore >= 50 ? 'INTERMEDIATE' : 'NEEDS WORK'}</span>
                    </div>

                    <div className="sidebar-footer">
                        <button className="theme-toggle" onClick={() => setIsLight(!isLight)} aria-label="Toggle Theme">
                            {isLight ? <Moon size={14} /> : <Sun size={14} />}
                            <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                        </button>
                    </div>
                </aside>

                {/* MAIN */}
                <main className="main-content" id="mainContent">
                    <header className="topbar">
                        <div className="topbar-left">
                            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                                <LayoutGrid size={20} />
                            </button>
                            <div className="page-breadcrumb">
                                <span id="currentSection">{navItems.find((n) => n.id === activeSection)?.label}</span>
                            </div>
                        </div>
                        <div className="topbar-right">
                            <div className="search-global">
                                <Search size={14} />
                                <input type="text" placeholder="search profile, skills..." autoComplete="off" />
                            </div>
                            <div className="topbar-datetime">{dateStr}</div>
                            <button className="notif-btn" aria-label="Notifications">
                                <Bell size={18} />
                                <span className="notif-dot" />
                            </button>
                        </div>
                    </header>

                    {/* OVERVIEW */}
                    <section className={`content-section ${activeSection === 'overview' ? 'active' : ''}`} id="overview">
                        <div className="section-header">
                            <h1 className="section-title">Dashboard Overview</h1>
                            <p className="section-subtitle font-mono">// {profile.name}&apos;s career intelligence terminal</p>
                        </div>
                        <div className="kpi-grid">
                            <KpiCard color="kpi-cyan" icon={<Send size={20} />} value={53} label="Applications Sent" trend="↑ 12% this week" trendType="up" />
                            <KpiCard color="kpi-amber" icon={<MailOpen size={20} />} value={18} label="Responses Received" trend="↑ 5% this week" trendType="up" />
                            <KpiCard color="kpi-purple" icon={<Video size={20} />} value={7} label="Interviews Scheduled" trend="↑ 2 new" trendType="up" />
                            <KpiCard color="kpi-emerald" icon={<Trophy size={20} />} value={2} label="Offers Received" trend="— pending" trendType="neutral" />
                            <KpiCard color="kpi-rose" icon={<BookmarkCheck size={20} />} value={18} label="Saved for Later" trend="— 5 expiring" trendType="neutral" />
                            <KpiCard color="kpi-indigo" icon={<Star size={20} />} value={linkedinScore} label="LinkedIn Score" trend={`↑ STRONG Profile`} trendType="up" />
                        </div>

                        <div className="overview-row">
                            <div className="card card-lg">
                                <div className="card-header">
                                    <h3 className="card-title">Experience</h3>
                                    <span className="card-badge font-mono">LIVE</span>
                                </div>
                                <div className="activity-feed">
                                    {profile.experience.map((exp, i) => (
                                        <div key={i} className="activity-item">
                                            <div className="activity-dot" style={{ background: ['var(--cyan)', 'var(--amber)', 'var(--purple)'][i % 3] }} />
                                            <div className="activity-body">
                                                <div className="activity-text"><strong>{exp.title}</strong> at {exp.company}</div>
                                                <div className="activity-time">{exp.duration} · {exp.location}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><h3 className="card-title">Skills</h3></div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} className="job-tag" style={{ fontSize: 10 }}>{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SAVED JOBS */}
                    <section className={`content-section ${activeSection === 'saved-jobs' ? 'active' : ''}`} id="saved-jobs">
                        <div className="section-header">
                            <h1 className="section-title">Saved Jobs</h1>
                            <p className="section-subtitle font-mono">// positions matched to {profile.name}&apos;s profile</p>
                        </div>
                        <div className="toolbar">
                            <div className="search-bar"><Search size={14} /><input type="text" placeholder="search by role, company..." /></div>
                            <div className="view-toggle">
                                <button className={`view-btn ${viewGrid ? 'active' : ''}`} onClick={() => setViewGrid(true)} aria-label="Grid view"><LayoutGrid size={16} /></button>
                                <button className={`view-btn ${!viewGrid ? 'active' : ''}`} onClick={() => setViewGrid(false)} aria-label="List view"><List size={16} /></button>
                            </div>
                        </div>
                        <div className={`jobs-grid ${!viewGrid ? 'list-view' : ''}`} id="jobsGrid">
                            {[
                                { title: 'Senior Frontend Engineer', company: 'Google', status: 'INTERVIEW', statusClass: 'status-interview', tags: ['React', 'TypeScript', 'Remote'], salary: '₹45–60 LPA', color: '#4285F4' },
                                { title: 'Full Stack Developer', company: 'Swiggy', status: 'OFFER', statusClass: 'status-offer', tags: ['Node.js', 'MongoDB', 'Hybrid'], salary: '₹35–50 LPA', color: '#FC8019' },
                                { title: 'Software Engineer III', company: 'Paytm', status: 'APPLIED', statusClass: 'status-applied', tags: ['Java', 'Spring Boot', 'Onsite'], salary: '₹25–40 LPA', color: '#00B9F1' },
                            ].map((job, i) => (
                                <div key={i} className="job-card">
                                    <div className="job-card-header">
                                        <div className="job-logo" style={{ background: job.color + '22', color: job.color }}>{job.company[0]}</div>
                                        <div className="job-header-info">
                                            <div className="job-title">{job.title}</div>
                                            <div className="job-company font-mono">{job.company}</div>
                                        </div>
                                        <span className={`job-status font-mono ${job.statusClass}`}>{job.status}</span>
                                    </div>
                                    <div className="job-tags">{job.tags.map((t, j) => <span key={j} className="job-tag">{t}</span>)}</div>
                                    <div className="job-meta"><span className="job-salary">{job.salary}</span></div>
                                    <div className="job-actions">
                                        <button className="job-btn job-btn-primary"><ExternalLink size={12} /> View Job</button>
                                        <button className="job-btn job-btn-ghost">Track</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* BOOKMARKS */}
                    <section className={`content-section ${activeSection === 'bookmarks' ? 'active' : ''}`} id="bookmarks">
                        <div className="section-header">
                            <h1 className="section-title">Bookmarked Posts</h1>
                            <p className="section-subtitle font-mono">// curated reading list</p>
                        </div>
                        <div className="posts-grid">
                            {[
                                { title: '10 things I learned after 100 job rejections', tag: 'CAREER', tagClass: 'cat-career', source: 'LinkedIn', time: '2h ago' },
                                { title: 'System Design Interview: Complete Guide 2026', tag: 'TECH', tagClass: 'cat-tech', source: 'Medium', time: '1d ago' },
                                { title: 'How to negotiate a 40% salary increase', tag: 'SALARY', tagClass: 'cat-salary', source: 'Newsletter', time: '3d ago' },
                            ].map((post, i) => (
                                <div key={i} className="post-card">
                                    <div className="post-source">
                                        <span className="post-source-dot" style={{ background: 'var(--cyan)' }} />
                                        {post.source} · {post.time}
                                        <span className={`post-tag font-mono ${post.tagClass}`}>{post.tag}</span>
                                    </div>
                                    <div className="post-title">{post.title}</div>
                                    <div className="post-footer">
                                        <span />
                                        <button className="post-read-btn font-mono">READ →</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* LINKEDIN SCORE */}
                    <section className={`content-section ${activeSection === 'linkedin' ? 'active' : ''}`} id="linkedin">
                        <div className="section-header">
                            <h1 className="section-title">LinkedIn Profile Score</h1>
                            <p className="section-subtitle font-mono">// profile strength analysis for {profile.name}</p>
                        </div>
                        <div className="linkedin-layout">
                            <div className="card linkedin-score-card">
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: 80, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber)', lineHeight: 1 }}>{linkedinScore}</div>
                                    <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Overall Score</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald)', marginTop: 6 }}>
                                        {linkedinScore >= 80 ? 'STRONG' : linkedinScore >= 60 ? 'GOOD' : 'NEEDS WORK'}
                                    </div>
                                </div>
                                <div className="score-meta">
                                    <div className="score-meta-item"><span className="meta-label">Profile Views</span><span className="meta-value cyan">{profile.profileViews.toLocaleString()}</span></div>
                                    <div className="score-meta-item"><span className="meta-label">Connections</span><span className="meta-value amber">{profile.connections.toLocaleString()}</span></div>
                                    <div className="score-meta-item"><span className="meta-label">Followers</span><span className="meta-value emerald">{profile.followers.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="linkedin-breakdown">
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Score Breakdown</h3></div>
                                    <div className="breakdown-list">
                                        {[
                                            { name: 'Work Experience', score: Math.min(100, (profile.experience?.length || 0) * 25), color: 'var(--cyan)' },
                                            { name: 'Skills Listed', score: Math.min(100, (profile.skills?.length || 0) * 8), color: 'var(--amber)' },
                                            { name: 'Profile Completeness', score: profile.about?.length > 50 ? 90 : 55, color: 'var(--emerald)' },
                                            { name: 'Engagement Score', score: Math.min(100, Math.floor(profile.profileViews / 20)), color: 'var(--purple)' },
                                        ].map((item, i) => (
                                            <div key={i} className="breakdown-item">
                                                <div className="breakdown-top">
                                                    <span className="breakdown-name">{item.name}</span>
                                                    <span className="breakdown-score" style={{ color: item.color }}>{item.score}/100</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div className="breakdown-bar-fill" style={{ width: `${item.score}%`, background: item.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ANALYTICS */}
                    <section className={`content-section ${activeSection === 'analytics' ? 'active' : ''}`} id="analytics">
                        <div className="section-header">
                            <h1 className="section-title">Career Analytics</h1>
                            <p className="section-subtitle font-mono">// data-driven insights</p>
                        </div>
                        <div className="analytics-grid">
                            <div className="card chart-card">
                                <div className="card-header"><h3 className="card-title">Application Funnel</h3></div>
                                <div className="chart-wrap"><canvas ref={funnelRef} /></div>
                            </div>
                            <div className="card chart-card">
                                <div className="card-header"><h3 className="card-title">Weekly Activity</h3></div>
                                <div className="chart-wrap"><canvas ref={weeklyRef} /></div>
                            </div>
                        </div>
                    </section>

                    {/* MIND MAP */}
                    <section className={`content-section ${activeSection === 'mindmap' ? 'active' : ''}`} id="mindmap">
                        <div className="section-header">
                            <h1 className="section-title">Job Application Mind Map</h1>
                            <p className="section-subtitle font-mono">// visual exploration of applied roles</p>
                        </div>
                        <MindMap skills={profile.skills} experience={profile.experience} />
                    </section>
                </main>

                {/* RIGHT PANEL */}
                <aside className="right-panel" id="rightPanel">
                    <div className="panel-section">
                        <h3 className="panel-title">PROFILE HEALTH</h3>
                        <div className="health-bars">
                            {[
                                { label: 'Resume Match', val: 88, color: 'var(--cyan)' },
                                { label: 'Profile Activity', val: linkedinScore, color: 'var(--amber)' },
                                { label: 'Network Growth', val: 62, color: 'var(--emerald)' },
                                { label: 'Keyword Match', val: 91, color: 'var(--purple)' },
                            ].map((h, i) => (
                                <div key={i} className="health-item">
                                    <div className="health-top"><span className="health-label">{h.label}</span><span className="health-val font-mono">{h.val}%</span></div>
                                    <div className="health-track"><div className="health-fill" style={{ width: `${h.val}%`, background: h.color }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="panel-section">
                        <h3 className="panel-title">QUICK ACTIONS</h3>
                        <div className="quick-actions">
                            <button className="action-btn action-cyan"><PlusCircle size={14} /> Add Job</button>
                            <button className="action-btn action-amber"><Share2 size={14} /> Export Report</button>
                            <button className="action-btn action-purple"><RefreshCw size={14} /> Re-Analyze</button>
                            <button className="action-btn action-emerald"><FileText size={14} /> Update Resume</button>
                        </div>
                    </div>
                </aside>
            </div>
        </body>
    );
}

function KpiCard({ color, icon, value, label, trend, trendType }: {
    color: string; icon: React.ReactNode; value: number; label: string; trend: string; trendType: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className={`kpi-card ${color}`}>
            <div className="kpi-icon">{icon}</div>
            <div className="kpi-data">
                <span className="kpi-number">{value}</span>
                <span className="kpi-label">{label}</span>
            </div>
            <div className={`kpi-trend ${trendType}`}>{trend}</div>
        </div>
    );
}

function MindMap({ skills, experience }: { skills: string[]; experience: { title: string; company: string }[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Center node
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,217,15,0.15)';
        ctx.strokeStyle = '#FFD90F';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFD90F';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CORE', cx, cy - 7);
        ctx.fillText('PROFILE', cx, cy + 7);

        const allNodes = [
            ...skills.slice(0, 6).map((s, i) => ({ label: s, color: '#22D3EE', r: 180, angle: (i / 6) * Math.PI * 2 })),
            ...experience.slice(0, 3).map((e, i) => ({ label: e.company, color: '#A855F7', r: 240, angle: (i / 3) * Math.PI * 2 + 0.5 })),
        ];

        allNodes.forEach((node) => {
            const nx = cx + node.r * Math.cos(node.angle);
            const ny = cy + node.r * Math.sin(node.angle);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = node.color + '44';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(nx, ny, 28, 0, Math.PI * 2);
            ctx.fillStyle = node.color + '18';
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = node.color;
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const short = node.label.length > 8 ? node.label.substring(0, 7) + '…' : node.label;
            ctx.fillText(short, nx, ny);
        });
    }, [skills, experience]);

    useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    return (
        <div className="mindmap-container" id="mindmapContainer" style={{ height: 500 }}>
            <canvas ref={canvasRef} id="mindmapCanvas" style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ background: '#080b10', color: '#FFD90F', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'monospace' }}>Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
