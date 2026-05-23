"""
Job scrapers for CareerOS.
Each scraper returns a list of normalized job dicts:
{
  source: 'remoteok' | 'ycombinator' | 'hackernews' | 'wellfound',
  external_id: str,
  title: str,
  company: str,
  company_logo: Optional[str],
  location: Optional[str],
  remote: bool,
  tags: List[str],
  salary: Optional[str],
  description: str,
  apply_url: str,
  posted_at: Optional[str],  # ISO date string
}
"""
from __future__ import annotations

import asyncio
import html
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

# ---------------------------------------------------------------- RemoteOK ----
async def scrape_remoteok(query: str = "", limit: int = 60) -> list[dict[str, Any]]:
    """RemoteOK exposes a public JSON feed at https://remoteok.com/api."""
    url = "https://remoteok.com/api"
    async with httpx.AsyncClient(timeout=20.0, headers=DEFAULT_HEADERS) as client:
        r = await client.get(url)
        r.raise_for_status()
        data = r.json()

    # First entry is metadata
    jobs = data[1:] if data and isinstance(data[0], dict) and data[0].get("legal") else data
    out: list[dict[str, Any]] = []
    q = query.lower().strip() if query else ""

    def _fix_mojibake(s: str) -> str:
        if not s or not isinstance(s, str):
            return s
        try:
            return s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s

    for j in jobs[: limit * 3]:
        if not isinstance(j, dict):
            continue
        title = _fix_mojibake((j.get("position") or j.get("title") or "").strip())
        company = _fix_mojibake((j.get("company") or "").strip())
        if not title or not company:
            continue

        tags = [_fix_mojibake(t) for t in (j.get("tags") or []) if isinstance(t, str)][:6]
        text_blob = f"{title} {company} {' '.join(tags)} {j.get('description', '')}".lower()
        if q and q not in text_blob:
            continue

        salary_min = j.get("salary_min")
        salary_max = j.get("salary_max")
        salary = None
        if salary_min and salary_max:
            salary = f"${salary_min // 1000}k–${salary_max // 1000}k"

        desc_raw = j.get("description", "") or ""
        # RemoteOK returns mojibake: UTF-8 bytes decoded as latin-1. Reverse.
        desc_raw = _fix_mojibake(desc_raw)
        desc_raw = html.unescape(desc_raw)
        desc = BeautifulSoup(desc_raw, "lxml").get_text(" ", strip=True)
        desc = re.sub(r"\s+", " ", desc)[:1200]

        out.append({
            "source": "remoteok",
            "external_id": f"remoteok-{j.get('id') or j.get('slug')}",
            "title": title,
            "company": company,
            "company_logo": j.get("company_logo") or j.get("logo"),
            "location": _fix_mojibake(j.get("location") or "Remote"),
            "remote": True,
            "tags": tags,
            "salary": salary,
            "description": desc,
            "apply_url": j.get("apply_url") or j.get("url") or f"https://remoteok.com/remote-jobs/{j.get('id')}",
            "posted_at": j.get("date"),
        })
        if len(out) >= limit:
            break
    return out


# ----------------------------------------------------------- Y Combinator ----
async def scrape_yc(query: str = "", limit: int = 60) -> list[dict[str, Any]]:
    """
    Y Combinator companies that are hiring. We use the community-maintained
    yc-oss API which mirrors YC's public Algolia index. Each hiring company
    is represented as one entry that links to its workatastartup page.
    """
    url = "https://yc-oss.github.io/api/companies/hiring.json"
    async with httpx.AsyncClient(timeout=25.0, headers=DEFAULT_HEADERS) as client:
        r = await client.get(url)
        r.raise_for_status()
        data = r.json()

    q = query.lower().strip() if query else ""
    out: list[dict[str, Any]] = []

    # Prioritize Top companies + recently launched
    data_sorted = sorted(data, key=lambda c: (not c.get("top_company"), -(c.get("launched_at") or 0)))

    for c in data_sorted:
        name = (c.get("name") or "").strip()
        one_liner = (c.get("one_liner") or "").strip()
        if not name:
            continue

        tags = [c.get("industry")] + (c.get("tags") or [])
        tags = [t for t in tags if t][:6]
        blob = f"{name} {one_liner} {' '.join(tags)} {c.get('long_description', '')}".lower()
        if q and q not in blob:
            continue

        locations = c.get("all_locations") or ""
        regions = c.get("regions") or []
        remote = "Remote" in regions or "remote" in locations.lower()

        # Build title from one-liner; assume we're listing "Hiring at <name>"
        title = f"Hiring at {name}"
        if one_liner:
            title = f"{one_liner.rstrip('.')} — Open Roles"

        description = (c.get("long_description") or one_liner or "").strip()[:1200]
        slug = c.get("slug") or ""
        apply_url = f"https://www.workatastartup.com/companies/{slug}" if slug else c.get("url")
        if not apply_url:
            continue

        out.append({
            "source": "ycombinator",
            "external_id": f"yc-{c.get('id') or slug}",
            "title": title,
            "company": name,
            "company_logo": c.get("small_logo_thumb_url"),
            "location": locations or "—",
            "remote": remote,
            "tags": tags,
            "salary": None,
            "description": description,
            "apply_url": apply_url,
            "posted_at": (
                datetime.fromtimestamp(c["launched_at"], tz=timezone.utc).isoformat()
                if c.get("launched_at") else None
            ),
            "extra": {
                "batch": c.get("batch"),
                "stage": c.get("stage"),
                "team_size": c.get("team_size"),
                "top_company": bool(c.get("top_company")),
                "website": c.get("website"),
            },
        })
        if len(out) >= limit:
            break
    return out


# ------------------------------------------------------- Hacker News --------
HN_USER = "https://hacker-news.firebaseio.com/v0/user/whoishiring.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"


async def _fetch_hn_item(client: httpx.AsyncClient, item_id: int) -> dict | None:
    try:
        r = await client.get(HN_ITEM.format(id=item_id))
        if r.status_code == 200:
            return r.json()
    except Exception:
        return None
    return None


async def scrape_hackernews(query: str = "", limit: int = 60) -> list[dict[str, Any]]:
    """Scrape the latest 'Who is hiring?' HN thread comments."""
    async with httpx.AsyncClient(timeout=25.0, headers=DEFAULT_HEADERS) as client:
        u = await client.get(HN_USER)
        if u.status_code != 200:
            return []
        submitted = u.json().get("submitted", [])

        thread_id = None
        thread_data = None
        for sid in submitted[:30]:
            item = await _fetch_hn_item(client, sid)
            if not item:
                continue
            title = (item.get("title") or "").lower()
            if "who is hiring" in title or "who's hiring" in title:
                thread_id = sid
                thread_data = item
                break
        if not thread_id or not thread_data:
            return []

        kids = thread_data.get("kids", [])[: limit * 2]

        # Fetch comments concurrently
        sem = asyncio.Semaphore(15)

        async def fetch(cid: int):
            async with sem:
                return await _fetch_hn_item(client, cid)

        comments = await asyncio.gather(*[fetch(c) for c in kids])

    q = query.lower().strip() if query else ""
    out: list[dict[str, Any]] = []
    for c in comments:
        if not c or c.get("deleted") or c.get("dead"):
            continue
        text_html = c.get("text", "") or ""
        text = BeautifulSoup(text_html, "lxml").get_text("\n", strip=True)
        if not text:
            continue
        if q and q not in text.lower():
            continue

        # Top-level pattern: "Company | Role | Location | Tags"
        first_line = text.split("\n", 1)[0]
        parts = [p.strip(" |·–-") for p in re.split(r"\s*\|\s*", first_line) if p.strip()]
        if len(parts) >= 2:
            company = parts[0][:60]
            title = parts[1][:120]
        else:
            company = (first_line[:48] + "…") if len(first_line) > 48 else first_line
            title = "Role at " + company

        # Detect remote
        remote = bool(re.search(r"\bremote\b", first_line, re.I) or re.search(r"\bREMOTE\b", text))

        # Detect location
        loc_match = next((p for p in parts[2:] if not re.search(r"\b(remote|onsite|hybrid)\b", p, re.I)), None)
        location = loc_match or ("Remote" if remote else "—")

        # Detect tags
        tag_pool = re.findall(r"\b(Python|Go|Rust|JavaScript|TypeScript|React|Vue|Node|Java|C\+\+|Kubernetes|AWS|GCP|Azure|ML|AI|Postgres|PostgreSQL|MongoDB|Redis|GraphQL|Ruby|Elixir|Swift|Kotlin|iOS|Android|Frontend|Backend|Fullstack|Full Stack|Staff|Senior|Engineer|Designer)\b", text, re.I)
        tags = []
        seen = set()
        for t in tag_pool:
            tl = t.title()
            if tl.lower() not in seen:
                seen.add(tl.lower())
                tags.append(tl)
            if len(tags) >= 6:
                break

        apply_url_match = re.search(r"https?://[^\s<>\"']+", text)
        apply_url = apply_url_match.group(0) if apply_url_match else f"https://news.ycombinator.com/item?id={c['id']}"

        out.append({
            "source": "hackernews",
            "external_id": f"hn-{c['id']}",
            "title": title,
            "company": company,
            "company_logo": None,
            "location": location,
            "remote": remote,
            "tags": tags,
            "salary": None,
            "description": text[:1500],
            "apply_url": apply_url,
            "posted_at": (
                datetime.fromtimestamp(c["time"], tz=timezone.utc).isoformat()
                if c.get("time") else None
            ),
            "extra": {"hn_thread_id": thread_id, "hn_comment_id": c["id"]},
        })
        if len(out) >= limit:
            break
    return out


# ------------------------------------------------------- Wellfound ----------
WELLFOUND_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua": '"Chromium";v="127", "Not(A:Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
}


async def scrape_wellfound(query: str = "", limit: int = 40) -> list[dict[str, Any]]:
    """
    Wellfound aggressively blocks scrapers via DataDome. We attempt a fetch with
    realistic browser headers and parse Next.js __NEXT_DATA__ if available.
    If blocked, we return an empty list (callers should handle the limited mode).
    """
    base = "https://wellfound.com/jobs"
    url = base + (f"?q={httpx.QueryParams({'q': query})['q']}" if query else "")

    try:
        async with httpx.AsyncClient(timeout=15.0, headers=WELLFOUND_HEADERS, follow_redirects=True) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return []
            soup = BeautifulSoup(r.text, "lxml")
            next_data_tag = soup.find("script", id="__NEXT_DATA__")
            if not next_data_tag:
                return []
            import json as _json
            data = _json.loads(next_data_tag.string)
            # Walk to job listings if present
            jobs_raw = _walk_for_jobs(data) or []
            out: list[dict[str, Any]] = []
            for j in jobs_raw[:limit]:
                out.append(_normalize_wellfound_job(j))
            return [o for o in out if o]
    except Exception:
        return []


def _walk_for_jobs(node, depth=0) -> list[dict] | None:
    if depth > 7:
        return None
    if isinstance(node, list):
        # Heuristic: list of dicts containing job-like fields
        if node and isinstance(node[0], dict) and any(k in node[0] for k in ("jobTitle", "slug", "compensation")):
            return node
        for it in node:
            res = _walk_for_jobs(it, depth + 1)
            if res:
                return res
    elif isinstance(node, dict):
        for v in node.values():
            res = _walk_for_jobs(v, depth + 1)
            if res:
                return res
    return None


def _normalize_wellfound_job(j: dict) -> dict | None:
    if not isinstance(j, dict):
        return None
    title = j.get("jobTitle") or j.get("title")
    if not title:
        return None
    company = (j.get("startup") or {}).get("name") or j.get("companyName") or "—"
    return {
        "source": "wellfound",
        "external_id": f"wellfound-{j.get('id') or j.get('slug')}",
        "title": title,
        "company": company,
        "company_logo": (j.get("startup") or {}).get("logoUrl"),
        "location": (j.get("locations") or [{}])[0].get("displayName") if j.get("locations") else None,
        "remote": bool(j.get("remoteOk")),
        "tags": [t.get("name") for t in (j.get("skills") or []) if isinstance(t, dict) and t.get("name")][:6],
        "salary": j.get("compensation"),
        "description": (j.get("description") or "")[:1200],
        "apply_url": f"https://wellfound.com/jobs/{j.get('id')}-{j.get('slug')}" if j.get("id") else None,
        "posted_at": j.get("liveStartAt"),
    }


# ------------------------------------------------------- Aggregator ---------
async def scrape_all(query: str = "", per_source: int = 25, sources: list[str] | None = None) -> dict[str, Any]:
    sources = sources or ["remoteok", "ycombinator", "hackernews", "wellfound"]
    tasks = {}
    if "remoteok" in sources:
        tasks["remoteok"] = scrape_remoteok(query=query, limit=per_source)
    if "ycombinator" in sources:
        tasks["ycombinator"] = scrape_yc(query=query, limit=per_source)
    if "hackernews" in sources:
        tasks["hackernews"] = scrape_hackernews(query=query, limit=per_source)
    if "wellfound" in sources:
        tasks["wellfound"] = scrape_wellfound(query=query, limit=per_source)

    results: dict[str, list[dict]] = {}
    status: dict[str, str] = {}
    coros = list(tasks.values())
    keys = list(tasks.keys())
    gathered = await asyncio.gather(*coros, return_exceptions=True)
    for key, res in zip(keys, gathered):
        if isinstance(res, Exception):
            results[key] = []
            status[key] = f"error: {type(res).__name__}: {res}"[:160]
        else:
            results[key] = res
            status[key] = "ok" if res else "empty"

    flat = [item for lst in results.values() for item in lst]
    return {"jobs": flat, "by_source": results, "status": status}
