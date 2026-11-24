# Better Urban — Feature Tracker

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⛔ cut for V1
Update this file after every feature. Acceptance = what a judge can click.

---

## P0 — core loop (must ship)

| # | Feature | Screen(s) | Status | Acceptance |
|---|---|---|---|---|
| 1 | Splash + auto-entry | `/` | ✅ | Brand, 3 km tagline, progress, routes to onboarding/auth/app |
| 2 | Onboarding (3 slides) | `/onboarding` | ✅ | Skip, dots, next/back, Get Started → auth |
| 3 | Sign up / sign in (email+password) | `/auth` | ✅ | Validation, city select, error states, persists session |
| 4 | Demo login (judge path) | `/auth` | ✅ | One tap into seeded demo citizen |
| 5 | City selection (5 cities) | `/app` | ✅ | Switcher in header changes feed/leaderboard/console |
| 6 | Home: best volunteer | `/app` | ✅ | Top volunteer by stars in active city |
| 7 | Home: category grid (8) | `/app` | ✅ | Each tile opens its report flow |
| 8 | Home: search | `/app` | ✅ | Filters categories + matching tickets |
| 9 | Home: live alerts near you | `/app` | ✅ | Real haversine ≤ radius, distance shown |
| 10 | Report: category tabs | `/report/[category]` | ✅ | Switch category without losing flow |
| 11 | Report: sub-issue radio list | `/report/[category]` | ✅ | Required, selected state |
| 12 | Report: photo upload | `/report/[category]` | ✅ | Compressed data URL, preview, remove |
| 13 | Report: GPS pin + sector + landmark | `/report/[category]` | ✅ | Real geolocation, nearest sector auto-pick, fallback |
| 14 | Report: brief note + anonymous | `/report/[category]` | ✅ | 280 chars, anonymous hides name publicly |
| 15 | Dispatch fan-out | store | ✅ | Authorities + 2 NGOs + real citizen count inside 3 km |
| 16 | Alert dispatched screen | `/report/sent/[id]` | ✅ | Radius graphic, 3 informed channels, ticket code |
| 17 | Track: status trail + timeline | `/track/[id]` | ✅ | 5-step progress, event log, SLA countdown |
| 18 | Track: feedback rating | `/track/[id]` | ✅ | 1–5 stars + comment after resolution, +10 stars |
| 19 | Track: "I'm nearby — help" | `/track/[id]` | ✅ | Adds responder, +25 stars, event + notification |
| 20 | My complaints | `/my-reports` | ✅ | All/open/resolved filters, counts |
| 21 | Notifications | `/notifications` | ✅ | Unread state, read-one, read-all, deep link to ticket |
| 22 | Volunteer hub | `/volunteer` | ✅ | Join/leave, skills, stars/helped/rank, nearby alerts |
| 23 | Leaderboard | `/leaderboard` | ✅ | City/global, top 25, "You" highlight |
| 24 | Profile | `/profile` | ✅ | Edit, alert radius, sub-category prefs, sign out |
| 25 | Ops console (demo) | `/admin` | ✅ | Move status; reporter gets notified |
| 26 | Persistence | store | ✅ | Survives refresh; seeded once |
| 27 | Reset demo | `/profile` | ✅ | Re-seeds all 5 cities |
| 28 | Landing page | `/landing` | ✅ | Hero, problem, how it works, dispatch, features, impact, disclosure, CTA |
| 29 | PWA shell | manifest | 🟡 | Manifest + icon done; no service worker, installability not claimed |

## P1 — differentiators (only after P0 is clean)

| # | Feature | Status | Notes |
|---|---|---|---|
| 30 | AI photo triage | 🟡 | Deterministic demo simulation, labelled "Demo AI"; swap to Gemini vision |
| 31 | SLA breach highlighting | ✅ | Track screen shows hours left / past SLA in red |
| 32 | Share ticket | ✅ | Web Share API + clipboard fallback |
| 33 | Shareable impact card (PNG) | ⬜ | html-to-image → social posts |
| 34 | Ward/sector report card | ⬜ | Stats card for the social loop |
| 35 | Clean-up drives | ⬜ | Cluster garbage ≥5 → drive + RSVP |
| 36 | Live city alerts feed | ⬜ | Waterlogging/outage with expiry |
| 37 | Hindi / English toggle | ⬜ | i18n dictionary |
| 38 | Offline draft capture | ⬜ | Service worker queue |

## P1b — Map + ops + flow (from FeatureFunction.docx, pending)

| # | Feature | Status | Notes |
|---|---|---|---|
| 39 | Flow: Under Review state | ⬜ | Add to STATUS_FLOW + STATUS_META |
| 40 | Flow: Verified state | ⬜ | Authority verifies report |
| 41 | Flow: Assigned state | ⬜ | Crew assigned |
| 42 | Flow: Closed state | ⬜ | After citizen confirms + rated |
| 43 | Live city map (Leaflet + OSM) | ⬜ | Colored markers: red=not started, yellow=working, green=done |
| 44 | Ward/sector numbers on map | ⬜ | Render sector polygons/labels |
| 45 | Map filters by city + category | ⬜ | Filter panel on map |
| 46 | Complaint details on marker click | ⬜ | Popup with ticket summary |
| 47 | Duplicate detection (same location) | ⬜ | Haversine ≤ 100m → flag/merge on submit |
| 48 | Search & filters (city/category/status) | 🟡 | Status filter exists; improve |
| 49 | Data quality (missing/invalid records) | ⬜ | Admin audit view |
| 50 | Activity logs (admin audit trail) | ⬜ | Who changed what, when |
| 51 | Role-based access (Citizen/Officer/Admin) | 🟡 | role field exists; gate /admin |
| 52 | Data sources (source + last updated) | ⬜ | Dataset metadata view |
| 53 | Responsive webapp (no phone frame on desktop) | ✅ | Phone chrome removed; top nav on desktop; bottom nav on mobile. |

## P2 — future / post-buildathon

- Supabase migration (auth, Postgres, storage, realtime, RLS)
- Real NGO/authority onboarding + verification badges
- Push notifications (web push)
- WhatsApp reporting bot for low-literacy users
- RTI-ready escalation letter generator
- Budget transparency module
- Predictive hotspot forecasting
- Sponsor rewards marketplace

## Cut for V1 (do not build)

- OTP/SMS auth · real payments · native app · IoT sensors · government API
  integration · in-app chat.

---

## 7-day schedule (compressed — deadline 28 Nov)

| Day | Focus | Status |
|---|---|---|
| 23 Nov | Foundation, design system, mock DB + seed, splash/onboarding/auth/home | ✅ |
| 24 Nov | Report flow, dispatch screen, track, my reports, notifications | ✅ (built ahead) |
| 25 Nov | Volunteer, leaderboard, profile, admin, landing page | 🟡 (all pages built; mobile QA pending) |
| 26 Nov | QA pass, mobile polish, PWA, seed numbers, share cards | 🟡 (QA started) |
| 27 Nov | Launch film + explainer capture, docs, brand kit, social posts | ⬜ |
| 28 Nov | Final QA, links, like screenshots, submit by 6 PM | ⬜ |

## Submission checklist (from brief)

- [ ] Live product link (Vercel)
- [ ] GitHub repo + setup instructions
- [ ] Landing page
- [ ] Brand kit PDF/Figma
- [ ] Launch film 60–90 s
- [ ] Explainer 2–3 min with demo
- [ ] 5+ social posts (Instagram + X, both hashtags, tag organisers)
- [ ] Screenshot of most-liked post
- [ ] Tools/tech disclosure list
- [ ] Project documentation (problem, research, solution, tech, impact)
