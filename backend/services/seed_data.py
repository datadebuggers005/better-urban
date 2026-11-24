"""Static seed data for cities and sectors (mirrors frontend lib/catalog.ts + lib/seed.ts)."""
from typing import List, Dict

CITIES = [
    {"id": "metro", "name": "Metro City", "short": "Metro", "center": {"lat": 28.6448, "lng": 77.2167}},
    {"id": "riverport", "name": "Riverport", "short": "River", "center": {"lat": 19.076, "lng": 72.8777}},
    {"id": "northvale", "name": "Northvale", "short": "North", "center": {"lat": 12.9716, "lng": 77.5946}},
    {"id": "oldtown", "name": "Old Town", "short": "Old", "center": {"lat": 18.5204, "lng": 73.8567}},
    {"id": "greenfield", "name": "Greenfield", "short": "Green", "center": {"lat": 26.9124, "lng": 75.7873}},
]

SECTORS: List[Dict] = []
# Generate 20 sectors per city around the center (deterministic-ish grid).
import math

for city in CITIES:
    lat0, lng0 = city["center"]["lat"], city["center"]["lng"]
    for i in range(1, 21):
        # spiral-ish placement
        angle = (i / 20) * 2 * math.pi
        radius = 0.02 + (i % 5) * 0.008
        SECTORS.append({
            "id": f"{city['id']}-s{i}",
            "cityId": city["id"],
            "name": f"Sector {i}",
            "lat": round(lat0 + radius * math.cos(angle), 6),
            "lng": round(lng0 + radius * math.sin(angle), 6),
        })

CATEGORIES = [
    {"id": "road", "name": "Road & Traffic", "short": "Road", "blurb": "Jam, potholes, signals", "accent": "#E3A33C"},
    {"id": "fire", "name": "Fire & Disaster", "short": "Fire", "blurb": "Fire, flood, gas leak", "accent": "#C2543A"},
    {"id": "medical", "name": "Medical Emergency", "short": "Medical", "blurb": "Accident, injury, aid", "accent": "#C0392B"},
    {"id": "drainage", "name": "Sewage & Drainage", "short": "Drainage", "blurb": "Overflow, blocked drain", "accent": "#7A6C4F"},
    {"id": "water", "name": "Water Issue", "short": "Water", "blurb": "Pipe leak, no supply", "accent": "#3E7C8C"},
    {"id": "waste", "name": "Waste & Sanitation", "short": "Waste", "blurb": "Garbage dump, cleaning", "accent": "#6B8E4E"},
    {"id": "safety", "name": "Women Safety", "short": "Safety", "blurb": "SOS alert, unsafe zone", "accent": "#8E5A8E"},
    {"id": "other", "name": "Others", "short": "Other", "blurb": "Other urban problems", "accent": "#5B6B85"},
]

SUB_CATEGORIES = [
    {"id": "road-jam", "categoryId": "road", "name": "Roadblock / Traffic Jam"},
    {"id": "road-pothole", "categoryId": "road", "name": "Potholes / Damaged Road"},
    {"id": "road-accident", "categoryId": "road", "name": "Road Accident"},
    {"id": "road-signal", "categoryId": "road", "name": "Faulty Traffic Signal / Streetlight"},
    {"id": "fire-fire", "categoryId": "fire", "name": "Fire / Smoke"},
    {"id": "fire-flood", "categoryId": "fire", "name": "Waterlogging / Flood"},
    {"id": "fire-gas", "categoryId": "fire", "name": "Gas Leak"},
    {"id": "fire-collapse", "categoryId": "fire", "name": "Building / Wall Collapse"},
    {"id": "medical-injury", "categoryId": "medical", "name": "Accident / Injury"},
    {"id": "medical-emergency", "categoryId": "medical", "name": "Medical Emergency"},
    {"id": "medical-animal", "categoryId": "medical", "name": "Stray Animal Attack"},
    {"id": "drain-overflow", "categoryId": "drainage", "name": "Overflow / Blocked Drain"},
    {"id": "drain-manhole", "categoryId": "drainage", "name": "Open Manhole"},
    {"id": "drain-leak", "categoryId": "drainage", "name": "Sewage Leak"},
    {"id": "water-leak", "categoryId": "water", "name": "Pipe Leak / Burst"},
    {"id": "water-supply", "categoryId": "water", "name": "No Water Supply"},
    {"id": "water-quality", "categoryId": "water", "name": "Contaminated Water"},
    {"id": "waste-dump", "categoryId": "waste", "name": "Garbage Dump"},
    {"id": "waste-collection", "categoryId": "waste", "name": "Missed Collection"},
    {"id": "waste-toilet", "categoryId": "waste", "name": "Public Toilet Issue"},
    {"id": "safety-sos", "categoryId": "safety", "name": "SOS / Unsafe Zone"},
    {"id": "safety-harassment", "categoryId": "safety", "name": "Harassment"},
    {"id": "safety-lighting", "categoryId": "safety", "name": "Poor Street Lighting"},
    {"id": "other-noise", "categoryId": "other", "name": "Noise Pollution"},
    {"id": "other-construction", "categoryId": "other", "name": "Illegal Construction"},
    {"id": "other-civic", "categoryId": "other", "name": "Other Civic Problem"},
]

DEMO_NGOS = ["Civic Response Collective", "Green Hands Foundation"]

VOLUNTEER_SKILLS = ["Traffic Support", "First Aid", "Relief & Rescue"]


def orgs_for_city(city_name: str):
    return [f"{city_name} Municipal Control Room", f"{city_name} Traffic Police"]


def sectors_for_city(city_id: str):
    return [s for s in SECTORS if s["cityId"] == city_id]


def city_by_id(city_id: str):
    return next((c for c in CITIES if c["id"] == city_id), CITIES[0])
