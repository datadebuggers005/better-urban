"""Image analysis helpers: EXIF GPS extraction, reverse geocoding, auto-tagging."""
from typing import Optional
import httpx
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def extract_gps(image_bytes: bytes):
    """Return (lat, lng) from EXIF GPS if present, else None."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif = img._getexif() if hasattr(img, "_getexif") else None
        if not exif:
            return None
        gps_info = None
        for tag, value in exif.items():
            if TAGS.get(tag) == "GPSInfo":
                gps_info = value
                break
        if not gps_info:
            return None

        def _to_degrees(v):
            d, m, s = v
            def _f(x):
                if isinstance(x, tuple):
                    return x[0] / x[1] if x[1] else 0.0
                return float(x)
            return _f(d) + _f(m) / 60.0 + _f(s) / 3600.0

        lat = _to_degrees(gps_info[2])
        if gps_info[1] == "S":
            lat = -lat
        lng = _to_degrees(gps_info[4])
        if gps_info[3] == "W":
            lng = -lng
        return (lat, lng)
    except Exception:  # noqa: BLE001
        return None


async def reverse_geocode(lat: float, lng: float) -> dict:
    """Free reverse geocoding via OpenStreetMap Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1},
                headers={"User-Agent": "BetterUrban/1.0"},
            )
        if r.status_code == 200:
            data = r.json()
            addr = data.get("address", {})
            return {
                "display": data.get("display_name"),
                "city": addr.get("city") or addr.get("town") or addr.get("village"),
                "state": addr.get("state"),
                "country": addr.get("country"),
                "postcode": addr.get("postcode"),
            }
    except Exception:  # noqa: BLE001
        pass
    return {}


# Candidate labels mapped to our category ids
CATEGORY_LABELS = {
    "road": ["pothole", "damaged road", "traffic jam", "road accident", "broken traffic signal"],
    "fire": ["fire", "smoke", "flood", "waterlogging", "gas leak", "building collapse"],
    "medical": ["injured person", "accident", "medical emergency", "stray animal"],
    "drainage": ["overflowing drain", "blocked drain", "open manhole", "sewage leak"],
    "water": ["pipe leak", "water pipe burst", "no water", "contaminated water"],
    "waste": ["garbage dump", "trash", "overflowing bin", "public toilet", "litter"],
    "safety": ["unsafe area", "harassment", "poor street lighting", "dark street"],
    "other": ["noise pollution", "illegal construction", "civic problem"],
}

ALL_LABELS = [lbl for labels in CATEGORY_LABELS.values() for lbl in labels]


def _map_labels_to_category(labels: list[str]) -> Optional[str]:
    best_cat, best_score = None, -1
    for cat, cands in CATEGORY_LABELS.items():
        score = sum(1 for l in labels if any(c in l.lower() for c in cands))
        if score > best_score:
            best_score, best_cat = score, cat
    return best_cat if best_score > 0 else None


async def tag_with_huggingface(image_bytes: bytes) -> list[str]:
    token = os.getenv("HF_TOKEN", "")
    if not token:
        return []
    try:
        import base64
        b64 = base64.b64encode(image_bytes).decode()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
                headers={"Authorization": f"Bearer {token}"},
                json={"inputs": b64, "parameters": {"candidate_labels": ALL_LABELS}},
            )
        if r.status_code == 200:
            data = r.json()
            # response: [{"label":..., "score":...}, ...]
            if isinstance(data, list):
                return [d["label"] for d in sorted(data, key=lambda x: x.get("score", 0), reverse=True)[:5]]
    except Exception:  # noqa: BLE001
        pass
    return []


async def tag_with_google_vision(image_bytes: bytes) -> list[str]:
    key = os.getenv("GOOGLE_VISION_API_KEY", "")
    if not key:
        return []
    try:
        import base64
        b64 = base64.b64encode(image_bytes).decode()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={key}",
                json={"requests": [{"image": {"content": b64}, "features": [{"type": "LABEL_DETECTION", "maxResults": 10}, {"type": "LANDMARK_DETECTION", "maxResults": 5}]}]},
            )
        if r.status_code == 200:
            data = r.json()
            resp = data.get("responses", [{}])[0]
            labels = [l["description"] for l in resp.get("labelAnnotations", [])]
            landmarks = [l["description"] for l in resp.get("landmarkAnnotations", [])]
            return labels + landmarks
    except Exception:  # noqa: BLE001
        pass
    return []


async def analyze_image(image_bytes: bytes) -> dict:
    gps = extract_gps(image_bytes)
    location = {}
    if gps:
        location = await reverse_geocode(*gps)
    tags = await tag_with_huggingface(image_bytes)
    if not tags:
        tags = await tag_with_google_vision(image_bytes)
    suggested_category = _map_labels_to_category(tags) if tags else None
    return {
        "gps": {"lat": gps[0], "lng": gps[1]} if gps else None,
        "location": location,
        "tags": tags,
        "suggestedCategory": suggested_category,
        "providers": {
            "huggingface": bool(os.getenv("HF_TOKEN")),
            "googleVision": bool(os.getenv("GOOGLE_VISION_API_KEY")),
        },
    }
