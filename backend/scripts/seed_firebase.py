"""Seed Firestore with demo data (run after Firebase is configured)."""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.config import get_settings
from core.firebase import get_auth, get_db
from services.seed_data import CITIES, SECTORS, orgs_for_city, DEMO_NGOS

settings = get_settings()
if not settings.firebase_project_id:
    print("Set FIREBASE_PROJECT_ID in .env first")
    sys.exit(1)

auth = get_auth()
db = get_db()

# 1. Demo user
DEMO_EMAIL = "demo@betterurban.app"
DEMO_PASSWORD = "demo1234"
try:
    user = auth.get_user_by_email(DEMO_EMAIL)
except Exception:
    user = auth.create_user(email=DEMO_EMAIL, password=DEMO_PASSWORD, display_name="Riya Sharma")
uid = user.uid
db.collection("users").document(uid).set({
    "name": "Riya Sharma", "email": DEMO_EMAIL, "phone": "",
    "cityId": "metro", "sectorId": "metro-s18", "stars": 340, "helped": 6,
    "isVolunteer": True, "skills": ["Traffic Support", "First Aid"],
    "preferredCategories": ["road", "waste"], "alertsEnabled": True,
    "alertRadiusKm": 3, "role": "citizen",
}, merge=True)
print("Demo user:", uid)

# 2. Seed cities + sectors
for city in CITIES:
    db.collection("cities").document(city["id"]).set(city)
for sec in SECTORS:
    db.collection("sectors").document(sec["id"]).set(sec)
print(f"Seeded {len(CITIES)} cities, {len(SECTORS)} sectors")

# 3. Seed a few citizens + incidents
random.seed(20261123)
for i in range(20):
    cid = f"u_seed_{i}"
    db.collection("users").document(cid).set({
        "name": f"Citizen {i}", "email": f"citizen{i}@betterurban.app",
        "phone": "", "cityId": "metro", "sectorId": f"metro-s{(i % 20) + 1}",
        "stars": random.randint(0, 200), "helped": random.randint(0, 10),
        "isVolunteer": random.random() > 0.7, "skills": [],
        "preferredCategories": ["road", "waste"], "alertsEnabled": True,
        "alertRadiusKm": 3, "role": "citizen",
    })
print("Seeded 20 citizens")

titles = ["Potholes / Damaged Road", "Garbage Dump", "Roadblock / Traffic Jam", "Pipe Leak / Burst", "Open Manhole"]
for i in range(15):
    code = f"BU-{2049 + i}"
    inc = {
        "code": code, "cityId": "metro", "sectorId": f"metro-s{(i % 20) + 1}",
        "categoryId": "road", "subCategoryId": "road-pothole",
        "title": titles[i % len(titles)], "note": "Seeded demo incident.",
        "lat": 28.6448, "lng": 77.2167, "landmark": f"Sector {(i % 20) + 1} Main Rd",
        "photoUrl": None, "isAnonymous": False,
        "reporterId": "u_demo" if i < 3 else f"u_seed_{i}",
        "reporterName": "Riya Sharma" if i < 3 else f"Citizen {i}",
        "status": ["resolved", "dispatched", "in_progress", "reported", "acknowledged"][i % 5],
        "severity": "medium", "radiusKm": 3.0, "alertedCount": 10,
        "notifiedOrgs": orgs_for_city("Metro City"), "notifiedNgos": DEMO_NGOS,
        "events": [], "helpedBy": [], "createdAt": None, "resolvedAt": None,
        "rating": 5 if i % 5 == 0 else None, "ratingComment": None,
    }
    from datetime import datetime, timezone
    inc["createdAt"] = datetime.now(timezone.utc).isoformat()
    db.collection("incidents").add(inc)
print("Seeded 15 incidents")

db.collection("notifications").add({
    "userId": "u_demo", "type": "status", "incidentId": None,
    "title": "BU-2049 · Field team assigned",
    "body": "Your report was acknowledged by the Metro City control room.",
    "createdAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    "read": False,
})
print("Done. Firebase seeded.")
PY