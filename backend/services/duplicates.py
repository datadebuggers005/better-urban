"""Proximity-based duplicate complaint detection."""
from typing import Optional, List, Dict
from utils.geo import haversine_km
from services.seed_data import normalize_category_id


def find_duplicates(
    incidents: List[Dict],
    lat: float,
    lng: float,
    category_id: str,
    city_id: Optional[str] = None,
    threshold_meters: float = 100.0,
) -> List[Dict]:
    """Return existing open/active incidents within threshold_meters with the same category."""
    target_cat = normalize_category_id(category_id)
    point = {"lat": lat, "lng": lng}
    matches = []
    for inc in incidents:
        if city_id and inc.get("cityId") != city_id:
            continue
        if inc.get("status") == "closed":
            continue
        if normalize_category_id(inc.get("categoryId", "")) != target_cat:
            continue
        dist_m = haversine_km(point, {"lat": inc.get("lat", 0), "lng": inc.get("lng", 0)}) * 1000.0
        if dist_m <= threshold_meters:
            matches.append({
                "id": inc["id"],
                "code": inc["code"],
                "title": inc["title"],
                "status": inc["status"],
                "wardNumber": inc.get("wardNumber"),
                "distanceMeters": round(dist_m, 1),
                "createdAt": inc.get("createdAt"),
            })
    matches.sort(key=lambda m: m["distanceMeters"])
    return matches
