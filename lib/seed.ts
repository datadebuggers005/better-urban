import {
  CATEGORIES,
  CITIES,
  DEMO_NGOS,
  orgsForCity,
  SUB_CATEGORIES,
} from "./catalog";
import { mulberry32, randomPointAround, offsetPoint, haversineKm } from "./geo";
import type {
  AppNotification,
  CategoryId,
  City,
  Incident,
  IncidentEvent,
  IncidentStatus,
  Sector,
  Severity,
  User,
} from "./types";

export const DEMO_EMAIL = "demo@betterurban.app";
export const DEMO_PHONE = "+919876543210";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_USER_ID = "u_demo";

const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Kabir", "Meera", "Arjun", "Sneha", "Vikram", "Isha",
  "Rahul", "Nisha", "Aditya", "Kavya", "Suresh", "Rekha", "Imran", "Fatima", "Dev", "Pooja",
  "Manish", "Divya", "Kunal", "Riya", "Sameer", "Neha", "Tarun", "Aisha", "Nikhil", "Shreya",
  "Yash", "Simran", "Varun", "Anjali", "Harsh", "Tanvi", "Mohit", "Preeti", "Abhishek", "Nandini",
];

const LAST_NAMES = [
  "Mehta", "Nair", "Verma", "Sharma", "Iyer", "Khan", "Patel", "Rao", "Gupta", "Singh",
  "Das", "Joshi", "Reddy", "Bose", "Kapoor", "Malhotra", "Saxena", "Pillai", "Chauhan", "Bansal",
];

const NOTES = [
  "Two-wheelers are swerving around it. Worse after last night's rain.",
  "Been like this for over a week. No barricade, no warning sign.",
  "Strong smell and mosquitoes around the spot. Nearby shops are complaining.",
  "Children walk past this every morning on the way to school.",
  "Water has been pooling here since the weekend and it is not draining.",
  "Streetlight has been out for four nights, the whole stretch is dark.",
  "The dump has doubled in size. Carts keep adding to it every day.",
  "Signal is stuck on red for one direction and drivers are jumping it.",
  "Open pit right next to the footpath. Someone will fall in after dark.",
  "Traffic is backed up for almost a kilometre every evening.",
  "The leak is wasting water all day and the road is starting to cave in.",
  "Loud construction work continues well past midnight.",
  "Footpath tiles are broken and elderly residents are avoiding the stretch.",
  "This has been reported before but nothing has changed on the ground.",
];

const SUB_NOTES: Record<string, string[]> = {
  "road-jam": [
    "Traffic is backed up for almost a kilometre every evening.",
    "Two-wheelers are swerving around the barricade. Worse after last night's rain.",
  ],
  "road-pothole": [
    "Open pit right next to the footpath. Someone will fall in after dark.",
    "Been like this for over a week. No barricade, no warning sign.",
  ],
  "road-accident": ["Two-wheeler skidded here this morning. Needs a warning marker urgently."],
  "road-signal": [
    "Signal is stuck on red for one direction and drivers are jumping it.",
    "Streetlight has been out for four nights, the whole stretch is dark.",
  ],
  "fire-fire": ["Smoke is coming from a dump behind the shops. Getting worse."],
  "fire-flood": ["Knee-deep water after last night's rain. Buses cannot use this lane."],
  "fire-gas": ["Strong gas smell near the meter box. Residents have stepped outside."],
  "fire-collapse": ["A section of the compound wall has come down on the footpath."],
  "medical-injury": ["A rider is down near the junction and needs help."],
  "medical-emergency": ["Elderly resident collapsed near the bus stop. Ambulance called."],
  "medical-animal": ["A stray dog pack is chasing children on the school route."],
  "drain-overflow": ["Drain is overflowing onto the road and the smell is unbearable."],
  "drain-manhole": ["Manhole cover is missing and the pit is full of water."],
  "drain-leak": ["Sewage is leaking into the lane beside the market."],
  "water-leak": ["The leak is wasting water all day and the road is starting to cave in."],
  "water-supply": ["No supply in this lane for three days. Tankers have not come."],
  "water-quality": ["Water is muddy since yesterday. Two houses reported stomach issues."],
  "waste-dump": ["The dump has doubled in size. Carts keep adding to it every day."],
  "waste-collection": ["Collection has been skipped for four days. Bins are overflowing."],
  "waste-toilet": ["Public toilet has no water and the area around it is unusable."],
  "safety-sos": ["Group of men blocking the underpass after dark. Women are avoiding it."],
  "safety-harassment": ["A man has been following women on this stretch for two evenings."],
  "safety-lighting": ["Streetlight has been out for four nights, the whole stretch is dark."],
  "other-noise": ["Loud construction work continues well past midnight."],
  "other-construction": ["Construction debris is blocking half the lane with no permit displayed."],
  "other-civic": ["This has been reported before but nothing has changed on the ground."],
};

function noteFor(subCategoryId: string, random: () => number) {
  const pool = SUB_NOTES[subCategoryId] ?? NOTES;
  return pool[Math.floor(random() * pool.length)];
}

const LANDMARK_SUFFIXES = ["Main Rd", "Chowk", "Market", "Cross", "Bus Stop", "Park Gate"];

const STATUS_PATTERN: IncidentStatus[] = [
  "resolved", "dispatched", "in_progress", "reported", "acknowledged",
  "in_progress", "dispatched", "resolved", "acknowledged", "resolved",
];

const SEVERITY_BY_CATEGORY: Record<CategoryId, Severity[]> = {
  road: ["medium", "high"],
  fire: ["high", "critical"],
  medical: ["high", "critical"],
  drainage: ["medium", "high"],
  water: ["medium", "high"],
  waste: ["low", "medium"],
  safety: ["high", "critical"],
  other: ["low", "medium"],
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export type SeedDB = {
  cities: City[];
  sectors: Sector[];
  users: User[];
  incidents: Incident[];
  notifications: AppNotification[];
};

function buildSectors(random: () => number): Sector[] {
  const sectors: Sector[] = [];
  for (const city of CITIES) {
    for (let i = 1; i <= 20; i += 1) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 1.1 + (i % 5) * 1.05;
      const point = offsetPoint(
        city.center,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      );
      sectors.push({
        id: `${city.id}-s${i}`,
        cityId: city.id,
        name: `Sector ${i}`,
        lat: point.lat,
        lng: point.lng,
      });
    }
  }
  return sectors;
}

function buildUsers(sectors: Sector[], random: () => number): User[] {
  const users: User[] = [];
  const now = Date.now();

  const topVolunteers: Array<{ name: string; sector: number; stars: number; helped: number }> = [
    { name: "Aarav Mehta", sector: 18, stars: 488, helped: 24 },
    { name: "Priya Nair", sector: 9, stars: 415, helped: 19 },
    { name: "Rohan Verma", sector: 14, stars: 360, helped: 16 },
  ];

  topVolunteers.forEach((top, index) => {
    users.push({
      id: `u_top${index + 1}`,
      name: top.name,
      email: `${top.name.split(" ")[0].toLowerCase()}@betterurban.app`,
      phone: `+91980000000${index + 1}`,
      password: DEMO_PASSWORD,
      cityId: "metro",
      sectorId: `metro-s${top.sector}`,
      stars: top.stars,
      helped: top.helped,
      isVolunteer: true,
      skills: ["Traffic Support", "First Aid", "Relief & Rescue"].slice(0, 2 + (index % 2)),
      preferredCategories: ["road", "waste", "safety"],
      alertsEnabled: true,
      alertRadiusKm: 3,
      role: "volunteer",
      createdAt: new Date(now - (120 + index * 30) * DAY).toISOString(),
    });
  });

  users.push({
    id: DEMO_USER_ID,
    name: "Riya Sharma",
    email: DEMO_EMAIL,
    phone: DEMO_PHONE,
    password: DEMO_PASSWORD,
    cityId: "metro",
    sectorId: "metro-s18",
    stars: 340,
    helped: 6,
    isVolunteer: false,
    skills: ["First Aid"],
    preferredCategories: ["road", "waste", "water", "safety"],
    alertsEnabled: true,
    alertRadiusKm: 3,
    role: "citizen",
    createdAt: new Date(now - 64 * DAY).toISOString(),
  });

  let counter = 0;
  for (const city of CITIES) {
    const citySectors = sectors.filter((s) => s.cityId === city.id);
    const count = city.id === "metro" ? 318 : 320;
    for (let i = 0; i < count; i += 1) {
      counter += 1;
      const sector = citySectors[Math.floor(random() * citySectors.length)];
      const first = FIRST_NAMES[counter % FIRST_NAMES.length];
      const last = LAST_NAMES[(counter * 7) % LAST_NAMES.length];
      const stars = Math.floor(random() * 250) + (random() > 0.9 ? 60 : 0);
      users.push({
        id: `u_${counter}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${counter}@demo.citizen`,
        phone: `+9198${String(10000000 + counter * 37).slice(0, 8)}`,
        password: DEMO_PASSWORD,
        cityId: city.id,
        sectorId: sector.id,
        stars,
        helped: Math.floor(stars / 24),
        isVolunteer: random() > 0.72,
        skills: ["Traffic Support", "First Aid", "Relief & Rescue"].filter(() => random() > 0.55),
        preferredCategories: CATEGORIES.filter(() => random() > 0.55).map((c) => c.id),
        alertsEnabled: random() > 0.12,
        alertRadiusKm: 3,
        role: "citizen",
        createdAt: new Date(now - Math.floor(random() * 200 + 10) * DAY).toISOString(),
      });
    }
  }

  return users;
}

function eventsFor(
  status: IncidentStatus,
  createdAt: string,
  cityName: string,
  alerted: number,
  resolvedAt: string | null,
): IncidentEvent[] {
  const start = new Date(createdAt).getTime();
  const events: IncidentEvent[] = [
    {
      id: "ev-0",
      kind: "reported",
      label: "Report received",
      detail: "Citizen report logged on the 3 km dispatch network.",
      at: new Date(start).toISOString(),
    },
  ];

  if (status === "reported") return events;

  events.push({
    id: "ev-1",
    kind: "dispatch",
    label: "Alert dispatched",
    detail: `${cityName} control room, 2 partner NGOs and ${alerted} citizens inside 3 km were alerted.`,
    at: new Date(start + 4 * 60000).toISOString(),
  });

  if (status === "dispatched") return events;

  events.push({
    id: "ev-2",
    kind: "status",
    label: "Authority acknowledged",
    detail: `${cityName} Municipal Control Room accepted the ticket.`,
    at: new Date(start + 3 * HOUR).toISOString(),
  });

  if (status === "acknowledged") return events;

  events.push({
    id: "ev-3",
    kind: "status",
    label: "Field team assigned",
    detail: "A crew has been assigned and is on the way.",
    at: new Date(start + 9 * HOUR).toISOString(),
  });

  if (status === "in_progress") return events;

  const resolvedTime = resolvedAt ?? new Date(start + 2 * DAY + 5 * HOUR).toISOString();
  events.push({
    id: "ev-4",
    kind: "status",
    label: "Marked resolved",
    detail: "Field team marked the issue resolved. Awaiting citizen confirmation.",
    at: resolvedTime,
  });

  return events;
}

function buildIncidents(
  users: User[],
  sectors: Sector[],
  random: () => number,
): Incident[] {
  const incidents: Incident[] = [];
  const now = Date.now();
  let codeSeq = 2049;

  CITIES.forEach((city) => {
    const cityUsers = users.filter((u) => u.cityId === city.id);
    const citySectors = sectors.filter((s) => s.cityId === city.id);
    const perCity = 14;

    for (let i = 0; i < perCity; i += 1) {
      const category = CATEGORIES[(i + city.id.length) % CATEGORIES.length];
      const subs = SUB_CATEGORIES.filter((s) => s.categoryId === category.id);
      const sub = subs[Math.floor(random() * subs.length)];
      // Keep a cluster around the demo citizen's sector so the 3 km feed has life on first open.
      const sector =
        city.id === "metro" && i < 6
          ? citySectors.find((s) => s.name === "Sector 18") ?? citySectors[0]
          : citySectors[Math.floor(random() * citySectors.length)];
      const point = randomPointAround(
        { lat: sector.lat, lng: sector.lng },
        city.id === "metro" && i < 6 ? 1.4 : 0.9,
        random,
      );
      const status = STATUS_PATTERN[i % STATUS_PATTERN.length];
      const createdAt = new Date(now - (1 + ((i * 3 + city.id.length) % 17)) * DAY - random() * 10 * HOUR).toISOString();
      const reporter = cityUsers[Math.floor(random() * cityUsers.length)];
      const isAnonymous = random() > 0.9;
      const severityOptions = SEVERITY_BY_CATEGORY[category.id];
      const severity = severityOptions[Math.floor(random() * severityOptions.length)];

      // Real 3 km audience, computed against seeded citizen coordinates.
      const alertedCount = cityUsers.filter((u) => {
        const userSector = sectors.find((s) => s.id === u.sectorId);
        if (!userSector) return false;
        return haversineKm(userSector, point) <= 3;
      }).length;

      const resolvedAt =
        status === "resolved"
          ? new Date(new Date(createdAt).getTime() + (2 + random() * 2) * DAY).toISOString()
          : null;

      const helpers = cityUsers
        .filter((candidate) => candidate.id !== DEMO_USER_ID && random() > 0.72)
        .slice(0, 3)
        .map((candidate) => candidate.id);

      incidents.push({
        id: `inc_${city.id}_${i}`,
        code: `BU-${codeSeq++}`,
        cityId: city.id,
        sectorId: sector.id,
        categoryId: category.id,
        subCategoryId: sub.id,
        title: sub.name,
        note: noteFor(sub.id, random),
        lat: point.lat,
        lng: point.lng,
        landmark: `${sector.name} ${LANDMARK_SUFFIXES[Math.floor(random() * LANDMARK_SUFFIXES.length)]}`,
        photoUrl: null,
        isAnonymous,
        reporterId: isAnonymous ? null : reporter.id,
        reporterName: isAnonymous ? "Anonymous citizen" : reporter.name,
        status,
        severity,
        radiusKm: 3,
        alertedCount: Math.max(alertedCount, 1),
        notifiedOrgs: orgsForCity(city.name),
        notifiedNgos: DEMO_NGOS,
        events: eventsFor(status, createdAt, city.name, Math.max(alertedCount, 1), resolvedAt),
        helpedBy: helpers,
        createdAt,
        resolvedAt,
        rating: status === "resolved" ? (random() > 0.25 ? 5 : 4) : null,
        ratingComment: status === "resolved" ? "Crew arrived the same evening. Spot is clean now." : null,
      });
    }
  });

  // Guarantee "My Reports" has realistic content for the demo account.
  const demoReports = incidents.filter((i) => i.cityId === "metro").slice(0, 3);
  demoReports.forEach((incident, index) => {
    incident.reporterId = DEMO_USER_ID;
    incident.reporterName = "Riya Sharma";
    incident.isAnonymous = false;
    if (index === 0) {
      incident.status = "in_progress";
      incident.resolvedAt = null;
      incident.rating = null;
      incident.ratingComment = null;
      incident.events = eventsFor("in_progress", incident.createdAt, "Metro City", incident.alertedCount, null);
    }
    if (index === 1) {
      incident.status = "resolved";
      incident.resolvedAt = new Date(now - 3 * DAY).toISOString();
      incident.events = eventsFor("resolved", incident.createdAt, "Metro City", incident.alertedCount, incident.resolvedAt);
      incident.rating = 5;
      incident.ratingComment = "Fixed within two days. Thank you.";
    }
  });

  // Newest metro ticket gets the marquee code from the design.
  const metroIncidents = incidents
    .filter((i) => i.cityId === "metro")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (metroIncidents[0]) metroIncidents[0].code = "BU-2048";

  return incidents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function buildNotifications(incidents: Incident[]): AppNotification[] {
  const metro = incidents.filter((i) => i.cityId === "metro").slice(0, 4);
  const now = Date.now();
  const notes: AppNotification[] = [
    {
      id: "n_1",
      userId: DEMO_USER_ID,
      type: "status",
      incidentId: metro[0]?.id,
      title: `${metro[0]?.code ?? "BU-2048"} · Field team assigned`,
      body: "Your report was acknowledged by the Metro City control room. A crew is on the way.",
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      read: false,
    },
    {
      id: "n_2",
      userId: DEMO_USER_ID,
      type: "alert",
      incidentId: metro[1]?.id,
      title: "Roadblock reported 1.2 km away",
      body: "A citizen in Sector 18 needs verified eyes on a traffic jam near the market.",
      createdAt: new Date(now - 5 * HOUR).toISOString(),
      read: false,
    },
    {
      id: "n_3",
      userId: DEMO_USER_ID,
      type: "volunteer",
      incidentId: metro[2]?.id,
      title: "You earned 25 stars",
      body: "Thanks for confirming a nearby issue. Your ward rank moved up.",
      createdAt: new Date(now - 26 * HOUR).toISOString(),
      read: true,
    },
    {
      id: "n_4",
      userId: DEMO_USER_ID,
      type: "status",
      incidentId: metro[3]?.id,
      title: `${metro[3]?.code ?? "BU-2063"} · Resolved`,
      body: "The issue you reported has been marked resolved. Rate the fix to close the loop.",
      createdAt: new Date(now - 2 * 24 * HOUR).toISOString(),
      read: true,
    },
  ];
  return notes;
}

export function buildSeed(): SeedDB {
  const random = mulberry32(20261123);
  const sectors = buildSectors(random);
  const users = buildUsers(sectors, random);
  const incidents = buildIncidents(users, sectors, random);
  const notifications = buildNotifications(incidents);
  return { cities: CITIES, sectors, users, incidents, notifications };
}
