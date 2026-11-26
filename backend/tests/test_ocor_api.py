import io
import os
import sys
import tempfile
import pytest
from PIL import Image
from fastapi.testclient import TestClient

# Isolate SQLite DB and uploads to a temporary directory before importing main
_TMP = tempfile.mkdtemp(prefix="ocor_test_")
os.environ["DB_BACKEND"] = "local"
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP, 'test_ocor.db')}"
os.environ["UPLOAD_DIR"] = os.path.join(_TMP, "uploads")

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app  # noqa: E402

client = TestClient(app)


def _login(email: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["idToken"]


def _make_png_bytes() -> bytes:
    img = Image.new("RGB", (32, 32), color=(40, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_and_cities_and_categories():
    r = client.get("/health")
    assert r.status_code == 200
    assert "OCOR" in r.json()["brand"]

    cats = client.get("/api/categories").json()
    cat_ids = {c["id"] for c in cats}
    assert cat_ids == {"road", "water", "garbage", "drainage", "streetlight"}

    sectors = client.get("/api/cities/metro/sectors").json()
    assert len(sectors) == 20
    assert all("wardNumber" in s for s in sectors)


def test_signup_login_and_rbac():
    # Signup new citizen
    r = client.post("/api/auth/signup", json={
        "name": "Aarav Test",
        "email": "aarav@ocor.city",
        "password": "password123",
        "cityId": "metro",
    })
    assert r.status_code == 200, r.text
    citizen_token = r.json()["idToken"]
    citizen_uid = r.json()["uid"]
    assert r.json()["profile"]["role"] == "citizen"

    # Officer & Admin login
    officer_token = _login("officer@ocor.city", "officer1234")
    admin_token = _login("admin@ocor.city", "admin1234")

    # Citizen cannot access admin endpoints
    assert client.get("/api/admin/incidents", headers={"Authorization": f"Bearer {citizen_token}"}).status_code == 403
    assert client.get("/api/admin/activity-logs", headers={"Authorization": f"Bearer {citizen_token}"}).status_code == 403

    # Officer can access admin incidents, cannot change user role
    assert client.get("/api/admin/incidents", headers={"Authorization": f"Bearer {officer_token}"}).status_code == 200
    assert client.patch(
        f"/api/admin/users/{citizen_uid}/role",
        json={"role": "officer"},
        headers={"Authorization": f"Bearer {officer_token}"},
    ).status_code == 403

    # Admin can promote citizen to officer
    r_role = client.patch(
        f"/api/admin/users/{citizen_uid}/role",
        json={"role": "officer"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r_role.status_code == 200
    assert r_role.json()["role"] == "officer"


def test_upload_vision_incident_lifecycle_and_duplicates():
    citizen_token = _login("demo@ocor.city", "demo1234")
    officer_token = _login("officer@ocor.city", "officer1234")
    png_bytes = _make_png_bytes()

    # Upload photo
    up = client.post(
        "/api/uploads",
        files={"file": ("pothole_main.png", png_bytes, "image/png")},
    )
    assert up.status_code == 200, up.text
    photo_url = up.json()["url"]
    assert photo_url.startswith("/uploads/")

    # Vision analyze
    vis = client.post(
        "/api/vision/analyze-public",
        files={"file": ("pothole_main.png", png_bytes, "image/png")},
    )
    assert vis.status_code == 200
    assert len(vis.json()["tags"]) > 0
    assert vis.json()["suggestedCategory"] == "road"

    # Create incident
    inc_res = client.post(
        "/api/incidents",
        json={
            "categoryId": "road",
            "subCategoryId": "road-pothole",
            "title": "Large pothole near Ward 18 school",
            "note": "Needs urgent repair",
            "lat": 28.6455,
            "lng": 77.2175,
            "cityId": "metro",
            "sectorId": "metro-s18",
            "wardNumber": 18,
            "landmark": "Near Public School Gate",
            "photoUrl": photo_url,
            "tags": vis.json()["tags"],
            "severity": "high",
        },
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert inc_res.status_code == 200, inc_res.text
    inc = inc_res.json()
    inc_id = inc["id"]
    assert inc["status"] == "submitted"
    assert inc["mapColor"] == "RED"
    assert inc["wardNumber"] == 18
    assert inc["photoUrl"] == photo_url

    # Duplicate check within 100m
    dup = client.post(
        "/api/incidents/check-duplicate",
        json={"lat": 28.64552, "lng": 77.21752, "categoryId": "road", "cityId": "metro"},
    )
    assert dup.status_code == 200
    assert dup.json()["hasDuplicates"] is True
    assert any(m["id"] == inc_id for m in dup.json()["matches"])

    # Citizen cannot update status directly
    assert client.patch(
        f"/api/incidents/{inc_id}/status",
        json={"status": "verified"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    ).status_code == 403

    # Officer walks through full 7-state lifecycle
    expected_colors = [
        ("under_review", "RED"),
        ("verified", "RED"),
        ("assigned", "YELLOW"),
        ("in_progress", "YELLOW"),
        ("resolved", "GREEN"),
    ]
    for st, color in expected_colors:
        res = client.patch(
            f"/api/incidents/{inc_id}/status",
            json={"status": st},
            headers={"Authorization": f"Bearer {officer_token}"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == st
        assert res.json()["mapColor"] == color

    # Citizen closes & rates resolved complaint
    close_res = client.post(
        f"/api/incidents/{inc_id}/close",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"
    assert close_res.json()["mapColor"] == "GREEN"

    rate_res = client.post(
        f"/api/incidents/{inc_id}/rate",
        json={"rating": 5, "comment": "Great fix!"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert rate_res.status_code == 200

    # Activity logs, data quality, data sources, feedback
    logs = client.get("/api/admin/activity-logs", headers={"Authorization": f"Bearer {officer_token}"})
    assert logs.status_code == 200
    assert len(logs.json()) >= 2

    dq = client.get("/api/admin/data-quality", headers={"Authorization": f"Bearer {officer_token}"})
    assert dq.status_code == 200
    assert "qualityScore" in dq.json()

    ds = client.get("/api/data-sources")
    assert ds.status_code == 200
    assert len(ds.json()) >= 3

    fb = client.post("/api/feedback", json={"name": "Riya", "email": "demo@ocor.city", "message": "Very helpful", "rating": 5})
    assert fb.status_code == 200
