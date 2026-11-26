"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppNotification,
  CategoryId,
  City,
  Incident,
  IncidentStatus,
  NewIncidentInput,
  Sector,
  User,
} from "./types";
import { CITIES, DEMO_NGOS, STATUS_META, cityById, mapColorForStatus, orgsForCity } from "./catalog";
import { uid } from "./utils";
import { buildSeed } from "./seed";
import {
  apiCloseIncident,
  apiCreateIncident,
  apiDemoLogin,
  apiHelpIncident,
  apiLeaderboard,
  apiListCities,
  apiListIncidents,
  apiListNotifications,
  apiListSectors,
  apiLogin,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiMe,
  apiRateIncident,
  apiSignup,
  apiUpdateIncidentStatus,
  apiUpdateUser,
} from "./api";

type Result = { ok: boolean; error?: string };

type AppState = {
  cities: City[];
  sectors: Sector[];
  users: User[];
  incidents: Incident[];
  notifications: AppNotification[];
  token: string | null;
  sessionUserId: string | null;
  currentUser: User | null;
  activeCityId: string;
  onboarded: boolean;
  hydrated: boolean;

  bootstrap: () => Promise<void>;
  refreshIncidents: (cityId?: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setHydrated: () => void;

  login: (identifier: string, password: string) => Promise<Result>;
  signup: (input: { name: string; email: string; password: string; cityId: string }) => Promise<Result>;
  demoLogin: () => Promise<Result>;
  logout: () => void;

  setCity: (cityId: string) => Promise<void>;
  finishOnboarding: () => void;

  createIncident: (input: NewIncidentInput) => Promise<Incident | null>;
  updateStatus: (incidentId: string, status: IncidentStatus, note?: string) => Promise<void>;
  closeIncident: (incidentId: string) => Promise<void>;
  rateIncident: (incidentId: string, rating: number, comment: string) => Promise<void>;

  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  joinVolunteer: (skills: string[]) => Promise<void>;
  leaveVolunteer: () => Promise<void>;
  acceptAlert: (incidentId: string) => Promise<void>;
  toggleAlerts: () => Promise<void>;
  setAlertRadius: (km: number) => Promise<void>;
  togglePreferredCategory: (categoryId: CategoryId) => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "cityId" | "sectorId">>) => Promise<void>;
  resetDemo: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      cities: CITIES,
      sectors: [],
      users: [],
      incidents: [],
      notifications: [],
      token: null,
      sessionUserId: null,
      currentUser: null,
      activeCityId: "metro",
      onboarded: false,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      bootstrap: async () => {
        const seed = buildSeed();
        if (get().sectors.length === 0) {
          set({
            cities: seed.cities,
            sectors: seed.sectors,
            users: seed.users,
            incidents: seed.incidents,
            notifications: seed.notifications,
          });
        }
        try {
          const [cities, sectors, incidents, leaders] = await Promise.all([
            apiListCities(),
            apiListSectors(get().activeCityId || "metro"),
            apiListIncidents({ limit: 200 }),
            apiLeaderboard(),
          ]);
          set((s) => ({
            cities: cities.length ? cities : s.cities,
            sectors: sectors.length ? sectors : s.sectors,
            incidents,
            users: leaders.length ? leaders : s.users,
          }));
          const token = get().token;
          if (token) {
            try {
              const me = await apiMe(token);
              const notifs = await apiListNotifications(me.id, token);
              set({ currentUser: me, sessionUserId: me.id, notifications: notifs });
            } catch {
              set({ token: null, currentUser: null, sessionUserId: null });
            }
          }
        } catch {
          // Backend unreachable; keep local seed data
        }
      },

      refreshIncidents: async (cityId?: string) => {
        try {
          const incidents = await apiListIncidents({ cityId, limit: 200 });
          set({ incidents });
        } catch {
          // ignore
        }
      },

      refreshNotifications: async () => {
        const { token, currentUser } = get();
        if (!token || !currentUser) return;
        try {
          const notifications = await apiListNotifications(currentUser.id, token);
          set({ notifications });
        } catch {
          // ignore
        }
      },

      login: async (identifier, password) => {
        try {
          const auth = await apiLogin(identifier.trim(), password);
          const [sectors, notifications] = await Promise.all([
            apiListSectors(auth.profile.cityId),
            apiListNotifications(auth.profile.id, auth.idToken),
          ]);
          set({
            token: auth.idToken,
            sessionUserId: auth.profile.id,
            currentUser: auth.profile,
            activeCityId: auth.profile.cityId,
            sectors: sectors.length ? sectors : get().sectors,
            notifications,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Invalid credentials" };
        }
      },

      signup: async ({ name, email, password, cityId }) => {
        try {
          const auth = await apiSignup({ name, email, password, cityId });
          const [sectors, notifications] = await Promise.all([
            apiListSectors(auth.profile.cityId),
            apiListNotifications(auth.profile.id, auth.idToken),
          ]);
          set({
            token: auth.idToken,
            sessionUserId: auth.profile.id,
            currentUser: auth.profile,
            activeCityId: auth.profile.cityId,
            sectors: sectors.length ? sectors : get().sectors,
            notifications,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Could not sign up" };
        }
      },

      demoLogin: async () => {
        try {
          const auth = await apiDemoLogin();
          const [sectors, notifications] = await Promise.all([
            apiListSectors(auth.profile.cityId),
            apiListNotifications(auth.profile.id, auth.idToken),
          ]);
          set({
            token: auth.idToken,
            sessionUserId: auth.profile.id,
            currentUser: auth.profile,
            activeCityId: auth.profile.cityId,
            sectors: sectors.length ? sectors : get().sectors,
            notifications,
          });
          return { ok: true };
        } catch {
          // offline fallback
          const seed = buildSeed();
          set({
            sessionUserId: seed.users[0].id,
            currentUser: seed.users[0],
            activeCityId: seed.users[0].cityId,
          });
          return { ok: true };
        }
      },

      logout: () => set({ token: null, sessionUserId: null, currentUser: null }),

      setCity: async (cityId) => {
        set({ activeCityId: cityId });
        try {
          const sectors = await apiListSectors(cityId);
          set({ sectors });
          const { token, currentUser } = get();
          if (token && currentUser) {
            const updated = await apiUpdateUser(currentUser.id, { cityId }, token);
            set({ currentUser: updated });
          }
        } catch {
          // ignore
        }
      },

      finishOnboarding: () => set({ onboarded: true }),

      createIncident: async (input) => {
        const { token, currentUser, activeCityId } = get();
        if (token) {
          try {
            const inc = await apiCreateIncident({ ...input, cityId: input.cityId ?? activeCityId }, token);
            set((s) => ({
              incidents: [inc, ...s.incidents],
              currentUser: s.currentUser ? { ...s.currentUser, stars: s.currentUser.stars + 10 } : null,
            }));
            await get().refreshNotifications();
            return inc;
          } catch {
            // fallback below if backend offline
          }
        }
        const city = cityById(input.cityId ?? activeCityId);
        const now = new Date().toISOString();
        const inc: Incident = {
          id: uid("inc"),
          code: `OC-${Math.floor(2000 + Math.random() * 6999)}`,
          cityId: city.id,
          sectorId: input.sectorId,
          wardNumber: input.wardNumber ?? 1,
          categoryId: input.categoryId,
          subCategoryId: input.subCategoryId,
          title: input.title,
          note: input.note,
          lat: input.lat,
          lng: input.lng,
          landmark: input.landmark,
          photoUrl: input.photoUrl,
          tags: input.tags ?? [],
          isAnonymous: input.isAnonymous,
          reporterId: input.isAnonymous ? null : (currentUser?.id ?? null),
          reporterName: input.isAnonymous ? "Anonymous citizen" : (currentUser?.name ?? "Citizen"),
          status: "submitted",
          mapColor: "RED",
          severity: input.severity,
          radiusKm: 3,
          alertedCount: 10,
          notifiedOrgs: orgsForCity(city.name),
          notifiedNgos: DEMO_NGOS,
          events: [{ id: uid("ev"), kind: "submitted", label: "Submitted", detail: "Logged locally.", at: now }],
          helpedBy: [],
          createdAt: now,
          resolvedAt: null,
          rating: null,
          ratingComment: null,
        };
        set((s) => ({ incidents: [inc, ...s.incidents] }));
        return inc;
      },

      updateStatus: async (incidentId, status, note) => {
        const { token } = get();
        if (token) {
          const updated = await apiUpdateIncidentStatus(incidentId, { status, note }, token);
          set((s) => ({
            incidents: s.incidents.map((i) => (i.id === incidentId ? updated : i)),
          }));
          return;
        }
        set((s) => ({
          incidents: s.incidents.map((i) =>
            i.id === incidentId
              ? { ...i, status, mapColor: mapColorForStatus(status) }
              : i,
          ),
        }));
      },

      closeIncident: async (incidentId) => {
        const { token } = get();
        if (token) {
          const updated = await apiCloseIncident(incidentId, token);
          set((s) => ({
            incidents: s.incidents.map((i) => (i.id === incidentId ? updated : i)),
          }));
        }
      },

      rateIncident: async (incidentId, rating, comment) => {
        const { token } = get();
        if (token) {
          await apiRateIncident(incidentId, rating, comment, token);
        }
        set((s) => ({
          incidents: s.incidents.map((i) =>
            i.id === incidentId ? { ...i, rating, ratingComment: comment } : i,
          ),
        }));
      },

      markAllNotificationsRead: async () => {
        const { token, currentUser } = get();
        if (token && currentUser) {
          await apiMarkAllNotificationsRead(currentUser.id, token);
        }
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },

      markNotificationRead: async (id) => {
        const { token } = get();
        if (token) {
          await apiMarkNotificationRead(id, token);
        }
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      joinVolunteer: async (skills) => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, { isVolunteer: true, skills }, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, isVolunteer: true, skills } });
      },

      leaveVolunteer: async () => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, { isVolunteer: false }, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, isVolunteer: false } });
      },

      acceptAlert: async (incidentId) => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        if (token) {
          await apiHelpIncident(incidentId, token);
        }
        set((s) => ({
          incidents: s.incidents.map((i) =>
            i.id === incidentId && !i.helpedBy.includes(currentUser.id)
              ? { ...i, helpedBy: [...i.helpedBy, currentUser.id] }
              : i,
          ),
        }));
      },

      toggleAlerts: async () => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        const next = !currentUser.alertsEnabled;
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, { alertsEnabled: next }, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, alertsEnabled: next } });
      },

      setAlertRadius: async (km) => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, { alertRadiusKm: km }, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, alertRadiusKm: km } });
      },

      togglePreferredCategory: async (categoryId) => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        const has = currentUser.preferredCategories.includes(categoryId);
        const next = has
          ? currentUser.preferredCategories.filter((c) => c !== categoryId)
          : [...currentUser.preferredCategories, categoryId];
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, { preferredCategories: next }, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, preferredCategories: next } });
      },

      updateProfile: async (patch) => {
        const { token, currentUser } = get();
        if (!currentUser) return;
        if (token) {
          const updated = await apiUpdateUser(currentUser.id, patch, token);
          set({ currentUser: updated });
          return;
        }
        set({ currentUser: { ...currentUser, ...patch } });
      },

      resetDemo: () => {
        const seed = buildSeed();
        set({
          cities: seed.cities,
          sectors: seed.sectors,
          users: seed.users,
          incidents: seed.incidents,
          notifications: seed.notifications,
          token: null,
          sessionUserId: null,
          currentUser: null,
          activeCityId: "metro",
        });
      },
    }),
    {
      name: "ocor-civic-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        sessionUserId: state.sessionUserId,
        currentUser: state.currentUser,
        activeCityId: state.activeCityId,
        onboarded: state.onboarded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useCurrentUser(): User | null {
  return useApp((s) => s.currentUser);
}

export function useSessionUser(): User | null {
  return useApp((s) => s.currentUser);
}

export function useUnreadCount(): number {
  return useApp((s) => {
    const uid = s.currentUser?.id;
    if (!uid) return 0;
    return s.notifications.filter((n) => n.userId === uid && !n.read).length;
  });
}

export const STATUS_LABELS = STATUS_META;
