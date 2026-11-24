import math


def haversine_km(a, b) -> float:
    R = 6371.0
    lat1, lng1 = math.radians(a["lat"]), math.radians(a["lng"])
    lat2, lng2 = math.radians(b["lat"]), math.radians(b["lng"])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))
