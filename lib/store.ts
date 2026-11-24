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
import { DEMO_NGOS, STATUS_META, cityById, orgsForCity } from "./catalog";
import { haversineKm } from "./geo";
import { uid } from "./utils";
import { DEMO_PASSWORD, DEMO_USER_ID, buildSeed } from "./seed";

type Result = { ok: boolean; error?: string };

type AppState = {
  cities: City[];
  sectors: Sector[];
  users: User[];
  incidents: Incident[];
  notifications: AppNotification[];
  sessionUserId: string | null;
  activeCityId: string;
  onboarded: boolean;
  hydrated: boolean;

  bootstrap: () => void;
  setHydrated: () => void;

  login: (identifier: string, password: string) => Result;
  signup: (input: { name: string; email: string; password: string; cityId: string }) => Result;
  demoLogin: () => void;
  logout: () => void;

  setCity: (cityId: string) => void;
  finishOnboarding: () => void;

  createIncident: (input: NewIncidentInput) => Incident | null;
  updateStatus: (incidentId: string, status: IncidentStatus) => void;
  rateIncident: (incidentId: string, rating: number, comment: string) => void;

  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;

  joinVolunteer: (skills: string[]) => void;
  leaveVolunteer: () => void;
  acceptAlert: (incidentId: string) => void;
  toggleAlerts: () => void;
  setAlertRadius: (km: number) => void;
  togglePreferredCategory: (categoryId: CategoryId) => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "cityId" | "sectorId">>) => void;
  resetDemo: () => void;
};

function sectorForCity(sectors: Sector[], cityId: string, preferred = 9) {
  return sectors.find((s) => s.cityId === cityId && s.name === `Sector ${preferred}`)
    ?? sectors.find((s) => s.cityId === cityId)
    ?? sectors[0];
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      cities: [],
      sectors: [],
      users: [],
      incidents: [],
      notifications: [],
      sessionUserId: null,
      activeCityId: "metro",
      onboarded: false,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      bootstrap: () => {
        const state = get();
        if (state.sectors.length === 0 || state.users.length === 0) {
          const seed = buildSeed();
          set({
            cities: seed.cities,
            sectors: seed.sectors,
            users: seed.users,
            incidents: seed.incidents,
            notifications: seed.notifications,
          });
          return;
        }
        if (state.sessionUserId && !state.users.some((u) => u.id === state.sessionUserId)) {
          set({ sessionUserId: null });
        }
      },

      login: (identifier, password) => {
        const clean = identifier.trim().toLowerCase().replace(/\s+/g, "");
        const user = get().users.find(
          (u) =>
            (u.email.toLowerCase() === clean ||
              u.phone.replace(/\s+/g, "") === clean ||
              u.phone.replace(/\s+/g, "").replace("+91", "") === clean.replace("+91", "")) &&
            u.password === password,
        );
        if (!user) return { ok: false, error: "No account matches those details. Try the demo login." };
        set({ sessionUserId: user.id, activeCityId: user.cityId });
        return { ok: true };
      },

      signup: ({ name, email, password, cityId }) => {
        const clean = email.trim().toLowerCase();
        if (!name.trim()) return { ok: false, error: "Add your name to continue." };
        if (!clean.includes("@")) return { ok: false, error: "Enter a valid email address." };
        if (password.length < 6) return { ok: false, error: "Use at least 6 characters for your password." };
        if (get().users.some((u) => u.email.toLowerCase() === clean)) {
          return { ok: false, error: "An account with this email already exists. Sign in instead." };
        }
        const sector = sectorForCity(get().sectors, cityId);
        const user: User = {
          id: `u_${uid("new")}`,
          name: name.trim(),
          email: clean,
          phone: "",
          password,
          cityId,
          sectorId: sector.id,
          stars: 10,
          helped: 0,
          isVolunteer: false,
          skills: [],
          preferredCategories: ["road", "waste"],
          alertsEnabled: true,
          alertRadiusKm: 3,
          role: "citizen",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [user, ...state.users],
          sessionUserId: user.id,
          activeCityId: cityId,
          notifications: [
            {
              id: uid("n"),
              userId: user.id,
              type: "system",
              title: "Welcome to Better Urban",
              body: "You start with 10 stars. Report your first issue to activate your 3 km alert radius.",
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        }));
        return { ok: true };
      },

      demoLogin: () => {
        const state = get();
        const demo = state.users.find((u) => u.id === DEMO_USER_ID) ?? state.users[0];
        if (!demo) return;
        set({ sessionUserId: demo.id, activeCityId: demo.cityId });
      },

      logout: () => set({ sessionUserId: null }),

      setCity: (cityId) => set({ activeCityId: cityId }),
      finishOnboarding: () => set({ onboarded: true }),

      createIncident: (input) => {
        const state = get();
        const user = state.users.find((u) => u.id === state.sessionUserId);
        if (!user) return null;
        const city = cityById(state.activeCityId);
        const audience = state.users.filter((u) => {
          if (u.cityId !== city.id) return false;
          const sector = state.sectors.find((s) => s.id === u.sectorId);
          return sector ? haversineKm(sector, { lat: input.lat, lng: input.lng }) <= 3 : false;
        }).length;

        const usedCodes = new Set(state.incidents.map((i) => i.code));
        let code = "";
        do {
          code = `BU-${2000 + Math.floor(Math.random() * 7000)}`;
        } while (usedCodes.has(code));
        const now = new Date().toISOString();
        const incident: Incident = {
          id: `inc_${uid("user")}`,
          code,
          cityId: city.id,
          sectorId: input.sectorId,
          categoryId: input.categoryId,
          subCategoryId: input.subCategoryId,
          title: input.title,
          note: input.note,
          lat: input.lat,
          lng: input.lng,
          landmark: input.landmark,
          photoUrl: input.photoUrl,
          isAnonymous: input.isAnonymous,
          reporterId: user.id,
          reporterName: input.isAnonymous ? "Anonymous citizen" : user.name,
          status: "dispatched",
          severity: input.severity,
          radiusKm: 3,
          alertedCount: Math.max(audience, 1),
          notifiedOrgs: orgsForCity(city.name),
          notifiedNgos: DEMO_NGOS,
          events: [
            {
              id: uid("ev"),
              kind: "reported",
              label: "Report received",
              detail: "Citizen report logged on the 3 km dispatch network.",
              at: now,
            },
            {
              id: uid("ev"),
              kind: "dispatch",
              label: "Alert dispatched",
              detail: `${city.name} control room, 2 partner NGOs and ${Math.max(audience, 1)} citizens inside 3 km were alerted.`,
              at: now,
            },
          ],
          helpedBy: [],
          createdAt: now,
          resolvedAt: null,
          rating: null,
          ratingComment: null,
        };

        const notifications: AppNotification[] = [
          {
            id: uid("n"),
            userId: user.id,
            type: "status",
            incidentId: incident.id,
            title: `${code} · Alert dispatched`,
            body: `${city.name} control room, 2 NGOs and ${Math.max(audience, 1)} neighbours have been alerted.`,
            createdAt: now,
            read: false,
          },
        ];

        if (user.id !== DEMO_USER_ID) {
          const demo = state.users.find((u) => u.id === DEMO_USER_ID);
          if (demo) {
            const demoIncidentSector = state.sectors.find((s) => s.id === demo.sectorId);
            if (demo.cityId === city.id && demoIncidentSector && haversineKm(demoIncidentSector, input) <= 3) {
              notifications.push({
                id: uid("n"),
                userId: demo.id,
                type: "alert",
                incidentId: incident.id,
                title: `${incident.title} reported nearby`,
                body: `${incident.landmark} · ${Math.round(haversineKm(demoIncidentSector, input) * 10) / 10} km from your sector.`,
                createdAt: now,
                read: false,
              });
            }
          }
        }

        set({
          incidents: [incident, ...state.incidents],
          notifications: [...notifications, ...state.notifications],
          users: state.users.map((u) =>
            u.id === user.id ? { ...u, stars: u.stars + 10 } : u,
          ),
        });

        return incident;
      },

      updateStatus: (incidentId, status) => {
        const state = get();
        const incident = state.incidents.find((i) => i.id === incidentId);
        if (!incident) return;
        const now = new Date().toISOString();
        const meta = STATUS_META[status];
        const events = [
          ...incident.events,
          {
            id: uid("ev"),
            kind: "status" as const,
            label: status === "resolved" ? "Marked resolved" : meta.label,
            detail:
              status === "resolved"
                ? "Field team marked the issue resolved. Awaiting citizen confirmation."
                : `Status updated by the ${cityById(incident.cityId).name} control room.`,
            at: now,
          },
        ];
        const notifications = [...state.notifications];
        if (incident.reporterId) {
          notifications.unshift({
            id: uid("n"),
            userId: incident.reporterId,
            type: "status",
            incidentId: incident.id,
            title: `${incident.code} · ${meta.label}`,
            body: `${incident.title} at ${incident.landmark} is now ${meta.short.toLowerCase()}.`,
            createdAt: now,
            read: false,
          });
        }
        set({
          incidents: state.incidents.map((i) =>
            i.id === incidentId
              ? {
                  ...i,
                  status,
                  resolvedAt: status === "resolved" ? now : i.resolvedAt,
                  events,
                }
              : i,
          ),
          notifications,
        });
      },

      rateIncident: (incidentId, rating, comment) => {
        const state = get();
        const incident = state.incidents.find((i) => i.id === incidentId);
        if (!incident) return;
        const now = new Date().toISOString();
        set({
          incidents: state.incidents.map((i) =>
            i.id === incidentId
              ? {
                  ...i,
                  rating,
                  ratingComment: comment,
                  events: [
                    ...i.events,
                    {
                      id: uid("ev"),
                      kind: "feedback",
                      label: `Citizen rated the fix ${rating}/5`,
                      detail: comment || undefined,
                      at: now,
                    },
                  ],
                }
              : i,
          ),
          users: state.users.map((u) =>
            u.id === state.sessionUserId ? { ...u, stars: u.stars + 10 } : u,
          ),
        });
      },

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.userId === state.sessionUserId ? { ...n, read: true } : n,
          ),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      joinVolunteer: (skills) => {
        const state = get();
        const user = state.users.find((u) => u.id === state.sessionUserId);
        if (!user) return;
        const alreadyVolunteer = user.isVolunteer;
        set({
          users: state.users.map((u) =>
            u.id === user.id
              ? { ...u, isVolunteer: true, role: "volunteer", skills, stars: u.stars + (alreadyVolunteer ? 0 : 15) }
              : u,
          ),
          notifications: alreadyVolunteer
            ? state.notifications
            : [
                {
                  id: uid("n"),
                  userId: user.id,
                  type: "volunteer",
                  title: "Volunteer hub unlocked",
                  body: "You are now a verified responder. Accept nearby alerts to earn stars.",
                  createdAt: new Date().toISOString(),
                  read: false,
                },
                ...state.notifications,
              ],
        });
      },

      leaveVolunteer: () =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === state.sessionUserId ? { ...u, isVolunteer: false, role: "citizen" } : u,
          ),
        })),

      acceptAlert: (incidentId) => {
        const state = get();
        const user = state.users.find((u) => u.id === state.sessionUserId);
        const incident = state.incidents.find((i) => i.id === incidentId);
        if (!user || !incident || incident.helpedBy.includes(user.id)) return;
        const now = new Date().toISOString();
        set({
          incidents: state.incidents.map((i) =>
            i.id === incidentId
              ? {
                  ...i,
                  helpedBy: [...i.helpedBy, user.id],
                  events: [
                    ...i.events,
                    {
                      id: uid("ev"),
                      kind: "volunteer",
                      label: `${user.name} joined as a nearby responder`,
                      detail: "Volunteer accepted the alert and is heading to the location.",
                      at: now,
                    },
                  ],
                }
              : i,
          ),
          users: state.users.map((u) =>
            u.id === user.id ? { ...u, stars: u.stars + 25, helped: u.helped + 1 } : u,
          ),
          notifications: [
            {
              id: uid("n"),
              userId: user.id,
              type: "volunteer",
              incidentId,
              title: "You earned 25 stars",
              body: `You accepted ${incident.code} at ${incident.landmark}. The reporter has been notified.`,
              createdAt: now,
              read: false,
            },
            ...state.notifications,
          ],
        });
      },

      toggleAlerts: () =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === state.sessionUserId ? { ...u, alertsEnabled: !u.alertsEnabled } : u,
          ),
        })),

      setAlertRadius: (km) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === state.sessionUserId ? { ...u, alertRadiusKm: km } : u,
          ),
        })),

      togglePreferredCategory: (categoryId) =>
        set((state) => ({
          users: state.users.map((u) => {
            if (u.id !== state.sessionUserId) return u;
            const has = u.preferredCategories.includes(categoryId);
            return {
              ...u,
              preferredCategories: has
                ? u.preferredCategories.filter((c) => c !== categoryId)
                : [...u.preferredCategories, categoryId],
            };
          }),
        })),

      updateProfile: (patch) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === state.sessionUserId ? { ...u, ...patch } : u)),
        })),

      resetDemo: () => {
        const seed = buildSeed();
        set({
          ...seed,
          sessionUserId: null,
          activeCityId: "metro",
          onboarded: false,
          hydrated: true,
        });
      },
    }),
    {
      name: "betterurban.db.v1",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cities: state.cities,
        sectors: state.sectors,
        users: state.users,
        incidents: state.incidents,
        notifications: state.notifications,
        sessionUserId: state.sessionUserId,
        activeCityId: state.activeCityId,
        onboarded: state.onboarded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useSessionUser() {
  return useApp((state) => state.users.find((u) => u.id === state.sessionUserId) ?? null);
}

export function useCityIncidents() {
  return useApp((state) => state.incidents.filter((i) => i.cityId === state.activeCityId));
}

export function useUnreadCount() {
  return useApp(
    (state) =>
      state.notifications.filter((n) => n.userId === state.sessionUserId && !n.read).length,
  );
}

export const DEMO_CREDENTIALS = { email: "demo@betterurban.app", password: DEMO_PASSWORD };
