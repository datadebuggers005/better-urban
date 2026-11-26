import type { Category, CategoryId, City, IncidentStatus, MapColor, Severity, SubCategory } from "./types";
import { OCOR_PALETTE } from "./theme";

export const CITIES: City[] = [
  { id: "metro", name: "Metro City", short: "Metro", center: { lat: 28.6448, lng: 77.2167 } },
  { id: "riverport", name: "Riverport", short: "River", center: { lat: 19.076, lng: 72.8777 } },
  { id: "northvale", name: "Northvale", short: "North", center: { lat: 12.9716, lng: 77.5946 } },
  { id: "oldtown", name: "Old Town", short: "Old", center: { lat: 18.5204, lng: 73.8567 } },
  { id: "greenfield", name: "Greenfield", short: "Green", center: { lat: 26.9124, lng: 75.7873 } },
];

export const CATEGORIES: Category[] = [
  {
    id: "road",
    name: "Road",
    short: "Road",
    blurb: "Potholes, damaged road, traffic",
    accent: OCOR_PALETTE.core.primary,
  },
  {
    id: "water",
    name: "Water",
    short: "Water",
    blurb: "Pipe leak, no supply, quality",
    accent: OCOR_PALETTE.primaryDark.light,
  },
  {
    id: "garbage",
    name: "Garbage",
    short: "Garbage",
    blurb: "Garbage dump, missed pickup",
    accent: OCOR_PALETTE.success.base,
  },
  {
    id: "drainage",
    name: "Drainage",
    short: "Drainage",
    blurb: "Blocked drain, overflow, manhole",
    accent: OCOR_PALETTE.core.secondaryAccent,
  },
  {
    id: "streetlight",
    name: "Streetlight",
    short: "Streetlight",
    blurb: "Dark street, faulty pole",
    accent: OCOR_PALETTE.error.base,
  },
];

const CATEGORY_ALIASES: Record<string, CategoryId> = {
  waste: "garbage",
  fire: "road",
  medical: "road",
  safety: "streetlight",
  other: "road",
};

export function normalizeCategoryId(id: string): CategoryId {
  const clean = (id || "road").trim().toLowerCase();
  if (CATEGORIES.some((c) => c.id === clean)) {
    return clean as CategoryId;
  }
  return CATEGORY_ALIASES[clean] ?? "road";
}

export const SUB_CATEGORIES: SubCategory[] = [
  { id: "road-pothole", categoryId: "road", name: "Potholes / Damaged Road" },
  { id: "road-jam", categoryId: "road", name: "Roadblock / Traffic Jam" },
  { id: "road-accident", categoryId: "road", name: "Road Hazard / Damaged Divider" },

  { id: "water-leak", categoryId: "water", name: "Pipe Leak / Burst" },
  { id: "water-supply", categoryId: "water", name: "No Water Supply" },
  { id: "water-quality", categoryId: "water", name: "Contaminated Water" },

  { id: "garbage-dump", categoryId: "garbage", name: "Garbage Dump" },
  { id: "garbage-collection", categoryId: "garbage", name: "Missed Collection" },
  { id: "garbage-bin", categoryId: "garbage", name: "Overflowing Public Bin" },

  { id: "drainage-overflow", categoryId: "drainage", name: "Overflow / Blocked Drain" },
  { id: "drainage-manhole", categoryId: "drainage", name: "Open Manhole" },
  { id: "drainage-leak", categoryId: "drainage", name: "Sewage Leak" },

  { id: "streetlight-outage", categoryId: "streetlight", name: "Streetlight Not Working" },
  { id: "streetlight-flicker", categoryId: "streetlight", name: "Flickering / Exposed Pole" },
  { id: "streetlight-dark", categoryId: "streetlight", name: "Dark / Unsafe Stretch" },
];

export const VOLUNTEER_SKILLS = ["Traffic Support", "First Aid", "Relief & Rescue"];

export const STATUS_META: Record<
  IncidentStatus,
  {
    label: string;
    short: string;
    tone: "neutral" | "gold" | "green" | "danger";
    mapColor: MapColor;
    step: number;
  }
> = {
  submitted: { label: "Submitted", short: "Submitted", tone: "danger", mapColor: "RED", step: 0 },
  under_review: { label: "Under Review", short: "Under Review", tone: "danger", mapColor: "RED", step: 1 },
  verified: { label: "Verified", short: "Verified", tone: "danger", mapColor: "RED", step: 2 },
  assigned: { label: "Assigned", short: "Assigned", tone: "gold", mapColor: "YELLOW", step: 3 },
  in_progress: { label: "In Progress", short: "In Progress", tone: "gold", mapColor: "YELLOW", step: 4 },
  resolved: { label: "Resolved", short: "Resolved", tone: "green", mapColor: "GREEN", step: 5 },
  closed: { label: "Closed", short: "Closed", tone: "green", mapColor: "GREEN", step: 6 },
};

export const STATUS_FLOW: IncidentStatus[] = [
  "submitted",
  "under_review",
  "verified",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
];

const LEGACY_STATUS_MAP: Record<string, IncidentStatus> = {
  reported: "submitted",
  dispatched: "under_review",
  acknowledged: "verified",
};

export function normalizeStatus(status: string): IncidentStatus {
  const s = (status || "submitted").trim().toLowerCase();
  if (s in STATUS_META) return s as IncidentStatus;
  return LEGACY_STATUS_MAP[s] ?? "submitted";
}

export function mapColorForStatus(status: IncidentStatus | string): MapColor {
  return STATUS_META[normalizeStatus(status)].mapColor;
}

export const SEVERITY_META: Record<Severity, { label: string; tone: "neutral" | "gold" | "green" | "danger" }> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "gold" },
  high: { label: "High", tone: "danger" },
  critical: { label: "Critical", tone: "danger" },
};

export function categoryById(id: CategoryId | string) {
  const norm = normalizeCategoryId(id);
  return CATEGORIES.find((c) => c.id === norm) ?? CATEGORIES[0];
}

export function subCategoryById(id: string) {
  return SUB_CATEGORIES.find((s) => s.id === id);
}

export function subCategoriesFor(id: CategoryId | string) {
  const norm = normalizeCategoryId(id);
  return SUB_CATEGORIES.filter((s) => s.categoryId === norm);
}

export function cityById(id: string) {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

export function orgsForCity(cityName: string) {
  return [`${cityName} Municipal Control Room`, `${cityName} Public Works Dept`];
}

export const DEMO_NGOS = ["Civic Response Collective", "Green Hands Foundation"];
export const EMERGENCY_CATEGORIES: CategoryId[] = ["road", "drainage"];
