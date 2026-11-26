"""Seed Firestore with demo data (run after Firebase is configured)."""
import os, sys, random
from datetime import datetime, timezone
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

def _now():
    return datetime.now(timezone.utc).isoformat()

# 1. Demo citizen
DEMO_EMAIL = "demo@ocor.city"
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
    "alertRadiusKm": 3, "role": "citizen", "createdAt": _now(),
}, merge=True)
print("Demo citizen:", uid, "(demo@ocor.city / demo1234)")

# 2. Officer account
try:
    off = auth.get_user_by_email("officer@ocor.city")
except Exception:
    off = auth.create_user(email="officer@ocor.city", password="officer1234", display_name="Vikram Mehta")
db.collection("users").document(off.uid).set({
    "name": "Vikram Mehta", "email": "officer@ocor.city", "phone": "",
    "cityId": "metro", "sectorId": "metro-s5", "stars": 120, "helped": 18,
    "isVolunteer": False, "skills": ["Field Inspection"],
    "preferredCategories": ["road", "water", "drainage"], "alertsEnabled": True,
    "alertRadiusKm": 5, "role": "officer", "createdAt": _now(),
}, merge=True)
print("Officer:", off.uid, "(officer@ocor.city / officer1234)")

# 3. Admin account
try:
    adm = auth.get_user_by_email("admin@ocor.city")
except Exception:
    adm = auth.create_user(email="admin@ocor.city", password="admin1234", display_name="Ananya Verma")
db.collection("users").document(adm.uid).set({
    "name": "Ananya Verma", "email": "admin@ocor.city", "phone": "",
    "cityId": "metro", "sectorId": "metro-s1", "stars": 500, "helped": 42,
    "isVolunteer": False, "skills": ["Operations", "Dispatch"],
    "preferredCategories": ["road", "water", "garbage", "drainage", "streetlight"],
    "alertsEnabled": True, "alertRadiusKm": 10, "role": "admin", "createdAt": _now(),
}, merge=True)
print("Admin:", adm.uid, "(admin@ocor.city / admin1234)")

# 4. Seed cities + sectors
for city in CITIES:
    db.collection("cities").document(city["id"]).set(city)
for sec in SECTORS:
    db.collection("sectors").document(sec["id"]).set(sec)
print(f"Seeded {len(CITIES)} cities, {len(SECTORS)} sectors")

# 5. Seed citizens
random.seed(20261123)
for i in range(20):
    cid = f"u_seed_{i}"
    db.collection("users").document(cid).set({
        "name": f"Citizen {i}", "email": f"citizen{i}@ocor.city",
        "phone": "", "cityId": "metro", "sectorId": f"metro-s{(i % 20) + 1}",
        "stars": random.randint(0, 200), "helped": random.randint(0, 10),
        "isVolunteer": random.random() > 0.7, "skills": [],
        "preferredCategories": ["road", "waste"], "alertsEnabled": True,
        "alertRadiusKm": 3, "role": "citizen", "createdAt": _now(),
    })
print("Seeded 20 citizens")

# 6. Seed incidents
titles = ["Potholes / Damaged Road", "Garbage Dump", "Roadblock / Traffic Jam", "Pipe Leak / Burst", "Open Manhole"]
for i in range(15):
    code = f"OC-{2049 + i}"
    inc = {
        "code": code, "cityId": "metro", "sectorId": f"metro-s{(i % 20) + 1}",
        "wardNumber": (i % 20) + 1, "categoryId": "road", "subCategoryId": "road-pothole",
        "title": titles[i % len(titles)], "note": "Seeded demo incident.",
        "lat": 28.6448, "lng": 77.2167, "landmark": f"Sector {(i % 20) + 1} Main Rd",
        "photoUrl": None, "isAnonymous": False,
        "reporterId": "u_demo" if i < 3 else f"u_seed_{i}",
        "reporterName": "Riya Sharma" if i < 3 else f"Citizen {i}",
        "status": ["resolved", "submitted", "in_progress", "reported", "verified"][i % 5],
        "mapColor": "RED", "severity": "medium", "radiusKm": 3.0, "alertedCount": 10,
        "notifiedOrgs": orgs_for_city("Delhi"), "notifiedNgos": DEMO_NGOS,
        "events": [], "helpedBy": [], "createdAt": _now(), "resolvedAt": None,
        "closedAt": None, "rating": 5 if i % 5 == 0 else None, "ratingComment": None,
        "tags": [], "duplicateOf": None, "assignedTo": None, "assignedToName": None,
    }
    db.collection("incidents").add(inc)
print("Seeded 15 incidents")

# 7. Notification for demo
db.collection("notifications").add({
    "userId": uid, "type": "status", "incidentId": None,
    "title": "OC-2049 · Field team assigned",
    "body": "Your report was acknowledged by the Delhi control room.",
    "createdAt": _now(), "read": False,
})
print("Done. Firebase seeded with OCOR demo data.")
PY