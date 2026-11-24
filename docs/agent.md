# Better Urban — Agent Memory

> Read this first. It is the working memory for this repo. Update it whenever
> architecture, routes, accounts or conventions change. Everything else lives in
> `docs/features.md` (what to build) and `docs/log.md` (what was done, when).

Last updated: **2026-11-23**

---

## 1. Product

**Better Urban** — a 3 km civic + emergency dispatch network for Indian cities.

One citizen report fans out to three channels instantly:

1. the relevant authority (municipal control room / traffic police),
2. verified local NGOs,
3. every registered citizen inside a 3 km radius.

The differentiator is the **closed loop**: every ticket has a public resolution
trail, an SLA target, and a citizen rating at the end. Reporting is the starting
point, accountability is the product.

**Tagline:** "Better Together."
**Positioning line:** "We don't just solve problems. We build civilised citizens."

### Source of truth for design

Figma: https://www.figma.com/design/8T4rYSmY8euSLZyS5rR2cd/Buildathon?node-id=6-61
Screens: Splash → Onboarding → Sign in → Home (categories) → Sub-issue/Report →
Alert dispatched → Volunteer/Leaderboard → Profile.

Colours and type below are matched from the Figma exports (screenshots), not
from Figma tokens — refine when the designer shares exact values.

---

## 2. Build constraints (decided with the founder)

| Decision | Value |
|---|---|
| Team | solo developer (rest of team on design/video) |
| Backend | **mocked** — no Supabase/API keys available yet |
| Auth | email or phone + password. **No OTP/SMS.** Demo login button |
| AI | **simulated** on-device triage, clearly labelled "Demo AI" |
| Cities | 5 fictional cities, 20 sectors each |
| Deadline | 28 Nov 2026, 11:59 PM (buildathon started ~23 Nov) |
| Hosting plan | Vercel (public link) |

**Honesty rules baked into the UI:** every demo surface carries a
"Prototype / demo data / simulated dispatch" label. No government logos, no
claim of government affiliation, fictional org names, seeded citizens are
labelled demo profiles in copy.

---

## 3. Stack

- **Next.js 15** (App Router, all product screens are client components)
- **TypeScript**, strict
- **Tailwind CSS v4** (`@theme` tokens in `app/globals.css`)
- **Zustand 5 + persist** — the mock backend (localStorage key `betterurban.db.v1`)
- **lucide-react** icons, **framer-motion** installed (used sparingly)
- Fonts: **Inter** (body) + **Sora** (display) via `next/font/google`
- No server actions, no API routes yet, no database

### Why the mock layer is shaped like a real backend

`lib/store.ts` exposes actions (`login`, `signup`, `createIncident`,
`updateStatus`, `rateIncident`, `acceptAlert`, …) and a typed `AppState`.
Swapping to Supabase later means re-implementing these actions against tables —
pages do not change. Seed generation lives in `lib/seed.ts`, isolated from UI.

---

## 4. Routes

| Route | Screen | Notes |
|---|---|---|
| `/` | Splash | auto-advances after ~1.6 s |
| `/onboarding` | 3-slide onboarding | sets `onboarded` |
| `/auth` | Sign in / create account | demo login button |
| `/app` | Home | city switch, best volunteer, categories, nearby alerts |
| `/report/[category]` | Report flow | category tabs → sub-issue → photo → location → note |
| `/report/sent/[id]` | Alert dispatched | radius graphic + informed channels |
| `/track/[id]` | Ticket detail | status trail, timeline, feedback, "I'm nearby" |
| `/my-reports` | My complaints | All / Open / Resolved |
| `/notifications` | In-app notifications | mark read / read all |
| `/volunteer` | Volunteer hub | join, skills, nearby alerts, mini leaderboard |
| `/leaderboard` | Top responders | city / global scopes |
| `/profile` | Profile | edit, alert radius, categories, reset demo |
| `/admin` | Ops console | status transitions for the demo |
| `/landing` | Marketing landing | public, full-width, required deliverable |

Bottom nav (4): Home · Profile · My Reports · Volunteer.

---

## 5. Data model (`lib/types.ts`)

- `City` — 5 fictional cities with a center coordinate
- `Sector` — 20 per city, `cityId`, coordinate, `Sector N`
- `Category` / `SubCategory` — 8 categories, 25 sub-issues
- `User` — name, email, phone, password, city/sector, stars, helped,
  isVolunteer, skills, preferredCategories, alertRadiusKm, alertsEnabled, role
- `Incident` — code `BU-XXXX`, category/sub, title, note, lat/lng, landmark,
  photoUrl (data URL), anonymous flag, reporter, status, severity, radiusKm,
  alertedCount, notifiedOrgs/Ngos, events[], helpedBy[], createdAt, resolvedAt,
  rating, ratingComment
- `IncidentEvent` — the public resolution trail (reported / dispatch / status /
  volunteer / feedback)
- `AppNotification` — per-user in-app notifications (alert/status/system/volunteer)

**Statuses:** `reported → dispatched → acknowledged → in_progress → resolved`.
SLA targets by severity: critical 6h, high 24h, medium 72h, low 120h.

**Stars:** report +10, feedback +10, join volunteer +15, help +25.

---

## 6. Seed data

- 5 cities: Metro City, Riverport, Northvale, Old Town, Greenfield.
- 20 sectors per city (Sector 1–20).
- **1,600 citizens** (320/city, 318 in Metro including demo + 3 pinned volunteers).
- 14 tickets per city (70 total) with realistic notes/statuses; 3 of the Metro
  tickets belong to the demo user.
- `alertedCount` is a **real haversine query** over seeded citizens — not a
  hardcoded marketing number.
- Top volunteers pinned: Aarav Mehta (Sector 18, 488★), Priya Nair (Sector 9,
  415★), Rohan Verma (Sector 14, 360★).

### Accounts

| Account | Email | Password | Notes |
|---|---|---|---|
| Demo citizen | `demo@betterurban.app` | `demo1234` | Riya Sharma, Sector 18, 120★ |
| Any seeded account | `<first>@betterurban.app` | `demo1234` | or use the demo button |

"Continue with demo citizen" on `/auth` is the intended judge path.

---

## 7. File map

```
app/
  layout.tsx            fonts, metadata, <StoreHydrator/>
  globals.css           Tailwind v4 tokens + phone-frame styling
  page.tsx              splash
  onboarding/ auth/ app/ report/[category]/ report/sent/[id]/
  track/[id]/ my-reports/ notifications/ volunteer/ leaderboard/
  profile/ admin/ landing/ (todo)
components/
  ui.tsx                Button, Card, Chip, Pill, StatusBadge, Avatar, inputs, PageHeader
  app-frame.tsx         desktop phone frame, loader, HydrationGate, DemoBadge
  bottom-nav.tsx        4-tab nav
  incident-card.tsx     list row + category thumb
  radius-graphic.tsx    SVG 3 km dispatch visual
  store-hydrator.tsx    rehydrate + seed on first load
lib/
  types.ts catalog.ts seed.ts store.ts geo.ts format.ts image.ts utils.ts
docs/  log.md features.md agent.md
```

---

## 8. Conventions

- All pages under `/app` etc. are `"use client"` and wrapped in
  `<HydrationGate><AppFrame>…</AppFrame></HydrationGate>`.
- `AppFrame` renders the 430 px phone canvas on desktop and full-bleed on mobile.
- Never read `localStorage` during render — the store hydrates via
  `StoreHydrator` with `skipHydration: true`.
- Design tokens: cream `#f7f4ec` / paper `#fbf9f4`, ink `#0e1d38`,
  line `#e5e0d3`, muted `#6e6b60`, gold `#e3a33c`, green `#1c8c57`,
  danger `#b4442e`. Radius ~1.15rem cards.
- Keep the "demo data / simulated dispatch" disclosure on every surface that
  could be mistaken for a real authority feed.
- No paid APIs, no keys, no external calls at runtime.

---

## 9. Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run typecheck
```

Reset the demo database: Profile → "Reset demo" (or clear the
`betterurban.db.v1` localStorage key).

---

## 10. Known gaps / next

- Landing page exists at `/landing`; needs a 390 px mobile pass.
- AI triage is a deterministic filename-hash simulation — swap for Gemini vision
  server route when a key exists; keep the same JSON contract:
  `{ category, subCategoryId, confidence, severity }`.
- No real map/pin picker (Figma only calls for a pin card; GPS capture works).
- Photo is compressed to ~1000 px and stored as a data URL — fine for demo,
  replace with object storage later.
- No service worker, so installability is manifest-only (iOS A2HS works).
- No push notifications, no OTP, no payments, no authority integration.
- Seed changes require Profile → Reset demo (localStorage keeps old DB).
