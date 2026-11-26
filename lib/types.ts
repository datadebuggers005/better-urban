export type CategoryId = "road" | "water" | "garbage" | "drainage" | "streetlight";

export type IncidentStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export type MapColor = "RED" | "YELLOW" | "GREEN";

export type Severity = "low" | "medium" | "high" | "critical";

export type Role = "citizen" | "officer" | "admin";

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
  wardNumber: number;
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
  password?: string;
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
  kind: "submitted" | "reported" | "dispatch" | "status" | "volunteer" | "feedback";
  label: string;
  detail?: string;
  at: string;
};

export type Incident = {
  id: string;
  code: string;
  cityId: string;
  sectorId: string;
  wardNumber: number;
  categoryId: CategoryId;
  subCategoryId: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  landmark: string;
  photoUrl: string | null;
  tags: string[];
  isAnonymous: boolean;
  reporterId: string | null;
  reporterName: string;
  status: IncidentStatus;
  mapColor: MapColor;
  severity: Severity;
  radiusKm: number;
  alertedCount: number;
  notifiedOrgs: string[];
  notifiedNgos: string[];
  events: IncidentEvent[];
  helpedBy: string[];
  assignedTo?: string | null;
  assignedToName?: string | null;
  duplicateOf?: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt?: string | null;
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
  cityId?: string;
  sectorId: string;
  wardNumber?: number;
  photoUrl: string | null;
  tags?: string[];
  isAnonymous: boolean;
  severity: Severity;
  duplicateOf?: string | null;
};

export type DuplicateMatch = {
  id: string;
  code: string;
  title: string;
  status: IncidentStatus;
  wardNumber: number;
  distanceMeters: number;
  createdAt: string;
};

export type DuplicateCluster = {
  primary: {
    id: string;
    code: string;
    title: string;
    categoryId: CategoryId;
    wardNumber: number;
    status: IncidentStatus;
  };
  duplicates: DuplicateMatch[];
};

export type ActivityLog = {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type DataQualityReport = {
  totalIncidents: number;
  healthyIncidents: number;
  flaggedIncidents: number;
  qualityScore: number;
  summary: {
    invalidCoordinates: number;
    missingWardNumber: number;
    missingPhoto: number;
    orphanReporter: number;
    invalidStatus: number;
  };
  flaggedRecords: Array<{
    incidentId: string;
    code: string;
    title: string;
    issues: string[];
  }>;
};

export type DataSource = {
  id: string;
  name: string;
  source: string;
  category: string;
  refreshCycle: string;
  lastUpdated: string;
  status: string;
};

export type FeedbackItem = {
  id: string;
  name?: string;
  email?: string;
  message: string;
  rating?: number | null;
  userId?: string | null;
  createdAt: string;
};
