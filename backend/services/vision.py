"""Image analysis helpers: EXIF GPS extraction, reverse geocoding, auto-tagging."""
import io
import os
from typing import Optional
import httpx
from PIL import Image
from PIL.ExifTags import TAGS


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
                headers={"User-Agent": "OCOR-CivicApp/1.0"},
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


# Candidate labels mapped to canonical 5 categories
CATEGORY_LABELS = {
    "road": ["pothole", "damaged road", "asphalt", "traffic jam", "broken road"],
    "water": ["pipe leak", "water burst", "puddle", "water supply", "contaminated water"],
    "garbage": ["garbage dump", "trash", "waste", "overflowing bin", "litter"],
    "drainage": ["overflowing drain", "blocked drain", "open manhole", "sewage leak", "clogged gutter"],
    "streetlight": ["broken streetlight", "dark street", "lamp post", "street lighting", "electrical pole"],
}

ALL_LABELS = [lbl for labels in CATEGORY_LABELS.values() for lbl in labels]


def _map_labels_to_category(labels: list[str]) -> Optional[str]:
    best_cat, best_score = None, -1
    for cat, cands in CATEGORY_LABELS.items():
        score = sum(1 for lbl in labels if any(c in lbl.lower() or lbl.lower() in c for c in cands))
        if score > best_score:
            best_score, best_cat = score, cat
    return best_cat if best_score > 0 else None


def _local_fallback_tags(image_bytes: bytes, filename: str = "") -> tuple[list[str], str]:
    """Deterministic local tagger when external vision APIs are not configured."""
    name = (filename or "").lower()
    if any(k in name for k in ("water", "pipe", "leak")):
        return ["pipe leak", "water supply", "civic infrastructure"], "water"
    if any(k in name for k in ("garbage", "trash", "waste", "dump", "bin")):
        return ["garbage dump", "waste", "sanitation"], "garbage"
    if any(k in name for k in ("drain", "sewage", "manhole", "flood")):
        return ["blocked drain", "overflowing drain", "drainage"], "drainage"
    if any(k in name for k in ("light", "lamp", "dark", "pole")):
        return ["broken streetlight", "lamp post", "night safety"], "streetlight"
    if any(k in name for k in ("road", "pothole", "street", "traffic")):
        return ["pothole", "damaged road", "road maintenance"], "road"

    # Inspect average brightness/color if valid image
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((16, 16))
        pixels = list(img.getdata())
        r_avg = sum(p[0] for p in pixels) / len(pixels)
        g_avg = sum(p[1] for p in pixels) / len(pixels)
        b_avg = sum(p[2] for p in pixels) / len(pixels)
        brightness = (r_avg + g_avg + b_avg) / 3.0
        if brightness < 65:
            return ["dark street", "broken streetlight", "poor lighting"], "streetlight"
        if b_avg > r_avg + 15 and b_avg > g_avg + 10:
            return ["pipe leak", "water burst", "waterlogging"], "water"
        if g_avg > r_avg + 10:
            return ["garbage dump", "litter", "public sanitation"], "garbage"
    except Exception:  # noqa: BLE001
        pass
    return ["pothole", "damaged road", "civic issue"], "road"


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
                json={
                    "requests": [
                        {
                            "image": {"content": b64},
                            "features": [
                                {"type": "LABEL_DETECTION", "maxResults": 10},
                                {"type": "LANDMARK_DETECTION", "maxResults": 5},
                            ],
                        }
                    ]
                },
            )
        if r.status_code == 200:
            data = r.json()
            resp = data.get("responses", [{}])[0]
            labels = [lbl["description"] for lbl in resp.get("labelAnnotations", [])]
            landmarks = [lbl["description"] for lbl in resp.get("landmarkAnnotations", [])]
            return labels + landmarks
    except Exception:  # noqa: BLE001
        pass
    return []


async def analyze_image(image_bytes: bytes, filename: str = "") -> dict:
    gps = extract_gps(image_bytes)
    location = {}
    if gps:
        location = await reverse_geocode(*gps)
    tags = await tag_with_huggingface(image_bytes)
    if not tags:
        tags = await tag_with_google_vision(image_bytes)
    suggested_category = _map_labels_to_category(tags) if tags else None
    if not tags:
        tags, fallback_cat = _local_fallback_tags(image_bytes, filename)
        suggested_category = suggested_category or fallback_cat
    return {
        "gps": {"lat": gps[0], "lng": gps[1]} if gps else None,
        "location": location,
        "tags": tags,
        "suggestedCategory": suggested_category or "road",
        "providers": {
            "huggingface": bool(os.getenv("HF_TOKEN")),
            "googleVision": bool(os.getenv("GOOGLE_VISION_API_KEY")),
            "localFallback": not (bool(os.getenv("HF_TOKEN")) or bool(os.getenv("GOOGLE_VISION_API_KEY"))),
        },
    }
