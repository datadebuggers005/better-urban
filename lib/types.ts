export type CategoryId =
  | "road"
  | "fire"
  | "medical"
  | "drainage"
  | "water"
  | "waste"
  | "safety"
  | "other";

export type IncidentStatus =
  | "reported"
  | "dispatched"
  | "acknowledged"
  | "in_progress"
  | "resolved";

export type Severity = "low" | "medium" | "high" | "critical";

export type Role = "citizen" | "volunteer" | "admin";

export type City = {
  id: string;
  name: string;
  short: string;
  center: { lat: number; lng: number };
};

export type Sector = {
  id: string;
  cityId: string;
  name: string;
  lat: number;
  lng: number;
};

export type SubCategory = {
  id: string;
  categoryId: CategoryId;
  name: string;
};

export type Category = {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
  accent: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  cityId: string;
  sectorId: string;
  stars: number;
  helped: number;
  isVolunteer: boolean;
  skills: string[];
  preferredCategories: CategoryId[];
  alertsEnabled: boolean;
  alertRadiusKm: number;
  role: Role;
  createdAt: string;
};

export type IncidentEvent = {
  id: string;
  kind: "reported" | "dispatch" | "status" | "volunteer" | "feedback";
  label: string;
  detail?: string;
  at: string;
};

export type Incident = {
  id: string;
  code: string;
  cityId: string;
  sectorId: string;
  categoryId: CategoryId;
  subCategoryId: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  landmark: string;
  photoUrl: string | null;
  isAnonymous: boolean;
  reporterId: string | null;
  reporterName: string;
  status: IncidentStatus;
  severity: Severity;
  radiusKm: number;
  alertedCount: number;
  notifiedOrgs: string[];
  notifiedNgos: string[];
  events: IncidentEvent[];
  helpedBy: string[];
  createdAt: string;
  resolvedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
};

export type AppNotification = {
  id: string;
  userId: string;
  type: "alert" | "status" | "system" | "volunteer";
  incidentId?: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type NewIncidentInput = {
  categoryId: CategoryId;
  subCategoryId: string;
  title: string;
  note: string;
  landmark: string;
  lat: number;
  lng: number;
  sectorId: string;
  photoUrl: string | null;
  isAnonymous: boolean;
  severity: Severity;
};
