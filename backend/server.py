"""CareerOS — Multi-source job aggregator backend."""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
import logging
import os
import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import Annotated, Any, Optional

import bcrypt
import httpx
import jwt
import pdfplumber
from bson import ObjectId
from fastapi import Cookie, Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from scrapers import scrape_all, scrape_remoteok, scrape_yc, scrape_hackernews, scrape_wellfound, scrape_wellfound_url

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
log = logging.getLogger("careeros")

# ---------------------------------------------------------------- Config ----
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@careeros.io")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin1234")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# ---------------------------------------------------------------- DB --------
mongo = AsyncIOMotorClient(MONGO_URL)
db = mongo[DB_NAME]

# ---------------------------------------------------------------- App ------
app = FastAPI(title="CareerOS API", version="1.0.0")

_origins = ["*"] if FRONTEND_URL == "*" else [FRONTEND_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,  # using Authorization header, no cookies cross-site
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------- Auth -----
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


CurrentUser = Annotated[dict, Depends(get_current_user)]


# ---------------------------------------------------------------- Models ----
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: dict


class ProfileIn(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    resume_text: Optional[str] = None
    preferred_roles: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None
    remote_only: Optional[bool] = None


class SaveJobIn(BaseModel):
    job: dict  # Raw normalized scraped job
    status: str = "saved"  # saved | applied | interview | offer | rejected
    notes: Optional[str] = None


class JobStatusIn(BaseModel):
    status: str
    notes: Optional[str] = None


class MatchIn(BaseModel):
    job: dict


class RankIn(BaseModel):
    jobs: list[dict]


class ImportUrlIn(BaseModel):
    url: str
    save: bool = False
    status: str = "saved"


class CoverLetterIn(BaseModel):
    job: dict
    tone: Optional[str] = "professional"  # professional | enthusiastic | casual


# ---------------------------------------------------------------- Helpers --
def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    if "_id" in doc and not isinstance(doc["_id"], str):
        doc["_id"] = str(doc["_id"])
    return doc


# ---------------------------------------------------------------- Startup --
@app.on_event("startup")
async def _startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.saved_jobs.create_index([("user_id", 1), ("external_id", 1)], unique=True)
        await db.scrape_cache.create_index("key", unique=True)
        await db.scrape_cache.create_index("expires_at", expireAfterSeconds=0)
    except Exception as e:
        log.warning("Index creation: %s", e)

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
            "profile": {},
        })
        log.info("Seeded admin user %s", ADMIN_EMAIL)
    else:
        # If admin password changed, sync
        if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
            )

    # Seed demo user
    demo_email = "demo@careeros.io"
    demo = await db.users.find_one({"email": demo_email})
    if demo is None:
        await db.users.insert_one({
            "email": demo_email,
            "password_hash": hash_password("demo1234"),
            "name": "Demo User",
            "role": "user",
            "created_at": datetime.now(timezone.utc),
            "profile": {
                "name": "Demo User",
                "headline": "Senior Full-Stack Engineer",
                "location": "Remote · Bangalore",
                "bio": "Engineer focused on React, Python, distributed systems and AI products.",
                "skills": ["React", "TypeScript", "Python", "FastAPI", "MongoDB", "AWS", "Docker", "LLMs"],
                "preferred_roles": ["Senior Engineer", "Staff Engineer", "Full Stack"],
                "preferred_locations": ["Remote", "Bangalore", "San Francisco"],
                "remote_only": False,
                "resume_text": (
                    "Senior full-stack engineer with 6+ years experience shipping production "
                    "React + Python systems. Led front-end at a Series B fintech, built realtime "
                    "trading dashboards used by 25k+ users. Strong opinions on TypeScript, async "
                    "Python, MongoDB modelling and shipping fast."
                ),
            },
        })
        log.info("Seeded demo user %s", demo_email)


# ---------------------------------------------------------------- Health ---
@app.get("/api/health")
async def health():
    return {"ok": True, "service": "careeros", "time": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------- Auth API
@app.post("/api/auth/register", response_model=AuthOut)
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name or email.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "profile": {"name": body.name or email.split("@")[0]},
    }
    res = await db.users.insert_one(doc)
    token = create_access_token(res.inserted_id, email)
    doc["_id"] = str(res.inserted_id)
    doc.pop("password_hash", None)
    return {"token": token, "user": doc}


@app.post("/api/auth/login", response_model=AuthOut)
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["_id"], email)
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@app.post("/api/auth/register-from-pdf")
async def register_from_pdf(
    pdf: UploadFile = File(..., description="LinkedIn PDF"),
    email: str = Query(..., description="Email for the new account"),
    password: str = Query(..., min_length=6, description="Password ≥6 chars"),
):
    """
    'Continue with LinkedIn' onboarding: in one shot, create an account AND
    parse the uploaded LinkedIn PDF into the profile.
    """
    email_norm = email.lower().strip()
    if not email_norm or "@" not in email_norm:
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be 6+ chars")
    if await db.users.find_one({"email": email_norm}):
        raise HTTPException(status_code=400, detail="Email already registered. Try logging in.")

    content_type = (pdf.content_type or "").lower()
    if "pdf" not in content_type and not (pdf.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="bestie, that ain't a PDF")

    content = await pdf.read()
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail=f"PDF too thicc (>{MAX_PDF_BYTES // 1024 // 1024} MB)")
    if len(content) < 200:
        raise HTTPException(status_code=400, detail="that PDF is suspiciously empty bestie")

    try:
        text = _extract_pdf_text(content)
    except Exception as e:
        log.exception("PDF extract failed")
        raise HTTPException(status_code=400, detail=f"couldn't read that PDF: {type(e).__name__}") from e

    if not text or len(text) < 100:
        raise HTTPException(status_code=400, detail="no text in PDF — is it scanned/image-only?")

    # Create user first so the AI session_id is real
    doc = {
        "email": email_norm,
        "password_hash": hash_password(password),
        "name": email_norm.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "profile": {},
    }
    res = await db.users.insert_one(doc)
    user_id = res.inserted_id

    trimmed = text[:25000]
    system = (
        "You are an expert resume parser. Given raw LinkedIn-exported PDF text, "
        "return STRICT JSON with this exact schema and nothing else:\n"
        '{ "name": "<full name>", "headline": "<title — max 80>", "location": "<city, country>", '
        '"bio": "<2-sentence first-person elevator pitch>", '
        '"skills": ["<skill>", ...up to 20], '
        '"preferred_roles": ["<role>", ...up to 5], '
        '"preferred_locations": ["<city>", ...up to 3], '
        '"resume_text": "<600-1200 word first-person resume narrative>" }\n'
        "Be honest. Do not invent jobs."
    )
    prompt = f"LINKEDIN PDF TEXT:\n{trimmed}\n\nReturn JSON now."
    try:
        raw = await _claude_json(system, prompt, session_id=f"linkedin-{user_id}")
        parsed = _extract_json(raw)
    except Exception:
        parsed = None

    profile_update: dict[str, Any] = {}
    if isinstance(parsed, dict):
        for k in ("name", "headline", "location", "bio", "resume_text"):
            v = parsed.get(k)
            if isinstance(v, str) and v.strip():
                profile_update[k] = v.strip()
        for k in ("skills", "preferred_roles", "preferred_locations"):
            v = parsed.get(k)
            if isinstance(v, list):
                cleaned = [str(x).strip() for x in v if isinstance(x, (str, int)) and str(x).strip()]
                if cleaned:
                    profile_update[k] = cleaned[:20]

    set_fields = {f"profile.{k}": v for k, v in profile_update.items()}
    if profile_update.get("name"):
        set_fields["name"] = profile_update["name"]  # also update top-level name
    if set_fields:
        await db.users.update_one({"_id": user_id}, {"$set": set_fields})

    fresh = await db.users.find_one({"_id": user_id})
    if not fresh:
        raise HTTPException(status_code=500, detail="account created but disappeared somehow??")
    token = create_access_token(user_id, email_norm)
    fresh["_id"] = str(fresh["_id"])
    fresh.pop("password_hash", None)
    return {
        "token": token,
        "user": fresh,
        "updated_keys": list(profile_update.keys()),
        "raw_text_chars": len(text),
        "profile_parsed": bool(profile_update),
    }


@app.get("/api/auth/me")
async def me(user: CurrentUser):
    return user


# ---------------------------------------------------------------- Profile --
@app.get("/api/profile")
async def get_profile(user: CurrentUser):
    return user.get("profile") or {}


@app.put("/api/profile")
async def update_profile(body: ProfileIn, user: CurrentUser):
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {f"profile.{k}": v for k, v in update.items()}},
    )
    fresh = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return (fresh or {}).get("profile") or {}


# ---------------------------------------------------------------- Scraping
SCRAPE_TTL_SECONDS = 600  # 10 minutes


async def _cached_scrape(query: str, sources: list[str], per_source: int) -> dict:
    key = json.dumps({"q": query.lower().strip(), "s": sorted(sources), "n": per_source}, sort_keys=True)
    now = datetime.now(timezone.utc)
    cached = await db.scrape_cache.find_one({"key": key})
    if cached and cached.get("expires_at"):
        exp = cached["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp > now:
            return cached["payload"]

    payload = await scrape_all(query=query, per_source=per_source, sources=sources)
    payload["cached_at"] = now.isoformat()
    payload["query"] = query

    await db.scrape_cache.update_one(
        {"key": key},
        {"$set": {
            "key": key,
            "payload": payload,
            "expires_at": now + timedelta(seconds=SCRAPE_TTL_SECONDS),
        }},
        upsert=True,
    )
    return payload


@app.get("/api/jobs/search")
async def search_jobs(
    q: str = Query("", description="Search keywords"),
    sources: Optional[str] = Query(None, description="Comma-separated: remoteok,ycombinator,hackernews,wellfound"),
    per_source: int = Query(25, ge=1, le=80),
    refresh: bool = Query(False, description="Bypass cache"),
):
    src_list = [s.strip() for s in (sources.split(",") if sources else [])] or ["remoteok", "ycombinator", "hackernews", "wellfound"]
    if refresh:
        payload = await scrape_all(query=q, per_source=per_source, sources=src_list)
        payload["query"] = q
        payload["cached_at"] = datetime.now(timezone.utc).isoformat()
    else:
        payload = await _cached_scrape(q, src_list, per_source)
    payload["total"] = len(payload.get("jobs") or [])
    return payload


# ---------------------------------------------------------------- Saved Jobs
@app.get("/api/saved-jobs")
async def list_saved_jobs(user: CurrentUser, status_filter: Optional[str] = Query(None, alias="status")):
    q = {"user_id": user["_id"]}
    if status_filter:
        q["status"] = status_filter
    items = []
    async for d in db.saved_jobs.find(q).sort("created_at", -1):
        items.append(_serialize(d))
    return {"items": items, "total": len(items)}


@app.post("/api/saved-jobs")
async def save_job(body: SaveJobIn, user: CurrentUser):
    job = body.job or {}
    if not job.get("external_id") or not job.get("title"):
        raise HTTPException(status_code=400, detail="Job must include external_id and title")
    doc = {
        "user_id": user["_id"],
        "external_id": job["external_id"],
        "source": job.get("source"),
        "title": job["title"],
        "company": job.get("company"),
        "company_logo": job.get("company_logo"),
        "location": job.get("location"),
        "remote": bool(job.get("remote")),
        "tags": job.get("tags") or [],
        "salary": job.get("salary"),
        "description": job.get("description"),
        "apply_url": job.get("apply_url"),
        "posted_at": job.get("posted_at"),
        "status": body.status,
        "notes": body.notes or "",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    try:
        res = await db.saved_jobs.update_one(
            {"user_id": user["_id"], "external_id": job["external_id"]},
            {"$set": doc, "$setOnInsert": {"_id": ObjectId()}},
            upsert=True,
        )
    except Exception as e:
        log.exception("Save job failed: %s", e)
        raise HTTPException(status_code=500, detail="Could not save job")
    saved = await db.saved_jobs.find_one({"user_id": user["_id"], "external_id": job["external_id"]})
    return _serialize(saved or {})


@app.patch("/api/saved-jobs/{job_id}")
async def update_saved_job(job_id: str, body: JobStatusIn, user: CurrentUser):
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    upd = {"updated_at": datetime.now(timezone.utc)}
    if body.status:
        upd["status"] = body.status
    if body.notes is not None:
        upd["notes"] = body.notes
    res = await db.saved_jobs.update_one({"_id": oid, "user_id": user["_id"]}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    fresh = await db.saved_jobs.find_one({"_id": oid})
    return _serialize(fresh or {})


@app.delete("/api/saved-jobs/{job_id}")
async def delete_saved_job(job_id: str, user: CurrentUser):
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.saved_jobs.delete_one({"_id": oid, "user_id": user["_id"]})
    return {"deleted": res.deleted_count}


@app.get("/api/saved-jobs/stats")
async def saved_jobs_stats(user: CurrentUser):
    pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    out: dict[str, int] = {"saved": 0, "applied": 0, "interview": 0, "offer": 0, "rejected": 0}
    async for row in db.saved_jobs.aggregate(pipeline):
        out[row["_id"]] = row["count"]
    out["total"] = sum(out.values())

    # Sources breakdown
    src_pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
    ]
    sources: dict[str, int] = {}
    async for row in db.saved_jobs.aggregate(src_pipeline):
        sources[row["_id"] or "other"] = row["count"]

    return {"by_status": out, "by_source": sources}


# ---------------------------------------------------------------- AI -------
def _profile_blob(user: dict) -> str:
    p = user.get("profile") or {}
    parts = [
        p.get("name") or "",
        p.get("headline") or "",
        p.get("location") or "",
        p.get("bio") or "",
        "Skills: " + ", ".join(p.get("skills") or []) if p.get("skills") else "",
        "Preferred roles: " + ", ".join(p.get("preferred_roles") or []) if p.get("preferred_roles") else "",
        "Resume:\n" + (p.get("resume_text") or ""),
    ]
    return "\n".join([x for x in parts if x.strip()])


def _job_blob(job: dict) -> str:
    return (
        f"Title: {job.get('title')}\n"
        f"Company: {job.get('company')}\n"
        f"Location: {job.get('location')}\n"
        f"Remote: {job.get('remote')}\n"
        f"Tags: {', '.join(job.get('tags') or [])}\n"
        f"Salary: {job.get('salary')}\n"
        f"Description:\n{(job.get('description') or '')[:1800]}"
    )


async def _claude_json(system: str, user_text: str, session_id: str) -> str:
    """Call Claude Sonnet 4.5 via emergentintegrations, expect JSON content back."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    from emergentintegrations.llm.chat import LlmChat, UserMessage  # imported lazily
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    msg = UserMessage(text=user_text)
    resp = await chat.send_message(msg)
    return resp if isinstance(resp, str) else str(resp)


@app.post("/api/ai/match")
async def ai_match(body: MatchIn, user: CurrentUser):
    profile = _profile_blob(user)
    if not profile.strip():
        raise HTTPException(status_code=400, detail="Add a profile/resume first")
    job = _job_blob(body.job)
    system = (
        "You are a senior tech recruiter scoring how well a candidate fits a job. "
        "Return STRICT JSON with this exact schema and nothing else:\n"
        "{\n"
        '  "score": <integer 0-100>,\n'
        '  "verdict": "Strong fit" | "Good fit" | "Stretch" | "Weak fit",\n'
        '  "why_fits": "<2-3 sentence narrative>",\n'
        '  "gaps": ["<short gap 1>", "<short gap 2>", "<short gap 3>"],\n'
        '  "next_steps": "<one practical sentence>"\n'
        "}\n"
        "Be honest and specific. Do not invent skills the candidate does not have."
    )
    prompt = f"CANDIDATE PROFILE:\n{profile}\n\nJOB:\n{job}\n\nReturn the JSON now."
    raw = await _claude_json(system, prompt, session_id=f"match-{user['_id']}")
    parsed = _extract_json(raw)
    if not parsed:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON")
    return parsed


@app.post("/api/ai/cover-letter")
async def ai_cover_letter(body: CoverLetterIn, user: CurrentUser):
    profile = _profile_blob(user)
    if not profile.strip():
        raise HTTPException(status_code=400, detail="Add a profile/resume first")
    job = _job_blob(body.job)
    tone = (body.tone or "professional").lower()
    system = (
        f"You are an expert career writer. Draft a {tone}, concise (≈250 words) cover letter "
        "in first person addressed to the hiring team. No salutation header (Dear …), no signature. "
        "Three short paragraphs: hook, evidence, close. Reference specific items from the job and "
        "the candidate's actual background; do not invent achievements. "
        "Return STRICT JSON: {\"cover_letter\": \"<text>\", \"subject\": \"<email subject line>\"}."
    )
    prompt = f"CANDIDATE PROFILE:\n{profile}\n\nJOB:\n{job}\n\nReturn JSON now."
    raw = await _claude_json(system, prompt, session_id=f"cover-{user['_id']}")
    parsed = _extract_json(raw)
    if not parsed:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON")
    return parsed


# ---------- Bulk re-rank (one Claude call scores N jobs) -----------
def _extract_json_any(raw: str):
    """Like _extract_json but also accepts a top-level JSON array."""
    if not raw:
        return None
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except Exception:
        pass
    # Try to find an array first, then object
    for pat in (r"\[.*\]", r"\{.*\}"):
        m = re.search(pat, raw, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                continue
    return None


@app.post("/api/ai/rank")
async def ai_rank(body: RankIn, user: CurrentUser):
    """
    Score a batch of jobs against the user's profile in a single Claude call.
    Returns: { scores: { external_id: { score, one_liner } } }
    """
    profile = _profile_blob(user)
    if not profile.strip():
        raise HTTPException(status_code=400, detail="Add a profile/resume first")
    if not body.jobs:
        return {"scores": {}}

    # Cap at 60 jobs per call to keep latency + token cost sane
    jobs = body.jobs[:60]

    # Compact job representation — minimize tokens
    compact = []
    for j in jobs:
        compact.append({
            "id": j.get("external_id") or "",
            "title": (j.get("title") or "")[:120],
            "company": (j.get("company") or "")[:60],
            "tags": (j.get("tags") or [])[:5],
            "location": (j.get("location") or "")[:60],
            "remote": bool(j.get("remote")),
            "desc": (j.get("description") or "")[:300],
        })

    system = (
        "You are a senior tech recruiter scoring how well a candidate fits each job in a batch. "
        "For EVERY job in the input, return a score 0-100 and a short one-line reason. "
        "Be honest — most jobs should score 30-70; reserve 80+ for clear strong fits. "
        "Return STRICT JSON ONLY in this exact schema:\n"
        '{"scores":[{"id":"<external_id>","score":<int>,"one_liner":"<<=14 word reason>"}, ...]}\n'
        "Include one entry per input job. Do not omit any."
    )
    prompt = (
        f"CANDIDATE PROFILE:\n{profile}\n\n"
        f"JOBS (JSON array):\n{json.dumps(compact, ensure_ascii=False)}\n\n"
        "Return the JSON now."
    )
    raw = await _claude_json(system, prompt, session_id=f"rank-{user['_id']}")
    parsed = _extract_json_any(raw)
    if not parsed:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON")

    items = parsed.get("scores") if isinstance(parsed, dict) else parsed
    if not isinstance(items, list):
        raise HTTPException(status_code=502, detail="AI response not in expected shape")

    scores_map: dict[str, dict] = {}
    for it in items:
        if not isinstance(it, dict):
            continue
        ext_id = it.get("id") or it.get("external_id")
        if not ext_id:
            continue
        try:
            score = int(it.get("score", 0))
        except (TypeError, ValueError):
            score = 0
        score = max(0, min(100, score))
        scores_map[str(ext_id)] = {
            "score": score,
            "one_liner": (it.get("one_liner") or it.get("reason") or "")[:200],
        }

    return {"scores": scores_map, "ranked_count": len(scores_map)}


# ---------- Wellfound URL import -----------
@app.post("/api/jobs/import")
async def import_job_url(body: ImportUrlIn, user: CurrentUser):
    """
    Paste a Wellfound (or AngelList legacy) job URL → fetch, parse, return
    normalized job. Optionally save in one shot when `save=true`.
    """
    url = (body.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL required")

    try:
        job = await scrape_wellfound_url(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.exception("Wellfound import failed")
        raise HTTPException(status_code=502, detail=f"Could not fetch job: {type(e).__name__}")

    if not job:
        raise HTTPException(status_code=404, detail="Could not extract any job data from that URL")

    result = {"job": job, "saved": None}

    if body.save:
        doc = {
            "user_id": user["_id"],
            "external_id": job["external_id"],
            "source": job.get("source"),
            "title": job["title"],
            "company": job.get("company"),
            "company_logo": job.get("company_logo"),
            "location": job.get("location"),
            "remote": bool(job.get("remote")),
            "tags": job.get("tags") or [],
            "salary": job.get("salary"),
            "description": job.get("description"),
            "apply_url": job.get("apply_url"),
            "posted_at": job.get("posted_at"),
            "status": body.status or "saved",
            "notes": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await db.saved_jobs.update_one(
            {"user_id": user["_id"], "external_id": job["external_id"]},
            {"$set": doc, "$setOnInsert": {"_id": ObjectId()}},
            upsert=True,
        )
        saved = await db.saved_jobs.find_one({"user_id": user["_id"], "external_id": job["external_id"]})
        result["saved"] = _serialize(saved or {})

    return result


def _extract_json(raw: str) -> Optional[dict]:
    if not raw:
        return None
    raw = raw.strip()
    # Strip code fences
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    # First, attempt direct parse
    try:
        return json.loads(raw)
    except Exception:
        pass
    # Otherwise find the first {...} block
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


# ---------- LinkedIn PDF analyzer ----------
MAX_PDF_BYTES = 8 * 1024 * 1024  # 8 MB


def _extract_pdf_text(content: bytes) -> str:
    """Extract text from a LinkedIn-exported PDF. Returns plain text or raises."""
    import io
    pieces: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text:
                pieces.append(text)
    raw = "\n".join(pieces).strip()
    raw = re.sub(r"\s*Page \d+ of \d+\s*", "\n", raw)
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw


@app.post("/api/profile/import-pdf")
async def import_profile_pdf(
    user: CurrentUser,
    pdf: UploadFile = File(..., description="LinkedIn profile PDF (max 8 MB)"),
):
    """
    Upload a LinkedIn-exported PDF → extract text → ask Claude to structure it
    into the user's profile. Saves to user.profile.
    """
    content_type = (pdf.content_type or "").lower()
    if "pdf" not in content_type and not (pdf.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="bestie, that ain't a PDF")

    content = await pdf.read()
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail=f"PDF too thicc (>{MAX_PDF_BYTES // 1024 // 1024} MB). Slim down.")
    if len(content) < 200:
        raise HTTPException(status_code=400, detail="that PDF is suspiciously empty. is your career too?")

    try:
        text = _extract_pdf_text(content)
    except Exception as e:
        log.exception("PDF extract failed")
        raise HTTPException(status_code=400, detail=f"couldn't read that PDF: {type(e).__name__}") from e

    if not text or len(text) < 100:
        raise HTTPException(status_code=400, detail="no text in PDF — is it scanned/image-only? we don't OCR yet.")

    trimmed = text[:25000]

    system = (
        "You are an expert resume parser. Given raw LinkedIn-exported PDF text, "
        "return STRICT JSON with this exact schema and nothing else:\n"
        "{\n"
        '  "name": "<full name or null>",\n'
        '  "headline": "<current role/title — max 80 chars>",\n'
        '  "location": "<city, country or null>",\n'
        '  "bio": "<2-sentence elevator pitch in first person>",\n'
        '  "skills": ["<skill>", ...up to 20],\n'
        '  "preferred_roles": ["<inferred role>", ...up to 5],\n'
        '  "preferred_locations": ["<city>", ...up to 3, include \"Remote\" if remote-friendly background],\n'
        '  "resume_text": "<a clean ~600-1200 word resume narrative in first person, suitable for AI matching>"\n'
        "}\n"
        "Be honest. Do not invent jobs. If the PDF is short, summarize what's there."
    )
    prompt = f"LINKEDIN PDF TEXT:\n{trimmed}\n\nReturn the JSON now."
    raw = await _claude_json(system, prompt, session_id=f"linkedin-{user['_id']}")
    parsed = _extract_json(raw)
    if not parsed or not isinstance(parsed, dict):
        raise HTTPException(status_code=502, detail="AI couldn't read your vibe. try again?")

    profile_update: dict[str, Any] = {}
    for k in ("name", "headline", "location", "bio", "resume_text"):
        v = parsed.get(k)
        if isinstance(v, str) and v.strip():
            profile_update[k] = v.strip()
    for k in ("skills", "preferred_roles", "preferred_locations"):
        v = parsed.get(k)
        if isinstance(v, list):
            cleaned = [str(x).strip() for x in v if isinstance(x, (str, int)) and str(x).strip()]
            if cleaned:
                profile_update[k] = cleaned[:20]

    if not profile_update:
        raise HTTPException(status_code=502, detail="AI returned nothing useful. mid PDF?")

    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {f"profile.{k}": v for k, v in profile_update.items()}},
    )

    fresh = await db.users.find_one({"_id": ObjectId(user["_id"])})
    new_profile = (fresh or {}).get("profile") or {}

    return {
        "profile": new_profile,
        "updated_keys": list(profile_update.keys()),
        "raw_text_chars": len(text),
    }


# ---------- Full data export ----------
@app.get("/api/export")
async def export_my_data(user: CurrentUser):
    """Download EVERYTHING we have on you. JSON dump."""
    full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not full_user:
        raise HTTPException(status_code=404, detail="who are you")

    saved = []
    async for d in db.saved_jobs.find({"user_id": user["_id"]}).sort("created_at", -1):
        d.pop("user_id", None)
        saved.append(_serialize(d))

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {
            "email": full_user.get("email"),
            "name": full_user.get("name"),
            "created_at": full_user.get("created_at").isoformat() if full_user.get("created_at") else None,
        },
        "profile": full_user.get("profile") or {},
        "saved_jobs": saved,
        "stats": {
            "saved_jobs_count": len(saved),
            "skills_count": len((full_user.get("profile") or {}).get("skills") or []),
        },
        "meta": {
            "tool": "CareerOS",
            "version": "3.2.0",
            "note": "everything we got on you. no spooky shadow data. yw.",
        },
    }



# ---------------------------------------------------------------- Root ----
@app.get("/api")
async def root():
    return {"name": "CareerOS API", "version": "1.0.0", "docs": "/docs"}
