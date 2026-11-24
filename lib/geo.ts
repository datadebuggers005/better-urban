export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function offsetPoint(origin: LatLng, kmNorth: number, kmEast: number): LatLng {
  const lat = origin.lat + kmNorth / 111;
  const lng = origin.lng + kmEast / (111 * Math.cos((origin.lat * Math.PI) / 180));
  return { lat, lng };
}

export function randomPointAround(origin: LatLng, maxKm: number, random: () => number): LatLng {
  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * maxKm;
  return offsetPoint(origin, Math.cos(angle) * distance, Math.sin(angle) * distance);
}

export function formatKm(km: number) {
  return `${km.toFixed(1)} km`;
}

/** Deterministic PRNG so the seeded demo city looks identical on every reset. */
export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
