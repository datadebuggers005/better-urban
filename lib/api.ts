import type {
  ActivityLog,
  AppNotification,
  City,
  DataQualityReport,
  DataSource,
  DuplicateCluster,
  DuplicateMatch,
  FeedbackItem,
  Incident,
  IncidentStatus,
  NewIncidentInput,
  Role,
  Sector,
  User,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8000";

export type AuthPayload = {
  uid: string;
  email: string;
  idToken: string;
  profile: User;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {
      // ignore json parse error
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/uploads/")) {
    return `${API_BASE}${url}`;
  }
  return url;
}

// Auth
export const apiLogin = (email: string, password: string) =>
  request<AuthPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const apiSignup = (input: { name: string; email: string; password: string; cityId: string }) =>
  request<AuthPayload>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const apiDemoLogin = () =>
  request<AuthPayload>("/api/auth/demo", { method: "POST", body: JSON.stringify({}) });

export const apiMe = (token: string) => request<User>("/api/auth/me", {}, token);

// Reference data
export const apiListCities = () => request<City[]>("/api/cities");
export const apiListSectors = (cityId: string) => request<Sector[]>(`/api/cities/${cityId}/sectors`);
export const apiDataSources = () => request<DataSource[]>("/api/data-sources");

// Uploads & Vision
export const apiUploadPhoto = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return request<{ url: string; filename: string; size: number }>("/api/uploads", {
    method: "POST",
    body: fd,
  });
};

export const apiAnalyzePhoto = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return request<{
    gps: { lat: number; lng: number } | null;
    location: { display?: string; city?: string };
    tags: string[];
    suggestedCategory: string;
  }>("/api/vision/analyze-public", {
    method: "POST",
    body: fd,
  });
};

// Incidents
export const apiCheckDuplicate = (input: { lat: number; lng: number; categoryId: string; cityId?: string }) =>
  request<{ hasDuplicates: boolean; matches: DuplicateMatch[] }>("/api/incidents/check-duplicate", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const apiListIncidents = (params?: {
  cityId?: string;
  categoryId?: string;
  status?: string;
  wardNumber?: number;
  search?: string;
  reporterId?: string;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.cityId) qs.set("cityId", params.cityId);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.status) qs.set("status", params.status);
  if (params?.wardNumber != null) qs.set("wardNumber", String(params.wardNumber));
  if (params?.search) qs.set("search", params.search);
  if (params?.reporterId) qs.set("reporterId", params.reporterId);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<Incident[]>(`/api/incidents${suffix}`);
};

export const apiGetIncident = (id: string) => request<Incident>(`/api/incidents/${id}`);

export const apiCreateIncident = (input: NewIncidentInput, token: string) =>
  request<Incident>("/api/incidents", { method: "POST", body: JSON.stringify(input) }, token);

export const apiUpdateIncidentStatus = (
  incidentId: string,
  body: { status: IncidentStatus; note?: string; assignedTo?: string; assignedToName?: string },
  token: string,
) =>
  request<Incident>(`/api/incidents/${incidentId}/status`, { method: "PATCH", body: JSON.stringify(body) }, token);

export const apiCloseIncident = (incidentId: string, token: string) =>
  request<Incident>(`/api/incidents/${incidentId}/close`, { method: "POST" }, token);

export const apiRateIncident = (incidentId: string, rating: number, comment: string, token: string) =>
  request<{ ok: boolean; rating: number }>(
    `/api/incidents/${incidentId}/rate`,
    { method: "POST", body: JSON.stringify({ rating, comment }) },
    token,
  );

export const apiHelpIncident = (incidentId: string, token: string) =>
  request<{ ok: boolean }>(`/api/incidents/${incidentId}/help`, { method: "POST" }, token);

// Notifications & User
export const apiListNotifications = (userId: string, token: string) =>
  request<AppNotification[]>(`/api/users/${userId}/notifications`, {}, token);

export const apiMarkAllNotificationsRead = (userId: string, token: string) =>
  request<{ ok: boolean }>(`/api/users/${userId}/notifications/read-all`, { method: "POST" }, token);

export const apiMarkNotificationRead = (notifId: string, token: string) =>
  request<{ ok: boolean }>(`/api/notifications/${notifId}/read`, { method: "POST" }, token);

export const apiUpdateUser = (userId: string, patch: Partial<User>, token: string) =>
  request<User>(`/api/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch) }, token);

export const apiJoinVolunteer = (token: string) =>
  request<User>("/api/volunteer/join", { method: "POST" }, token);

export const apiLeaderboard = (cityId?: string) =>
  request<User[]>(`/api/leaderboard${cityId ? `?cityId=${cityId}` : ""}`);

export const apiSubmitFeedback = (
  body: { name: string; email: string; message: string; rating?: number },
  token?: string | null,
) => request<{ ok: boolean; id: string }>("/api/feedback", { method: "POST", body: JSON.stringify(body) }, token);

// Admin & Officer
export const apiAdminIncidents = (
  token: string,
  params?: { cityId?: string; categoryId?: string; status?: string; wardNumber?: number; search?: string },
) => {
  const qs = new URLSearchParams();
  if (params?.cityId) qs.set("cityId", params.cityId);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.status) qs.set("status", params.status);
  if (params?.wardNumber != null) qs.set("wardNumber", String(params.wardNumber));
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<Incident[]>(`/api/admin/incidents${suffix}`, {}, token);
};

export const apiAdminActivityLogs = (token: string) =>
  request<ActivityLog[]>("/api/admin/activity-logs", {}, token);

export const apiAdminDataQuality = (token: string) =>
  request<DataQualityReport>("/api/admin/data-quality", {}, token);

export const apiAdminDataSources = (token: string) =>
  request<DataSource[]>("/api/admin/data-sources", {}, token);

export const apiAdminFeedback = (token: string) =>
  request<FeedbackItem[]>("/api/admin/feedback", {}, token);

export const apiAdminDuplicates = (token: string) =>
  request<DuplicateCluster[]>("/api/admin/duplicates", {}, token);

export const apiAdminUsers = (token: string) => request<User[]>("/api/admin/users", {}, token);

export const apiAdminUpdateUserRole = (userId: string, role: Role, token: string) =>
  request<User>(`/api/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token);
