# CareerOS — PRD

## Original problem statement
> Make it live with a backend and a scraper that supports https://wellfound.com/jobs and https://www.ycombinator.com/.
> I want to build something that will scrape jobs from everything, from scanning your LinkedIn to a proper dashboard, including savings and data migrations. If you know tell.ai (the tell.com AI thing that is building right now for jobs and everything), basically like that but with a bit of a fucking good UI.

## User choices (V1)
- **Sources**: RemoteOK + Y Combinator + Hacker News Who's Hiring + Wellfound (skip LinkedIn jobs)
- **Auth**: JWT email/password primary (Emergent Google Auth deferred to V2)
- **AI**: Match score + "Why this fits" + Cover letter draft via Claude Sonnet 4.5
- **Design**: Modern dark dashboard — kept the existing neo-brutalist terminal aesthetic (amber/cyan/JetBrains Mono) which is distinctive and matches the "surprise me" brief

## Architecture
- **Backend**: FastAPI on :8001, Motor async MongoDB, JWT auth (bcrypt + PyJWT), emergentintegrations for Claude
- **Frontend**: React 18 (CRA) on :3000, react-router-dom v6, chart.js, lucide-react, localStorage JWT
- **Scrapers** (`/app/backend/scrapers.py`):
  - `scrape_remoteok` — public JSON API (live, fast)
  - `scrape_yc` — yc-oss community API (1468 hiring companies, links to workatastartup)
  - `scrape_hackernews` — HN Firebase API (latest Who's Hiring thread + comments)
  - `scrape_wellfound` — DataDome-blocked, gracefully degrades to empty (URL-import path planned)
- **Cache**: MongoDB `scrape_cache` with 10-min TTL per query+sources combination
- **AI** (`/api/ai/match`, `/api/ai/cover-letter`): structured JSON output from Claude with strict schema

## What's implemented (May 23, 2026)
- ✅ Multi-source live scraping with 10-min cache (3/4 sources real-time, Wellfound degraded as expected)
- ✅ JWT register/login/me with bcrypt + admin/demo seeding
- ✅ Profile editor (skills, headline, resume_text, preferred roles/locations)
- ✅ Job browse with search + per-source filter pills + refresh
- ✅ Save → applied → interview → offer → rejected pipeline tracking
- ✅ AI match score modal (score 0-100, verdict, why_fits, gaps, next_steps) via Claude Sonnet 4.5
- ✅ AI cover letter draft modal with tone selector (professional / enthusiastic / casual) + copy
- ✅ Analytics dashboard with funnel donut + by-source bar chart (chart.js)
- ✅ Neo-brutalist terminal UI with CRT scanlines, conic-gradient avatar ring, monospace HUD details
- ✅ All endpoints prefixed `/api`, all interactive elements tagged with `data-testid`
- ✅ Pre-seeded demo user (demo@careeros.io / demo1234) with full profile for instant AI testing

## What's implemented (May 23, 2026 — Gen Z drop)
- ✅ **LinkedIn PDF Analyzer** (`POST /api/profile/import-pdf`): drag-drop / upload a LinkedIn-exported PDF → `pdfplumber` extracts text → Claude parses into structured profile (name, headline, location, bio, skills, preferred roles/locations, full resume narrative). Auto-fills the entire Profile form. 8 MB cap.
- ✅ **Full data export** (`GET /api/export`): one click downloads `careeros-export-YYYY-MM-DD.json` with everything CareerOS knows about you (user, profile, all saved jobs + statuses + notes, stats).
- ✅ **Gen Z / Tyler Durden copy refresh** across every screen — sarcastic, self-aware, focused on the chronically unhirable. Examples:
  - Landing: *"Stop applying to jobs that ghost you before the interview."*
  - Auth: *"Welcome back, you magnificent disaster."*
  - AI rank button: *"GHOST CHECK"*  · cover letter button: *"BEG WITH STYLE"*
  - Saved empty: *"no saved jobs. probably for the best."*
  - Analytics title: *"the funnel of cope."*
- ✅ Tagline on landing: *"The first rule of CareerOS: you do not beg companies that don't want you. — probably tyler durden, if he was unemployed in 2026"*

## Backlog / next iterations
### P0
- LinkedIn profile import via Apify (token-gated; existing /app/legacy + /app/app had this — bring it back behind an "Import from LinkedIn" button)
- Wellfound URL-import flow (paste a Wellfound job URL → parse __NEXT_DATA__ and add to saved)
- Bulk re-rank: AI matches the user's profile against the *whole* current feed and sorts by score (cached)

### P1
- Emergent Google Auth as alternative sign-in
- Email digest (daily roll-up of new matching jobs above score threshold)
- Resume PDF upload + text extraction (replace paste-resume path)
- Chrome extension to clip any job posting → CareerOS

### P2
- Browser-automation Wellfound scraper via Playwright stealth
- LinkedIn jobs ingestion (currently skipped per user)
- Salary distribution analytics chart
- Mind map view of applied roles by industry (the legacy code had this — port it)

## Files of interest
- `/app/backend/server.py` — main FastAPI app
- `/app/backend/scrapers.py` — all four scrapers
- `/app/backend/tests/backend_test.py` — 14 pytest cases (added by testing agent)
- `/app/frontend/src/pages/Browse.js` — main feed + AI modal
- `/app/frontend/src/pages/Saved.js`, `Profile.js`, `Analytics.js`, `Auth.js`, `Landing.js`, `AppShell.js`

## Known limitations
- **Wellfound**: DataDome blocks server-side scraping. Status chip will show "limited / blocked" — this is expected and documented in the UI.
- **AI latency**: Claude calls take 5-15s; UI shows "SCORING…" / "DRAFTING…" states.
- **Caching**: 10 min TTL per (query, sources, per_source) — use `refresh=true` query param or the REFRESH button to bypass.
