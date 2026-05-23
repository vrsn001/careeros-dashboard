"""CareerOS backend regression test suite."""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://4123b9c7-d40e-4e7e-a908-637911ca54c8.preview.emergentagent.com").rstrip("/")
DEMO_EMAIL = "demo@careeros.io"
DEMO_PASSWORD = "demo1234"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"demo login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def search_payload(api, auth_headers):
    # Single shared search payload to source jobs from
    r = api.get(f"{BASE_URL}/api/jobs/search", params={"per_source": 5}, timeout=90)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Health ----------
class TestHealth:
    def test_health_ok(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["service"] == "careeros"


# ---------- Auth ----------
class TestAuth:
    def test_register_new_user(self, api):
        email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
        r = api.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "secret123", "name": "Tester"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 10
        assert d["user"]["email"] == email.lower()
        assert d["user"]["name"] == "Tester"
        assert "password_hash" not in d["user"]

    def test_login_demo(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d
        assert d["user"]["email"] == DEMO_EMAIL
        assert "profile" in d["user"]
        assert d["user"]["profile"].get("skills"), "demo profile missing skills"

    def test_login_invalid(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me_with_token(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == DEMO_EMAIL

    def test_me_without_token(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 401


# ---------- Jobs Search ----------
class TestJobsSearch:
    def test_search_default(self, search_payload):
        d = search_payload
        assert "jobs" in d and isinstance(d["jobs"], list)
        assert "by_source" in d
        assert "total" in d
        # by_source is a dict of {source: [jobs]}
        for src in ["remoteok", "ycombinator", "hackernews", "wellfound"]:
            assert src in d["by_source"], f"missing source {src}"
        # status is dict of {source: "ok"/"empty"/"error"}
        assert "status" in d and isinstance(d["status"], dict)
        for src in ["remoteok", "ycombinator", "hackernews"]:
            assert d["status"].get(src) == "ok", f"{src} status={d['status'].get(src)}"
            assert len(d["by_source"][src]) > 0, f"{src} returned 0 jobs"
        # Wellfound permitted to be empty due to DataDome
        assert d["status"].get("wellfound") in ("ok", "empty", "error")

    def test_search_query_filter_python(self, api):
        r = api.get(f"{BASE_URL}/api/jobs/search", params={"q": "python", "per_source": 10}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] > 0
        # Some jobs should mention python
        blob = " ".join([
            (j.get("title", "") + " " + " ".join(j.get("tags") or []) + " " + (j.get("description") or "")).lower()
            for j in d["jobs"][:50]
        ])
        assert "python" in blob, "no python in filtered results"

    def test_search_single_source(self, api):
        r = api.get(f"{BASE_URL}/api/jobs/search", params={"sources": "remoteok", "per_source": 5}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "remoteok" in d["by_source"]
        assert set(d["by_source"].keys()) == {"remoteok"}
        for j in d["jobs"]:
            assert j.get("source") == "remoteok"


# ---------- Profile ----------
class TestProfile:
    def test_get_profile(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/profile", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d.get("skills"), "demo skills missing"

    def test_update_profile_persists(self, api, auth_headers):
        new_headline = f"TEST headline {uuid.uuid4().hex[:6]}"
        r = api.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"headline": new_headline, "skills": ["React", "Python", "FastAPI", "MongoDB"]},
            timeout=15,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["headline"] == new_headline
        # Re-fetch to confirm persistence
        r2 = api.get(f"{BASE_URL}/api/profile", headers=auth_headers, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["headline"] == new_headline
        # Restore original headline (best-effort)
        api.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"headline": "Senior Full-Stack Engineer"},
            timeout=10,
        )


# ---------- Saved Jobs ----------
class TestSavedJobs:
    @pytest.fixture(scope="class")
    def sample_job(self, search_payload):
        jobs = search_payload.get("jobs") or []
        assert jobs, "no jobs available"
        return jobs[0]

    def test_full_crud_flow(self, api, auth_headers, sample_job):
        # Save
        r = api.post(f"{BASE_URL}/api/saved-jobs", headers=auth_headers, json={"job": sample_job, "status": "saved"}, timeout=15)
        assert r.status_code == 200, r.text
        saved = r.json()
        assert saved["external_id"] == sample_job["external_id"]
        assert saved["status"] == "saved"
        job_id = saved["_id"]

        # List
        r = api.get(f"{BASE_URL}/api/saved-jobs", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        ids = [it["_id"] for it in r.json()["items"]]
        assert job_id in ids

        # Update
        r = api.patch(f"{BASE_URL}/api/saved-jobs/{job_id}", headers=auth_headers, json={"status": "applied", "notes": "TEST note"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "applied"

        # Verify update persisted via list
        r = api.get(f"{BASE_URL}/api/saved-jobs", headers=auth_headers, params={"status": "applied"}, timeout=10)
        assert r.status_code == 200
        statuses = {it["_id"]: it["status"] for it in r.json()["items"]}
        assert statuses.get(job_id) == "applied"

        # Stats
        r = api.get(f"{BASE_URL}/api/saved-jobs/stats", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        stats = r.json()
        assert "by_status" in stats and "by_source" in stats
        assert stats["by_status"]["applied"] >= 1

        # Delete
        r = api.delete(f"{BASE_URL}/api/saved-jobs/{job_id}", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

        # Verify gone
        r = api.get(f"{BASE_URL}/api/saved-jobs", headers=auth_headers, timeout=10)
        ids = [it["_id"] for it in r.json()["items"]]
        assert job_id not in ids


# ---------- AI ----------
class TestAI:
    @pytest.fixture(scope="class")
    def ai_job(self):
        # Self-contained job dict that doesn't depend on scraping
        return {
            "external_id": "test-ai-1",
            "source": "test",
            "title": "Senior Full-Stack Engineer (React + Python)",
            "company": "TestCorp",
            "location": "Remote",
            "remote": True,
            "tags": ["react", "python", "fastapi", "mongodb"],
            "salary": "$150k-$200k",
            "description": "We are looking for a senior full-stack engineer experienced in React, TypeScript, Python, FastAPI, and MongoDB to build AI-powered products. Lead front-end architecture, ship realtime dashboards, and mentor engineers.",
            "apply_url": "https://example.com/apply",
        }

    def test_ai_match(self, api, auth_headers, ai_job):
        r = api.post(f"{BASE_URL}/api/ai/match", headers=auth_headers, json={"job": ai_job}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "score" in d
        assert isinstance(d["score"], int) and 0 <= d["score"] <= 100
        assert d["verdict"] in ("Strong fit", "Good fit", "Stretch", "Weak fit")
        assert d.get("why_fits") and isinstance(d["why_fits"], str)
        assert isinstance(d.get("gaps"), list)
        assert d.get("next_steps") and isinstance(d["next_steps"], str)

    def test_ai_cover_letter(self, api, auth_headers, ai_job):
        r = api.post(f"{BASE_URL}/api/ai/cover-letter", headers=auth_headers, json={"job": ai_job, "tone": "professional"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("cover_letter") and len(d["cover_letter"]) > 100
        assert d.get("subject") and isinstance(d["subject"], str)
