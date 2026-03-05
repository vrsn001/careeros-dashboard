/* ============================================================
   CareerOS — app.js
   All data, interactivity, charts & mind map
   ============================================================ */

// ── MOCK DATA ──────────────────────────────────────────────

const JOBS = [
    { id: 1, title: 'Senior Frontend Engineer', company: 'Google', logo: 'G', logoColor: '#4285F4', logoBg: '#e8f0fe', status: 'interview', salary: '₹32–40 LPA', location: 'Bangalore', type: 'Full-time', tags: ['React', 'TypeScript', 'Next.js'], posted: '2d ago', match: 94 },
    { id: 2, title: 'Full Stack Developer', company: 'Razorpay', logo: 'R', logoColor: '#2DD4BF', logoBg: '#0d3d3a', status: 'applied', salary: '₹22–28 LPA', location: 'Remote', type: 'Full-time', tags: ['Node.js', 'React', 'MongoDB'], posted: '4d ago', match: 88 },
    { id: 3, title: 'Software Engineer II', company: 'Flipkart', logo: 'F', logoColor: '#FFB800', logoBg: '#2d2000', status: 'saved', salary: '₹25–32 LPA', location: 'Bangalore', type: 'Full-time', tags: ['Java', 'Spring Boot', 'Kafka'], posted: '1d ago', match: 76 },
    { id: 4, title: 'React Developer', company: 'Swiggy', logo: 'S', logoColor: '#FC8019', logoBg: '#2d1500', status: 'offer', salary: '₹18–24 LPA', location: 'Bangalore', type: 'Full-time', tags: ['React', 'Redux', 'GraphQL'], posted: '6d ago', match: 91 },
    { id: 5, title: 'Backend Engineer', company: 'CRED', logo: 'C', logoColor: '#A855F7', logoBg: '#1e0d2e', status: 'applied', salary: '₹28–35 LPA', location: 'Bangalore', type: 'Full-time', tags: ['Go', 'Kubernetes', 'PostgreSQL'], posted: '3d ago', match: 82 },
    { id: 6, title: 'DevOps Engineer', company: 'Zepto', logo: 'Z', logoColor: '#22D3EE', logoBg: '#0a2530', status: 'rejected', salary: '₹20–26 LPA', location: 'Mumbai', type: 'Full-time', tags: ['AWS', 'Docker', 'Terraform'], posted: '8d ago', match: 70 },
    { id: 7, title: 'Product Engineer', company: 'Meesho', logo: 'M', logoColor: '#F43F5E', logoBg: '#2d0814', status: 'saved', salary: '₹16–22 LPA', location: 'Bangalore', type: 'Full-time', tags: ['React Native', 'Node.js'], posted: '2d ago', match: 79 },
    { id: 8, title: 'SDE-2 Frontend', company: 'Paytm', logo: 'P', logoColor: '#00B9F1', logoBg: '#002030', status: 'interview', salary: '₹22–30 LPA', location: 'Noida', type: 'Full-time', tags: ['React', 'Micro-frontends'], posted: '5d ago', match: 85 },
    { id: 9, title: 'Cloud Engineer', company: 'Atlassian', logo: 'A', logoColor: '#0052CC', logoBg: '#001433', status: 'saved', salary: '₹38–48 LPA', location: 'Remote', type: 'Full-time', tags: ['AWS', 'Python', 'CDK'], posted: '1d ago', match: 72 },
    { id: 10, title: 'Frontend Architect', company: 'ShareChat', logo: 'SC', logoColor: '#10B981', logoBg: '#0a2018', status: 'applied', salary: '₹30–40 LPA', location: 'Bangalore', type: 'Full-time', tags: ['React', 'Webpack', 'Performance'], posted: '3d ago', match: 90 },
    { id: 11, title: 'SDE-III', company: 'Amazon', logo: 'A', logoColor: '#FF9900', logoBg: '#2d1a00', status: 'saved', salary: '₹50–70 LPA', location: 'Hyderabad', type: 'Full-time', tags: ['Java', 'AWS', 'System Design'], posted: '7d ago', match: 68 },
    { id: 12, title: 'Full Stack Engineer', company: 'Groww', logo: 'G', logoColor: '#00D09C', logoBg: '#002e25', status: 'applied', salary: '₹20–28 LPA', location: 'Bangalore', type: 'Full-time', tags: ['React', 'Django', 'PostgreSQL'], posted: '4d ago', match: 83 },
];

const POSTS = [
    { id: 1, title: 'How I Negotiated a 40% Salary Hike at My FAANG Interview', source: 'LinkedIn', author: 'Priya S.', category: 'salary', tag: 'SALARY', readTime: '6 min', excerpt: 'The exact scripts and tactics I used to go from ₹24L to ₹34L in one negotiation round...', saved: '2d ago' },
    { id: 2, title: 'The Only System Design Interview Framework You Need in 2026', source: 'Medium', author: 'Arjun V.', category: 'interview', tag: 'INTERVIEW PREP', readTime: '12 min', excerpt: 'RADIO — Requirements, API, Data, Implementation, Optimization. A battle-tested template used across Google, Meta, and Amazon loops...', saved: '3d ago' },
    { id: 3, title: 'React Server Components vs Client Components: A Complete Guide', source: 'Dev.to', author: 'Sarah K.', category: 'tech', tag: 'TECH', readTime: '8 min', excerpt: "When to use each, how the boundary works, and why it changes how you think about state management...", saved: '1d ago' },
    { id: 4, title: 'Why Your LinkedIn Profile Gets 0 Recruiter Messages (And How to Fix It)', source: 'LinkedIn', author: 'Rohan M.', category: 'linkedin', tag: 'LINKEDIN TIPS', readTime: '5 min', excerpt: 'Three sections that 90% of developers optimize wrong — headline, about, and featured section...', saved: '5d ago' },
    { id: 5, title: 'How I Got 7 Interviews in 2 Weeks Using a 1-Page Portfolio', source: 'Hashnode', author: 'Dev A.', category: 'career', tag: 'CAREER', readTime: '7 min', excerpt: 'The exact portfolio structure that made 7 out of 12 cold applications result in screening calls...', saved: '6d ago' },
    { id: 6, title: 'Building a 10K TPS System: Lessons from Razorpay Engineering', source: 'Engineering Blog', author: 'Razorpay Eng', category: 'tech', tag: 'TECH', readTime: '15 min', excerpt: 'How we scaled our payment processing pipeline using Kafka, Redis, and horizontal sharding...', saved: '1d ago' },
    { id: 7, title: 'The Hidden Metrics Recruiters Check on Your LinkedIn Profile', source: 'LinkedIn', author: 'Maya R.', category: 'linkedin', tag: 'LINKEDIN TIPS', readTime: '4 min', excerpt: 'SSI score, profile keywords, response time — the invisible levers that control your visibility...', saved: '4d ago' },
    { id: 8, title: 'From 0 to ₹30LPA: A Self-Taught Developer\'s Roadmap', source: 'Medium', author: 'Karthik B.', category: 'career', tag: 'CAREER', readTime: '10 min', excerpt: 'The exact study plan, projects, and networking strategy that landed a senior role with no CS degree...', saved: '7d ago' },
    { id: 9, title: 'Ace the Behavioral Interview: STAR Method Deep Dive', source: 'Interview Cake', author: 'Staff', category: 'interview', tag: 'INTERVIEW PREP', readTime: '9 min', excerpt: '20 common behavioral questions with structured answers for SDE roles at Indian unicorns...', saved: '2d ago' },
    { id: 10, title: 'GraphQL vs REST in 2026: What the Data Actually Says', source: 'Dev.to', author: 'Alex T.', category: 'tech', tag: 'TECH', readTime: '7 min', excerpt: 'Analysis of 500 production APIs — when GraphQL wins, when REST wins, and the common mistake...', saved: '3d ago' },
];

const ACTIVITY = [
    { text: 'Applied to <b>Senior Frontend Engineer</b> at Google', time: '2h ago', color: '#22D3EE' },
    { text: 'LinkedIn profile viewed by <b>Atlassian Recruiter</b>', time: '5h ago', color: '#FFD90F' },
    { text: 'Interview scheduled with <b>Swiggy</b> — Technical Round 2', time: '1d ago', color: '#A855F7' },
    { text: 'Offer received from <b>Swiggy</b> ₹22 LPA', time: '1d ago', color: '#10B981' },
    { text: 'Application status update: <b>Paytm</b> moved to interview', time: '2d ago', color: '#FFD90F' },
    { text: 'Saved <b>Backend Engineer</b> at CRED for later', time: '3d ago', color: '#6366F1' },
];

const LINKEDIN_BREAKDOWN = [
    { name: 'Profile Completeness', score: 95, color: '#10B981' },
    { name: 'Headline & About', score: 80, color: '#22D3EE' },
    { name: 'Skills & Endorsements', score: 72, color: '#A855F7' },
    { name: 'Experience Detailing', score: 88, color: '#FFD90F' },
    { name: 'Recommendations', score: 60, color: '#F43F5E' },
    { name: 'Activity & Engagement', score: 78, color: '#6366F1' },
];

const LINKEDIN_TIPS = [
    { icon: 'edit-3', text: 'Add 3 more skills endorsed by connections to boost discoverability' },
    { icon: 'star', text: 'Request 2 recommendations from recent colleagues or managers' },
    { icon: 'trending-up', text: 'Post 2x per week — profiles that post get 5× more views' },
];

const TOP_COMPANIES = [
    { name: 'Google', role: 'SDE-3', logo: 'G', color: '#4285F4', bg: '#e8f0fe', status: 'INTERVIEW', statusClass: 'status-interview' },
    { name: 'Swiggy', role: 'React Dev', logo: 'S', color: '#FC8019', bg: '#2d1500', status: 'OFFER', statusClass: 'status-offer' },
    { name: 'Razorpay', role: 'Full Stack', logo: 'R', color: '#2DD4BF', bg: '#0d3d3a', status: 'APPLIED', statusClass: 'status-applied' },
    { name: 'CRED', role: 'Backend', logo: 'C', color: '#A855F7', bg: '#1e0d2e', status: 'APPLIED', statusClass: 'status-applied' },
];

const UPCOMING = [
    { title: 'Technical Interview — Round 2', time: 'Tomorrow, 11:00 AM', company: 'Google' },
    { title: 'HR Discussion', time: 'Mar 8, 3:00 PM', company: 'Swiggy' },
    { title: 'System Design Round', time: 'Mar 10, 10:30 AM', company: 'Paytm' },
];

const HEALTH = [
    { label: 'Resume Strength', value: 88, color: '#10B981' },
    { label: 'Profile Activity', value: 74, color: '#22D3EE' },
    { label: 'Network Growth', value: 62, color: '#A855F7' },
    { label: 'Keyword Match', value: 91, color: '#FFD90F' },
];

// ── MIND MAP DATA ────────────────────────────────────────

const MAP_DATA = {
    industry: {
        center: { label: 'My Applications', color: '#FFD90F' },
        groups: [
            {
                label: 'FinTech', color: '#22D3EE',
                nodes: [
                    { label: 'Razorpay\nFull Stack', status: 'applied', count: 1 },
                    { label: 'CRED\nBackend', status: 'applied', count: 1 },
                    { label: 'Groww\nFull Stack', status: 'applied', count: 1 },
                    { label: 'Paytm\nFrontend', status: 'interview', count: 1 },
                ]
            },
            {
                label: 'E-Commerce', color: '#F43F5E',
                nodes: [
                    { label: 'Flipkart\nSDE-II', status: 'saved', count: 1 },
                    { label: 'Meesho\nProduct Eng', status: 'saved', count: 1 },
                    { label: 'Amazon\nSDE-III', status: 'saved', count: 1 },
                ]
            },
            {
                label: 'FoodTech', color: '#10B981',
                nodes: [
                    { label: 'Swiggy\nReact Dev', status: 'offer', count: 1 },
                    { label: 'Zepto\nDevOps', status: 'rejected', count: 1 },
                ]
            },
            {
                label: 'Big Tech', color: '#A855F7',
                nodes: [
                    { label: 'Google\nSr Frontend', status: 'interview', count: 1 },
                    { label: 'Atlassian\nCloud Eng', status: 'saved', count: 1 },
                ]
            },
            {
                label: 'Social / Content', color: '#6366F1',
                nodes: [
                    { label: 'ShareChat\nFrontend Arch', status: 'applied', count: 1 },
                ]
            },
        ]
    }
};

const STATUS_COLORS = {
    saved: '#4B5568',
    applied: '#22D3EE',
    interview: '#FFD90F',
    offer: '#10B981',
    rejected: '#F43F5E',
};

// ── INIT ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // Landing Page Flow
    if (document.body.classList.contains('landing-page')) {
        initLandingPage();
        return;
    }

    // Terminal / Analyze Flow
    if (document.body.classList.contains('terminal-page')) {
        initTerminalProcessing();
        return;
    }

    // Dashboard Flow
    initDashboardUser();

    initDateTime();
    initNav();
    renderActivity();
    renderCompanies();
    renderJobs();
    renderPosts();
    renderLinkedIn();
    renderRightPanel();
    initCharts();
    initMindMap();
    initJobSearch();
    initJobFilters();
    initPostFilters();
    initThemeToggle();
    initViewToggle();
    animateKPIs();
    initMobileSidebar();
});

// ── DATE/TIME ───────────────────────────────────────────

function initDateTime() {
    const el = document.getElementById('currentDate');
    const update = () => {
        const now = new Date();
        el.textContent = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
            ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 60000);
}

// ── NAVIGATION ──────────────────────────────────────────

function initNav() {
    const items = document.querySelectorAll('.nav-item');
    const sectionNames = {
        'overview': 'Overview',
        'saved-jobs': 'Saved Jobs',
        'bookmarks': 'Bookmarks',
        'linkedin': 'LinkedIn Score',
        'analytics': 'Analytics',
        'mindmap': 'Job Mind Map',
    };

    items.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const target = item.dataset.section;
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(target);
            if (section) section.classList.add('active');
            document.getElementById('currentSection').textContent = sectionNames[target] || target;
            // close mobile sidebar
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

// ── MOBILE SIDEBAR ──────────────────────────────────────

function initMobileSidebar() {
    document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

// ── KPI COUNTER ANIMATION ───────────────────────────────

function animateKPIs() {
    document.querySelectorAll('.kpi-number[data-count]').forEach(el => {
        const target = +el.dataset.count;
        let current = 0;
        const step = Math.ceil(target / 40);
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(interval);
        }, 30);
    });
}

// ── RENDER ACTIVITY ─────────────────────────────────────

function renderActivity() {
    const feed = document.getElementById('activityFeed');
    feed.innerHTML = ACTIVITY.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color}"></div>
      <div class="activity-body">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ── RENDER TOP COMPANIES ────────────────────────────────

function renderCompanies() {
    const el = document.getElementById('companyList');
    el.innerHTML = TOP_COMPANIES.map(c => `
    <div class="company-item">
      <div class="company-logo" style="background:${c.bg};color:${c.color}">${c.logo}</div>
      <div class="company-info">
        <div class="company-name">${c.name}</div>
        <div class="company-role">${c.role}</div>
      </div>
      <span class="company-status ${c.statusClass}">${c.status}</span>
    </div>
  `).join('');
}

// ── RENDER JOBS ─────────────────────────────────────────

function renderJobs(filter = 'all', query = '') {
    const grid = document.getElementById('jobsGrid');
    let filtered = JOBS;
    if (filter !== 'all') filtered = filtered.filter(j => j.status === filter);
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-family:var(--font-mono)">No jobs found matching your criteria</div>`;
        return;
    }

    grid.innerHTML = filtered.map(j => `
    <div class="job-card" data-status="${j.status}" style="--acc:${STATUS_COLORS[j.status]}">
      <style>.job-card[data-status="${j.status}"]::before{background:${STATUS_COLORS[j.status]}}</style>
      <div class="job-card-header">
        <div class="job-logo" style="background:${j.logoBg};color:${j.logoColor}">${j.logo}</div>
        <div class="job-header-info">
          <div class="job-title">${j.title}</div>
          <div class="job-company">${j.company}</div>
        </div>
        <span class="job-status status-${j.status}">${j.status.toUpperCase()}</span>
      </div>
      <div class="job-tags">
        ${j.tags.map(t => `<span class="job-tag">${t}</span>`).join('')}
      </div>
      <div class="job-meta">
        <span class="job-meta-item"><i data-lucide="map-pin"></i>${j.location}</span>
        <span class="job-meta-item"><i data-lucide="briefcase"></i>${j.type}</span>
        <span class="job-salary">${j.salary}</span>
      </div>
      <div class="job-actions">
        <button class="job-btn job-btn-primary"><i data-lucide="external-link"></i>View Job</button>
        <button class="job-btn job-btn-ghost"><i data-lucide="bookmark"></i>Save</button>
        <button class="job-btn job-btn-ghost" style="flex:0.5"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');
    lucide.createIcons();
}

// ── RENDER POSTS ────────────────────────────────────────

function renderPosts(filter = 'all') {
    const grid = document.getElementById('postsGrid');
    let filtered = filter === 'all' ? POSTS : POSTS.filter(p => p.category === filter);
    grid.innerHTML = filtered.map(p => `
    <div class="post-card">
      <div class="post-source">
        <span class="post-source-dot" style="background:var(--cyan)"></span>
        ${p.source} · ${p.author}
        <span class="post-tag cat-${p.category}">${p.tag}</span>
      </div>
      <div class="post-title">${p.title}</div>
      <div class="post-excerpt">${p.excerpt}</div>
      <div class="post-footer">
        <span>${p.readTime} read · saved ${p.saved}</span>
        <button class="post-read-btn">READ →</button>
      </div>
    </div>
  `).join('');
}

// ── RENDER LINKEDIN ─────────────────────────────────────

function renderLinkedIn() {
    // Gauge
    const canvas = document.getElementById('gaugeCanvas');
    const ctx = canvas.getContext('2d');
    const cx = 130, cy = 145, r = 100;
    const targetScore = 82;

    let currentScore = 0;
    function drawGauge(score) {
        ctx.clearRect(0, 0, 260, 260);
        const startAngle = Math.PI * 0.75;
        const endAngle = Math.PI * 2.25;
        const filled = startAngle + (endAngle - startAngle) * (score / 100);

        // BG arc
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Color gradient arc
        const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
        grad.addColorStop(0, '#F43F5E');
        grad.addColorStop(0.4, '#FFD90F');
        grad.addColorStop(1, '#10B981');

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, filled);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Tick marks
        for (let i = 0; i <= 10; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / 10);
            const x1 = cx + (r - 24) * Math.cos(angle);
            const y1 = cy + (r - 24) * Math.sin(angle);
            const x2 = cx + (r - 28) * Math.cos(angle);
            const y2 = cy + (r - 28) * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    const numEl = document.getElementById('gaugeNumber');
    const gradeEl = document.getElementById('gaugeGrade');
    const interval = setInterval(() => {
        currentScore = Math.min(currentScore + 2, targetScore);
        drawGauge(currentScore);
        numEl.textContent = currentScore;
        if (currentScore >= targetScore) {
            clearInterval(interval);
            gradeEl.textContent = 'STRONG ✓';
        }
    }, 25);

    // Breakdown
    const breakdownEl = document.getElementById('linkedinBreakdown');
    breakdownEl.innerHTML = LINKEDIN_BREAKDOWN.map(b => `
    <div class="breakdown-item">
      <div class="breakdown-top">
        <span class="breakdown-name">${b.name}</span>
        <span class="breakdown-score" style="color:${b.color}">${b.score}/100</span>
      </div>
      <div class="breakdown-bar-track">
        <div class="breakdown-bar-fill" style="width:0%;background:${b.color}" data-width="${b.score}%"></div>
      </div>
    </div>
  `).join('');

    // Tips
    const tipsEl = document.getElementById('linkedinTips');
    tipsEl.innerHTML = LINKEDIN_TIPS.map(t => `
    <li class="tip-item">
      <span class="tip-icon"><i data-lucide="${t.icon}"></i></span>
      <span>${t.text}</span>
    </li>
  `).join('');
    lucide.createIcons();

    // Animate bars
    setTimeout(() => {
        document.querySelectorAll('.breakdown-bar-fill').forEach(el => {
            el.style.width = el.dataset.width;
        });
    }, 300);
}

// ── RENDER RIGHT PANEL ───────────────────────────────────

function renderRightPanel() {
    // Upcoming
    document.getElementById('upcomingList').innerHTML = UPCOMING.map(u => `
    <div class="upcoming-item">
      <div class="upcoming-title">${u.title}</div>
      <div class="upcoming-time">${u.time}</div>
      <div class="upcoming-company">${u.company}</div>
    </div>
  `).join('');

    // Health bars
    const hEl = document.getElementById('healthBars');
    hEl.innerHTML = HEALTH.map(h => `
    <div class="health-item">
      <div class="health-top">
        <span class="health-label">${h.label}</span>
        <span class="health-val" style="color:${h.color}">${h.value}%</span>
      </div>
      <div class="health-track">
        <div class="health-fill" style="width:0%;background:${h.color}" data-width="${h.value}%"></div>
      </div>
    </div>
  `).join('');

    setTimeout(() => {
        document.querySelectorAll('.health-fill').forEach(el => {
            el.style.width = el.dataset.width;
        });
    }, 500);
}

// ── CHARTS ──────────────────────────────────────────────

const CHART_DEFAULTS = {
    color: 'rgba(255,255,255,0.7)',
    gridColor: 'rgba(255,255,255,0.06)',
    font: "'JetBrains Mono', monospace",
};

function initCharts() {
    Chart.defaults.color = CHART_DEFAULTS.color;
    Chart.defaults.font.family = CHART_DEFAULTS.font;
    Chart.defaults.font.size = 11;

    // Funnel / Doughnut
    new Chart(document.getElementById('funnelChart'), {
        type: 'doughnut',
        data: {
            labels: ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'],
            datasets: [{
                data: [18, 22, 7, 2, 4],
                backgroundColor: ['#4B5568', '#22D3EE', '#FFD90F', '#10B981', '#F43F5E'],
                borderColor: '#101620',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            cutout: '60%',
            plugins: { legend: { position: 'bottom', labels: { padding: 16, boxWidth: 10 } } },
            animation: { animateScale: true, duration: 1200 },
        }
    });

    // Weekly line
    new Chart(document.getElementById('weeklyChart'), {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
            datasets: [
                {
                    label: 'Applications',
                    data: [8, 12, 9, 15, 11, 17],
                    borderColor: '#22D3EE',
                    backgroundColor: 'rgba(34,211,238,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#22D3EE',
                    pointRadius: 4,
                },
                {
                    label: 'Responses',
                    data: [2, 4, 3, 6, 4, 6],
                    borderColor: '#FFD90F',
                    backgroundColor: 'rgba(255,217,15,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FFD90F',
                    pointRadius: 4,
                }
            ]
        },
        options: {
            scales: {
                x: { grid: { color: CHART_DEFAULTS.gridColor }, ticks: { maxRotation: 0 } },
                y: { grid: { color: CHART_DEFAULTS.gridColor }, beginAtZero: true }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 1200 },
        }
    });

    // Radar
    new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
            labels: ['React', 'Node.js', 'TypeScript', 'System Design', 'AWS', 'SQL'],
            datasets: [
                {
                    label: 'My Skills',
                    data: [92, 80, 85, 70, 68, 75],
                    borderColor: '#22D3EE',
                    backgroundColor: 'rgba(34,211,238,0.15)',
                    pointBackgroundColor: '#22D3EE',
                },
                {
                    label: 'Job Requirements',
                    data: [88, 78, 80, 82, 75, 70],
                    borderColor: '#FFD90F',
                    backgroundColor: 'rgba(255,217,15,0.08)',
                    pointBackgroundColor: '#FFD90F',
                }
            ]
        },
        options: {
            scales: { r: { grid: { color: CHART_DEFAULTS.gridColor }, ticks: { display: false }, pointLabels: { font: { size: 11 } } } },
            plugins: { legend: { position: 'bottom', labels: { padding: 12, boxWidth: 10 } } },
            animation: { duration: 1200 },
        }
    });

    // Salary bar
    new Chart(document.getElementById('salaryChart'), {
        type: 'bar',
        data: {
            labels: ['<15L', '15–20L', '20–28L', '28–35L', '35–50L', '50L+'],
            datasets: [{
                label: 'Jobs Applied',
                data: [1, 3, 7, 6, 3, 1],
                backgroundColor: ['#6366F1', '#A855F7', '#22D3EE', '#FFD90F', '#10B981', '#F43F5E'],
                borderRadius: 3,
                borderSkipped: false,
            }]
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: CHART_DEFAULTS.gridColor }, beginAtZero: true, ticks: { stepSize: 2 } }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 1200 },
        }
    });
}

// ── MIND MAP (Canvas) ────────────────────────────────────

let mapScale = 1;
let mapOffsetX = 0, mapOffsetY = 0;
let isDragging = false, dragStartX, dragStartY;
let mapNodes = [];

function initMindMap() {
    const canvas = document.getElementById('mindmapCanvas');
    const container = document.getElementById('mindmapContainer');
    const tooltip = document.getElementById('mapTooltip');
    const legend = document.getElementById('mindmapLegend');

    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawMap();
    }

    function buildNodes() {
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const data = MAP_DATA.industry;
        mapNodes = [];

        // Center node
        mapNodes.push({ x: cx, y: cy, r: 36, label: data.center.label, color: data.center.color, type: 'center', detail: '53 total applications' });

        const groups = data.groups;
        groups.forEach((group, gi) => {
            const groupAngle = (gi / groups.length) * Math.PI * 2 - Math.PI / 2;
            const groupR = 160;
            const gx = cx + Math.cos(groupAngle) * groupR;
            const gy = cy + Math.sin(groupAngle) * groupR;

            mapNodes.push({ x: gx, y: gy, r: 28, label: group.label, color: group.color, type: 'group', parentX: cx, parentY: cy, detail: `${group.nodes.length} companies` });

            group.nodes.forEach((node, ni) => {
                const spread = group.nodes.length;
                const nodeAngle = groupAngle + ((ni - (spread - 1) / 2) * (Math.PI / (spread + 2)));
                const nodeR = 105;
                const nx = gx + Math.cos(nodeAngle) * nodeR;
                const ny = gy + Math.sin(nodeAngle) * nodeR;
                mapNodes.push({
                    x: nx, y: ny, r: 20,
                    label: node.label, color: STATUS_COLORS[node.status],
                    type: 'node', parentX: gx, parentY: gy,
                    status: node.status,
                    detail: `Status: ${node.status.toUpperCase()}`
                });
            });
        });
    }

    function drawMap() {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(mapOffsetX, mapOffsetY);
        ctx.scale(mapScale, mapScale);

        // Draw connections
        mapNodes.forEach(n => {
            if (n.parentX !== undefined) {
                ctx.beginPath();
                ctx.moveTo(n.parentX, n.parentY);
                ctx.lineTo(n.x, n.y);
                const alpha = n.type === 'group' ? 0.35 : 0.18;
                ctx.strokeStyle = n.color.replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(') || `rgba(255,255,255,${alpha})`;
                // simple hex to rgba
                const hex = n.color;
                const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.lineWidth = n.type === 'group' ? 2 : 1;
                ctx.setLineDash(n.type === 'node' ? [4, 4] : []);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // Draw nodes
        mapNodes.forEach(n => {
            // Glow
            const hex = n.color;
            const r2 = parseInt(hex.slice(1, 3), 16), g2 = parseInt(hex.slice(3, 5), 16), b2 = parseInt(hex.slice(5, 7), 16);
            const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2);
            glow.addColorStop(0, `rgba(${r2},${g2},${b2},0.25)`);
            glow.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 2, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            // Circle
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r2},${g2},${b2},0.15)`;
            ctx.fill();
            ctx.strokeStyle = n.color;
            ctx.lineWidth = n.type === 'center' ? 3 : (n.type === 'group' ? 2 : 1.5);
            ctx.stroke();

            // Label
            ctx.fillStyle = n.type === 'center' ? '#000' : '#E8ECF4';
            ctx.font = `${n.type === 'center' ? 'bold ' : ''}${n.type === 'center' ? 11 : 9}px 'JetBrains Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const lines = n.label.split('\n');
            const lineH = 11;
            lines.forEach((line, li) => {
                ctx.fillText(line, n.x, n.y + (li - (lines.length - 1) / 2) * lineH);
            });
        });

        ctx.restore();
    }

    // Tooltip
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - mapOffsetX) / mapScale;
        const my = (e.clientY - rect.top - mapOffsetY) / mapScale;

        let hovored = null;
        for (const n of mapNodes) {
            const dist = Math.hypot(mx - n.x, my - n.y);
            if (dist < n.r + 8) { hovored = n; break; }
        }

        if (hovored) {
            tooltip.innerHTML = `<div class="tooltip-title">${hovored.label.replace('\n', ' — ')}</div><div class="tooltip-detail">${hovored.detail}</div>`;
            tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 40) + 'px';
            tooltip.classList.add('visible');
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.classList.remove('visible');
            canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
    });

    // Drag
    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        dragStartX = e.clientX - mapOffsetX;
        dragStartY = e.clientY - mapOffsetY;
        canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        mapOffsetX = e.clientX - dragStartX;
        mapOffsetY = e.clientY - dragStartY;
        drawMap();
    });
    window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => { mapScale = Math.min(mapScale + 0.15, 3); drawMap(); });
    document.getElementById('zoomOut').addEventListener('click', () => { mapScale = Math.max(mapScale - 0.15, 0.4); drawMap(); });
    document.getElementById('mapReset').addEventListener('click', () => { mapScale = 1; mapOffsetX = 0; mapOffsetY = 0; drawMap(); });

    // Wheel zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        mapScale = Math.max(0.4, Math.min(3, mapScale + delta));
        drawMap();
    }, { passive: false });

    // Legend
    legend.innerHTML = Object.entries(STATUS_COLORS).map(([k, v]) => `
    <div class="legend-item">
      <div class="legend-node" style="background:${v}33;border-color:${v}"></div>
      ${k.charAt(0).toUpperCase() + k.slice(1)}
    </div>
  `).join('') + `
    <div class="legend-item" style="margin-left:16px">
      <div class="legend-node" style="background:#FFD90F33;border-color:#FFD90F"></div>
      Center Hub
    </div>
  `;

    buildNodes();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Map filter buttons
    document.querySelectorAll('#mapFilters .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#mapFilters .filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ── SEARCH & FILTERS ─────────────────────────────────────

let currentJobFilter = 'all';

function initJobSearch() {
    document.getElementById('jobSearch').addEventListener('input', e => {
        renderJobs(currentJobFilter, e.target.value);
    });
}

function initJobFilters() {
    document.querySelectorAll('#jobFilters .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#jobFilters .filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentJobFilter = btn.dataset.filter;
            renderJobs(currentJobFilter, document.getElementById('jobSearch').value);
        });
    });
}

function initPostFilters() {
    document.querySelectorAll('#postFilters .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#postFilters .filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPosts(btn.dataset.filter);
        });
    });
}

// ── THEME TOGGLE ─────────────────────────────────────────

function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    btn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        btn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}"></i><span>${isLight ? 'Dark Mode' : 'Light Mode'}</span>`;
        lucide.createIcons();
    });
}

// ── VIEW TOGGLE ──────────────────────────────────────────

function initViewToggle() {
    const grid = document.getElementById('gridViewBtn');
    const list = document.getElementById('listViewBtn');
    const jobsGrid = document.getElementById('jobsGrid');

    grid.addEventListener('click', () => {
        grid.classList.add('active'); list.classList.remove('active');
        jobsGrid.classList.remove('list-view');
    });
    list.addEventListener('click', () => {
        list.classList.add('active'); grid.classList.remove('active');
        jobsGrid.classList.add('list-view');
    });
}

// ── SAAS PRODUCT FLOW ────────────────────────────────────

function initLandingPage() {
    const btn = document.getElementById('extractBtn');
    const input = document.getElementById('linkedinUrl');
    const errorEl = document.getElementById('inputError');

    btn.addEventListener('click', () => {
        const url = input.value.trim();
        if (!url) {
            errorEl.textContent = '> ERROR: Provide a valid LinkedIn URL.';
            errorEl.style.color = 'var(--red)';
            return;
        }

        // Extract basic username for the MVP
        let username = 'User';
        const match = url.match(/in\/([^/]+)/);
        if (match && match[1]) {
            username = match[1].replace(/-/g, ' ');
            username = username.replace(/\b\w/g, c => c.toUpperCase());
        }

        sessionStorage.setItem('careeros_user', username);
        window.location.href = `analyze.html?url=${encodeURIComponent(url)}`;
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });
}

function initTerminalProcessing() {
    const term = document.getElementById('terminalOutput');
    let username = sessionStorage.getItem('careeros_user');

    const urlParams = new URLSearchParams(window.location.search);
    const linkUrl = urlParams.get('url');
    if (linkUrl) {
        const match = linkUrl.match(/in\/([^/]+)/);
        if (match && match[1]) {
            username = match[1].replace(/-/g, ' ');
            username = username.replace(/\b\w/g, c => c.toUpperCase());
            sessionStorage.setItem('careeros_user', username);
        }
    }

    if (!username) username = 'User';

    const lines = [
        `> INITIALIZING SECURE CONNECTION TO LINKEDIN NODE...`,
        `> HANDSHAKE ESTABLISHED.`,
        `> LOCATING PROFILE: [ ${username.toUpperCase()} ]`,
        `> EXTRACTING EXPERIENCE & EDUCATION DATA... [OK]`,
        `> DOWNLOADING SKILL ENDORSEMENTS... [OK]`,
        `> CROSS-REFERENCING WITH GLOBAL JOB MARKET DB...`,
        `> APPLYING MATCHING ALGORITHM (v3.0)...`,
        `> GENERATING VISUAL MIND MAP...`,
        `> ANALYZING SALARY BANDS...`,
        `> EXTRACTION COMPLETE. PREPARING DASHBOARD...`
    ];

    let delay = 0;
    lines.forEach((line, i) => {
        setTimeout(() => {
            const p = document.createElement('div');
            p.textContent = line;
            if (term) term.appendChild(p);

            // Scroll to bottom
            const container = document.querySelector('.terminal-window');
            if (container) container.scrollTop = container.scrollHeight;

            if (i === lines.length - 1) {
                setTimeout(() => {
                    const passUrl = linkUrl ? `?url=${encodeURIComponent(linkUrl)}` : '';
                    window.location.href = `dashboard.html${passUrl}`;
                }, 800);
            }
        }, delay);
        // Randomize delay to look like real processing
        delay += Math.floor(Math.random() * 400) + 200;
    });
}

function initDashboardUser() {
    let username = sessionStorage.getItem('careeros_user');

    const urlParams = new URLSearchParams(window.location.search);
    const linkUrl = urlParams.get('url');
    if (linkUrl) {
        const match = linkUrl.match(/in\/([^/]+)/);
        if (match && match[1]) {
            username = match[1].replace(/-/g, ' ');
            username = username.replace(/\b\w/g, c => c.toUpperCase());
            sessionStorage.setItem('careeros_user', username);
        }
    }

    if (username) {
        const nameEl = document.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = username;

        const initials = username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) avatarEl.textContent = initials;
    }
}
