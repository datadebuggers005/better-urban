"""Static seed data for cities, wards/sectors, categories, status metadata, and data sources."""
import math
from typing import List, Dict

CITIES = [
    {"id": "metro", "name": "Metro City", "short": "Metro", "center": {"lat": 28.6448, "lng": 77.2167}},
    {"id": "riverport", "name": "Riverport", "short": "River", "center": {"lat": 19.076, "lng": 72.8777}},
    {"id": "northvale", "name": "Northvale", "short": "North", "center": {"lat": 12.9716, "lng": 77.5946}},
    {"id": "oldtown", "name": "Old Town", "short": "Old", "center": {"lat": 18.5204, "lng": 73.8567}},
    {"id": "greenfield", "name": "Greenfield", "short": "Green", "center": {"lat": 26.9124, "lng": 75.7873}},
]

SECTORS: List[Dict] = []
for city in CITIES:
    lat0, lng0 = city["center"]["lat"], city["center"]["lng"]
    for i in range(1, 21):
        angle = (i / 20) * 2 * math.pi
        radius = 0.02 + (i % 5) * 0.008
        SECTORS.append({
            "id": f"{city['id']}-s{i}",
            "cityId": city["id"],
            "name": f"Ward {i} · Sector {i}",
            "wardNumber": i,
            "lat": round(lat0 + radius * math.cos(angle), 6),
            "lng": round(lng0 + radius * math.sin(angle), 6),
        })

CATEGORIES = [
    {"id": "road", "name": "Road", "short": "Road", "blurb": "Potholes, damaged road, traffic", "accent": "#1976d2"},
    {"id": "water", "name": "Water", "short": "Water", "blurb": "Pipe leak, no supply, quality", "accent": "#4fb3e8"},
    {"id": "garbage", "name": "Garbage", "short": "Garbage", "blurb": "Garbage dump, missed pickup", "accent": "#3dbe8b"},
    {"id": "drainage", "name": "Drainage", "short": "Drainage", "blurb": "Blocked drain, overflow, manhole", "accent": "#f5a623"},
    {"id": "streetlight", "name": "Streetlight", "short": "Streetlight", "blurb": "Dark street, faulty pole", "accent": "#e5484d"},
]

CATEGORY_ALIASES = {
    "waste": "garbage",
    "fire": "road",
    "medical": "road",
    "safety": "streetlight",
    "other": "road",
}


def normalize_category_id(category_id: str) -> str:
    cid = (category_id or "road").strip().lower()
    if cid in {c["id"] for c in CATEGORIES}:
        return cid
    return CATEGORY_ALIASES.get(cid, "road")


SUB_CATEGORIES = [
    {"id": "road-pothole", "categoryId": "road", "name": "Potholes / Damaged Road"},
    {"id": "road-jam", "categoryId": "road", "name": "Roadblock / Traffic Jam"},
    {"id": "road-accident", "categoryId": "road", "name": "Road Hazard / Damaged Divider"},
    {"id": "water-leak", "categoryId": "water", "name": "Pipe Leak / Burst"},
    {"id": "water-supply", "categoryId": "water", "name": "No Water Supply"},
    {"id": "water-quality", "categoryId": "water", "name": "Contaminated Water"},
    {"id": "garbage-dump", "categoryId": "garbage", "name": "Garbage Dump"},
    {"id": "garbage-collection", "categoryId": "garbage", "name": "Missed Collection"},
    {"id": "garbage-bin", "categoryId": "garbage", "name": "Overflowing Public Bin"},
    {"id": "drainage-overflow", "categoryId": "drainage", "name": "Overflow / Blocked Drain"},
    {"id": "drainage-manhole", "categoryId": "drainage", "name": "Open Manhole"},
    {"id": "drainage-leak", "categoryId": "drainage", "name": "Sewage Leak"},
    {"id": "streetlight-outage", "categoryId": "streetlight", "name": "Streetlight Not Working"},
    {"id": "streetlight-flicker", "categoryId": "streetlight", "name": "Flickering / Exposed Pole"},
    {"id": "streetlight-dark", "categoryId": "streetlight", "name": "Dark / Unsafe Stretch"},
]

STATUS_ORDER = [
    "submitted",
    "under_review",
    "verified",
    "assigned",
    "in_progress",
    "resolved",
    "closed",
]

STATUS_META = {
    "submitted": {"label": "Submitted", "short": "Submitted", "step": 0, "mapColor": "RED"},
    "under_review": {"label": "Under Review", "short": "Under Review", "step": 1, "mapColor": "RED"},
    "verified": {"label": "Verified", "short": "Verified", "step": 2, "mapColor": "RED"},
    "assigned": {"label": "Assigned", "short": "Assigned", "step": 3, "mapColor": "YELLOW"},
    "in_progress": {"label": "In Progress", "short": "In Progress", "step": 4, "mapColor": "YELLOW"},
    "resolved": {"label": "Resolved", "short": "Resolved", "step": 5, "mapColor": "GREEN"},
    "closed": {"label": "Closed", "short": "Closed", "step": 6, "mapColor": "GREEN"},
}

LEGACY_STATUS_MAP = {
    "reported": "submitted",
    "dispatched": "under_review",
    "acknowledged": "verified",
}


def normalize_status(status: str) -> str:
    s = (status or "submitted").strip().lower()
    if s in STATUS_META:
        return s
    return LEGACY_STATUS_MAP.get(s, "submitted")


def map_color_for_status(status: str) -> str:
    norm = normalize_status(status)
    return STATUS_META[norm]["mapColor"]


DEMO_NGOS = ["Civic Response Collective", "Green Hands Foundation"]
VOLUNTEER_SKILLS = ["Traffic Support", "First Aid", "Relief & Rescue"]

DATA_SOURCES = [
    {
        "id": "src-municipal-wards",
        "name": "Municipal Ward & Sector Boundaries",
        "source": "OCOR Civic Geo Registry (5 Cities, 100 Wards)",
        "category": "Geospatial",
        "refreshCycle": "Quarterly",
        "lastUpdated": "2026-11-20T00:00:00Z",
        "status": "active",
    },
    {
        "id": "src-citizen-reports",
        "name": "OCOR Citizen Complaint Stream",
        "source": "OCOR Local SQLite / Firestore Incidents",
        "category": "Crowdsourced Civic Reports",
        "refreshCycle": "Real-time",
        "lastUpdated": "2026-11-26T00:00:00Z",
        "status": "active",
    },
    {
        "id": "src-nominatim-osm",
        "name": "OpenStreetMap Nominatim Geocoder",
        "source": "OpenStreetMap Foundation",
        "category": "Reverse Geocoding",
        "refreshCycle": "On-demand",
        "lastUpdated": "2026-11-26T00:00:00Z",
        "status": "active",
    },
    {
        "id": "src-vision-triage",
        "name": "OCOR Photo Auto-Tagger & EXIF Extractor",
        "source": "Local PIL EXIF + HuggingFace / Google Vision",
        "category": "Media Triage",
        "refreshCycle": "On-upload",
        "lastUpdated": "2026-11-26T00:00:00Z",
        "status": "active",
    },
]


def orgs_for_city(city_name: str):
    return [f"{city_name} Municipal Control Room", f"{city_name} Public Works Dept"]


def sectors_for_city(city_id: str):
    return [s for s in SECTORS if s["cityId"] == city_id]


def city_by_id(city_id: str):
    return next((c for c in CITIES if c["id"] == city_id), CITIES[0])


def ward_for_sector(sector_id: str) -> int:
    sec = next((s for s in SECTORS if s["id"] == sector_id), None)
    if sec:
        return int(sec["wardNumber"])
    # fallback parse e.g. metro-s18 -> 18
    if sector_id and "-s" in sector_id:
        try:
            return int(sector_id.split("-s")[-1])
        except ValueError:
            pass
    return 1
