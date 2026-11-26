import type { AppNotification, Incident, Sector, User } from "./types";
import { CITIES, DEMO_NGOS, orgsForCity } from "./catalog";

export const DEMO_USER_ID = "u_demo";
export const DEMO_EMAIL = "demo@ocor.city";
export const DEMO_PASSWORD = "demo1234";

function makeSectors(): Sector[] {
  const sectors: Sector[] = [];
  for (const city of CITIES) {
    const lat0 = city.center.lat;
    const lng0 = city.center.lng;
    for (let i = 1; i <= 20; i++) {
      const angle = (i / 20) * 2 * Math.PI;
      const radius = 0.02 + (i % 5) * 0.008;
      sectors.push({
        id: `${city.id}-s${i}`,
        cityId: city.id,
        name: `Ward ${i} · Sector ${i}`,
        wardNumber: i,
        lat: Number((lat0 + radius * Math.cos(angle)).toFixed(6)),
        lng: Number((lng0 + radius * Math.sin(angle)).toFixed(6)),
      });
    }
  }
  return sectors;
}

export function buildSeed(): {
  cities: typeof CITIES;
  sectors: Sector[];
  users: User[];
  incidents: Incident[];
  notifications: AppNotification[];
} {
  const sectors = makeSectors();
  const now = new Date().toISOString();
  const demoUser: User = {
    id: DEMO_USER_ID,
    name: "Riya Sharma",
    email: DEMO_EMAIL,
    phone: "",
    cityId: "metro",
    sectorId: "metro-s18",
    stars: 340,
    helped: 6,
    isVolunteer: true,
    skills: ["Traffic Support", "First Aid"],
    preferredCategories: ["road", "garbage"],
    alertsEnabled: true,
    alertRadiusKm: 3,
    role: "citizen",
    createdAt: now,
  };

  const sampleSector = sectors.find((s) => s.id === "metro-s18") ?? sectors[0];
  const incidents: Incident[] = [
    {
      id: "inc_seed_0",
      code: "OC-2100",
      cityId: "metro",
      sectorId: sampleSector.id,
      wardNumber: 18,
      categoryId: "road",
      subCategoryId: "road-pothole",
      title: "Deep pothole near Ward 18 crossing",
      note: "Seeded civic issue.",
      lat: sampleSector.lat,
      lng: sampleSector.lng,
      landmark: "Ward 18 Main Road",
      photoUrl: null,
      tags: ["pothole", "damaged road"],
      isAnonymous: false,
      reporterId: DEMO_USER_ID,
      reporterName: "Riya Sharma",
      status: "submitted",
      mapColor: "RED",
      severity: "high",
      radiusKm: 3,
      alertedCount: 12,
      notifiedOrgs: orgsForCity("Metro City"),
      notifiedNgos: DEMO_NGOS,
      events: [{ id: "ev_0", kind: "submitted", label: "Submitted", detail: "Logged in Ward 18.", at: now }],
      helpedBy: [],
      createdAt: now,
      resolvedAt: null,
      rating: null,
      ratingComment: null,
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "n_seed_1",
      userId: DEMO_USER_ID,
      type: "status",
      incidentId: "inc_seed_0",
      title: "OC-2100 · Submitted",
      body: "Your report in Ward 18 has been logged with OCOR.",
      createdAt: now,
      read: false,
    },
  ];

  return {
    cities: CITIES,
    sectors,
    users: [demoUser],
    incidents,
    notifications,
  };
}
