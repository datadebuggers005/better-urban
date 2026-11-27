# Build Log — Better Urban

Append-only. Newest entry on top. One entry per work block: what changed, files,
decisions, blockers, next.

---

## 2026-11-28 · Day 4 — Fix map page runtime crash + verify all APIs\n\n**Fixed**\n\n- `components/map/live-city-map.tsx`: `STATUS_META[inc.status]` → `STATUS_META[normalizeStatus(inc.status)]`, `inc.mapColor` → `mapColorForStatus(inc.status)` with fallback. Prevents \"Cannot read properties of undefined\" when incidents have legacy statuses.\n- Verified all backend endpoints: health, demo login, cities, incidents, notifications, feedback, uploads, vision, admin — all return 200.\n- 3/3 pytest passing, frontend typecheck + build passing.\n\n---\n\n## 2026-11-26 · Day 3 (late) — Real Indian cities in seed data\n\n**Shipped**\n\n- Replaced fictional city names (Metro City, Riverport, Northvale, Old Town, Greenfield) with real Indian cities: **Delhi, Mumbai, Bengaluru, Pune, Jaipur** (coordinates already matched these cities).\n- Updated `lib/catalog.ts`, `backend/services/seed_data.py`, `lib/seed.ts`, `backend/scripts/seed_firebase.py`, and landing page mockup.\n- IDs kept the same (metro, riverport, etc.) to avoid breaking references.\n- Build + typecheck + backend compile + tests (3/3) all pass.\n\n---\n\n## 2026-11-26 · Day 3 (late) — Fix runtime crash: legacy status handling\n\n**Fixed**\n\n- \"Cannot read properties of undefined (reading 'tone')\" runtime error on deployed site.\n- Root cause: `STATUS_META[status]` accessed without `normalizeStatus()` — legacy statuses (dispatched, acknowledged, reported) aren't keys in STATUS_META.\n- Fixed in: `track/[id]`, `map`, `my-reports`, `admin` pages + `StatusBadge` component + `app/page.tsx` (mapColor filter).\n- Replaced direct `incident.mapColor` access with `mapColorForStatus(incident.status)` for robustness.\n- Build + typecheck pass. Pushed to GitHub → Netlify/Railway auto-redeploy.\n\n---\n\n## 2026-11-26 · Day 3 (late) — Landing page upgrade (OCOR branding + trust section)\n\n**Shipped**\n\n- Updated `app/landing/page.tsx`: rebranded from \"Better Urban\" to \"OCOR\", added Trust/privacy/architecture section (server-side AI, consent-first location, duplicate detection, demo vs cloud separation) inspired by CityFix AI reference.\n- Added \"Trust\" nav link.\n- Updated hero mockup code reference (OC-2048).\n- Build passes, Netlify auto-deploys.\n\n---\n\n## 2026-11-26 · Day 3 — OCOR production upgrade merged (M1-M4)\n\n**Pulled from main (PR #1):**\n\n- Rebranded Better Urban → **OCOR** (Our City, Our Responsibility). App name, tagline, logo, code prefix, support email all updated.\n- Added `/map` route with Leaflet live city map (colored markers: red/yellow/green, ward numbers, city/category filters, marker-click details).\n- 7-state lifecycle: Reported → Under Review → Verified → Assigned → In Progress → Resolved → Closed.\n- RBAC: Citizen / Officer / Admin roles with gated admin endpoints.\n- Duplicate detection (haversine proximity on submit).\n- Activity logs (admin audit trail).\n- Data quality + data sources endpoints.\n- Upload endpoint for photos.\n- `lib/theme.ts` with OCOR palette + map status tokens.\n- `lib/api.ts` expanded with full API client (typed requests).\n- Backend: new routers (uploads), services (data_quality, duplicates), ActivityLog model.\n- Tests: `backend/tests/test_ocor_api.py` (pytest, 3 passing).\n\n**Verified:**\n- `npm run typecheck` ✅, `npm run build` ✅ (16 routes incl. `/map`).\n- Backend compile ✅, pytest 3/3 pass.\n- Backend live on Railway: health, demo login, cities, incidents all working.\n- Frontend live on Netlify: landing page loads.\n- CORS configured for Netlify origin.\n\n**Next:**\n- Verify Netlify frontend can reach Railway backend (check `NEXT_PUBLIC_API_BASE` env var).\n- Test full flow on deployed site: login → report → map → track → feedback.\n- Seed Firebase with OCOR demo data.\n\n---\n\n## 2026-11-25 · Day 3 — Firebase wired (env-var credentials + seed script)\n\n**Shipped**\n\n- `core/firebase.py` now reads the service account from `FIREBASE_CREDENTIALS_JSON` env var (raw JSON or base64), falling back to file path / ADC.\n- Added `scripts/seed_firebase.py` to populate Firestore with demo users, cities, sectors, incidents, notifications.\n- `.env.example` updated with `FIREBASE_CREDENTIALS_JSON`.\n- Frontend Firebase config captured (projectId `better-urban`, storageBucket `better-urban.firebasestorage.app`).\n\n**To switch to Firebase:**\n1. Create Firebase project (Auth Email/Password + Firestore test mode).\n2. Railway Variables: `DB_BACKEND=firebase`, `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_CREDENTIALS_JSON` (paste full service account JSON).\n3. Run `python scripts/seed_firebase.py` locally (with creds in .env) to seed Firestore.\n4. Redeploy.\n\n**Note:** Storage skipped — photos stored as compressed data URLs in Firestore (fine for demo).\n\n---\n\n## 2026-11-24 · Day 2 (deploy config) — Next.js dev indicator removed + deploy notes\n\n**Shipped**\n\n- `next.config.ts`: added `devIndicators: false` to hide the Next.js dev icon (bottom-left \"N\" logo) in development. It never shows in production builds anyway.\n- Confirmed phone frame removed on desktop (clean web app).\n\n**Deploy to Vercel (frontend)**\n\n1. Push repo to GitHub.\n2. Go to https://vercel.com → New Project → import the repo.\n3. Framework preset: Next.js (auto-detected). Build command: `npm run build`. Output: auto.\n4. Add env var `NEXT_PUBLIC_API_BASE` = your backend URL (e.g. https://your-backend.onrender.com).\n5. Deploy. Every `git push` auto-redeploys.\n6. Add custom domain in Vercel dashboard (free).\n\n**Deploy backend (FastAPI)**\n\n- Option A: Render (free tier) — New Web Service → connect repo → root dir `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.\n- Option B: Railway / Fly.io — similar.\n- Option C: Firebase Cloud Run — `gcloud run deploy`.\n- Set env vars: `DB_BACKEND=firebase` (or local with persistent disk), `FIREBASE_*`, `CORS_ORIGINS=https://your-vercel-domain`.\n- For local DB on a host with ephemeral disk, use Firebase (Firestore) in production.\n\n**Note:** Next.js dev indicator only appears in `npm run dev`. Production (`npm run build && npm start` / Vercel) never shows it.\n\n---\n\n## 2026-11-24 · Day 2 (late) — Responsive UI: no phone mockup on desktop\n\n**Shipped**\n\n- Removed phone-frame chrome on desktop (rounded corners, shadow, white ring, dotted backdrop) — `.app-backdrop` now clean cream, `.phone-screen` full-width column.\n- Added desktop top nav bar in `AppFrame` (Home/Reports/Volunteer/Profile) — `BottomNav` hidden on desktop (`md:hidden`).\n- App now reads as a clean web app on desktop while staying mobile full-bleed.\n\n---\n\n## 2026-11-24 · Day 2 (late) — Pending features catalogued + responsive UI plan\n\n**Shipped**\n\n- Catalogued 14 pending features from FeatureFunction.docx into `docs/features.md` (P1b section): 4 flow states (Under Review/Verified/Assigned/Closed), live city map with colored markers, ward numbers, map filters, marker click details, duplicate detection, search/filters, data quality, activity logs, RBAC, data sources, responsive webapp.\n- Confirmed 11/11 core features from the docx are already built.\n- Plan: remove phone-frame mockup on desktop; make app a real responsive webapp (mobile full-bleed, desktop full-width with top nav).\n\n**Next**\n\n1. Responsive UI: replace 430px phone frame with responsive container (mobile full-bleed, desktop centered max-width 1100px, top nav on desktop).\n2. Extend flow states to 9.\n3. Live city map (Leaflet + OSM).\n4. Duplicate detection.\n\n---\n\n## 2026-11-24 · Day 2 (planning + feedback) — Responsive webapp, hosting plan, feedback loop\n\n**Shipped**\n\n- Added `/feedback` page (rating + message) and `POST /api/feedback` backend endpoint (works on local DB + Firebase).\n- Added `lib/api.ts` (API base) and `lib/brand.ts` (variable app identity).\n- Added `backend/core/brand.py` for backend brand config.\n- Added feedback link in profile page.\n- Updated `docs/features.md` with Phase 2 (web + hosting + feedback).\n\n**Plan — hosting & feedback (to do)**\n\n1. **Responsive webapp:** keep phone frame on desktop for demo; ensure all features work on desktop browser (they do). Optionally widen desktop frame to 480px.\n2. **Hosting:**\n   - Frontend → Vercel (connect GitHub repo, auto-deploy on push, free tier, custom domain).\n   - Backend → Render / Railway / Fly.io (free tier) or Firebase Cloud Run. Set `DB_BACKEND=firebase` + creds.\n   - Env vars: `NEXT_PUBLIC_API_BASE` → backend URL.\n3. **Feedback loop:** feedback stored in DB; add admin view (`/admin/feedback`) to read submissions. Optionally email notify via Resend/SendGrid.\n4. **Android:** wrap with Capacitor (`npx cap add android`) for native GPS/camera; or keep PWA (installable from browser). Location/map features use existing GPS + Nominatim reverse geocode.\n5. **Map features:** add a simple map view (Leaflet + OpenStreetMap tiles, free) showing incidents within 3 km. Currently only pin + sector dropdown.\n\n**Known gaps**\n\n- No map view yet (only GPS capture + sector dropdown).\n- Feedback admin view not built.\n- Android wrapper not created.\n- Desktop frame is 430px (phone-like); consider widening for desktop webapp.\n\n---\n\n## 2026-11-24 · Day 2 — Local DB, seed, variable app config, run scripts\n\n**Shipped**\n\n- Added `DB_BACKEND` switch (default `local`): SQLite via SQLAlchemy, Firebase optional.\n- `backend/db/` (models, session, local_store, seed) with 51 users + 15 incidents + notifications seeded.\n- `backend/scripts/seed_local.py` to reset/reseed the local DB.\n- `core/auth.py` handles local tokens (`local::<uid>`); routers branch on `is_local()`.\n- `lib/brand.ts` (frontend) + `backend/core/brand.py` for variable app name/tagline/logo/email/hashtags.\n- `.env.local.example` for frontend, `.env.example` for backend (updated).\n- `scripts/run-local.bat` / `run-local.sh` to boot backend + frontend together.\n- Verified end-to-end: signup, login, create incident (+stars), list, notifications all work on local DB.\n\n**Next**\n\n- Provide Firebase creds to switch `DB_BACKEND=firebase`.\n- Location/map features for Android (Capacitor/React Native wrapper) — web GPS already works.\n\n---\n\n## 2026-11-23 · Day 1 (backend, vision) — Image analysis APIs\n\n**Shipped**\n\n- Added `services/vision.py`: EXIF GPS extraction (Pillow), reverse geocoding (Nominatim, free), auto-tagging via Hugging Face CLIP (HF_TOKEN) with Google Cloud Vision fallback.\n- Added `routers/vision.py`: `/api/vision/analyze` (auth) and `/api/vision/analyze-public` (demo).\n- Maps detected labels to our 8 category ids; returns suggested category + location + tags.\n- Documented providers (Google Vision, Hugging Face, Roboflow, Nominatim) in `docs/backendfeatures.md`.\n- `.env.example` updated with `HF_TOKEN`, `GOOGLE_VISION_API_KEY`.\n\n---\n\n## 2026-11-23 · Day 1 (backend) — FastAPI + Firebase scaffold\n\n**Shipped**\n\n- Created `backend/` FastAPI service with Firebase Admin SDK integration.\n- Auth: signup, login (Firebase Identity Toolkit), demo login, /me.\n- Users: profile get/update, notifications list, mark-all-read.\n- Cities/sectors/categories endpoints (static seed, mirrors frontend).\n- Incidents: list/get/create (3 km audience via haversine), status update, rate, volunteer help.\n- Notifications, leaderboard, volunteer join, admin incidents.\n- Pydantic models mirroring `lib/types.ts`; Bearer auth middleware.\n- `.env.example`, `README.md`, `requirements.txt`.\n- `docs/backendfeatures.md` feature inventory.\n\n**Next**\n\n- Add Firebase project credentials, security rules, frontend swap from mock store to API.\n\n---\n\n## 2026-11-23 · Day 1 (final, rebuilt) — Screen deck PDF via PyMuPDF\n\n**Shipped**\n\n- Rebuilt `docs/Better-Urban-screen-deck.pdf` with PyMuPDF (fitz) because the hand-rolled PDF had images rendering as blank in some viewers. All 20 pages now carry exactly one image each, verified by `page.get_images()`.\n- Pre-cropped each screenshot to its phone-frame region (486 x 860) before embedding, so the image fills the page instead of being a tiny strip.\n- Saved the generator as `scripts/build-deck.py` (reads `docs/screens/manifest.json`).\n- Verified render variance: std 92-125 on phone pages (high contrast, text present).\n\n---\n\n## 2026-11-23 · Day 1 (final) — Code uniqueness, note mapping, screen deck PDF\n\n**Shipped**\n\n- Fixed duplicate ticket codes: seed now allocates `BU-2049..` sequentially across all 5 cities (was reusing `2048 + i*3` per city); store generates random codes with collision check. 70 unique codes, verified.\n- Fixed mismatched notes: added `SUB_NOTES` map so each sub-issue gets a realistic note (no more \"Harassment: water pooling\").\n- Captured 19 phone-frame screenshots (splash, onboarding, auth, home, report x2, dispatch, track x2, my reports, notifications, volunteer, leaderboard, profile, admin, landing x4) at a consistent 430 x 812 phone frame.\n- Built `docs/Better-Urban-screen-deck.pdf` (20 pages: cover + 19 screens) via `scripts/make-deck.mjs` (zero dependencies, JPEG-embedded, clipped to the phone frame). 2.0 MB.\n\n**Decisions**\n\n- Mixed page orientations: portrait A4 for phone screens, landscape A4 for landing slices.\n- Landing captured as 4 viewport slices (hero, problem/how, 3 km dispatch, features/impact) to keep text readable.\n\n**Known issues / next**\n\n- Landing slices cut mid-section at hard boundaries; acceptable for a deck.\n- PDF text is WinAnsi; non-ASCII punctuation normalised to ASCII.\n\n---\n\n## 2026-11-23 · Day 1 (later) — Landing page + browser QA","oldString":"## 2026-11-23 · Day 1 (later) — Landing page + browser QA","path":"C:\\Users\\bablu\\Desktop\\CityBizz\\docs\\log.md

**Shipped**

- `/landing` marketing page: hero with product mock, problem framing, 4-step loop,
  dark 3 km dispatch section, feature grid, impact/roadmap, honest-demo
  disclosure, CTA and footer with event hashtags.
- README with setup, demo accounts, stack, structure and disclosures.
- Browser QA of the full judge path: splash → onboarding → demo login → home →
  report → dispatch → track → admin status change → notification.
- Fixed: Zustand selector returning a new array in notifications (React 19
  "getSnapshot should be cached" infinite loop).
- Fixed: demo citizen stars (340) so city rank lands at #4 as designed; generated
  citizens capped below that.
- Fixed: seeded `helpedBy` included the demo user, which pre-marked random tickets
  as "Responding".
- Fixed: 3 km reference falls back to the selected city centre when browsing
  another city (home + volunteer).
- Added: cluster of open tickets around Sector 18 so the home feed is never empty.
- Added: select chevron styling, demo AI triage verified with an uploaded canvas
  image (compression + suggestion + "already selected" state).

**Decisions**

- Landing is a separate route, `/` stays the splash to match the Figma flow.
- Demo photos are compressed to ~1000 px JPEG data URLs. One photo ≈ 60–90 KB;
  full demo DB ≈ 700 KB, comfortably inside localStorage.
- No service worker yet — manifest + icon only, so iOS "Add to Home Screen"
  works but Chrome installability is not claimed.

**Known issues / next**

- Landing not yet checked at 390 px (desktop + 808 px checked visually).
- Need a real logo/wordmark export for the brand kit.
- Reset demo after seed changes so the helper fix takes effect.
- Screen-record the flow for the launch film + explainer.

---

## 2026-11-23 · Day 1 — Foundation + full P0 prototype

**Shipped**

- Next.js 15 + TypeScript + Tailwind v4 + Zustand scaffold.
- Design system matched to Figma screenshots: cream/navy palette, Sora + Inter,
  430 px phone canvas on desktop, 4-tab bottom nav, shared UI kit
  (`components/ui.tsx`).
- Mock backend (`lib/store.ts`) with persisted localStorage DB, 15 actions, and
  deterministic seeding (`lib/seed.ts`): 5 cities × 20 sectors, 1,600 demo
  citizens, 70 tickets, 3 pinned top volunteers, 4 demo notifications.
- Splash, onboarding (3 slides), auth with demo login, home (city switch, best
  volunteer, week stats, category grid, search, live 3 km alerts), report flow
  (sub-issue, photo compression, GPS + nearest sector, anonymous, live audience
  count), dispatch screen, track screen (SLA, timeline, feedback, volunteer
  accept, share), my reports, notifications, volunteer hub, leaderboard,
  profile (edit, alert radius, prefs), ops console.
- PWA manifest + icon, build passes (`next build`), docs folder created.

**Decisions**

- No keys → mock everything. Pages depend on store actions only, so a Supabase
  swap won't touch UI.
- No OTP: email/phone + password plus "Continue with demo citizen" (judge path).
- Fictional cities seeded at real Indian metro coordinates so GPS distance math
  is plausible. Clearly labelled demo.
- `alertedCount` computed with haversine over seeded citizens — no fabricated
  reach numbers.
- AI triage simulated from a filename hash and visibly tagged "Demo AI". Same
  JSON shape as the future Gemini call.
- Photo stored as compressed JPEG data URL (~1000 px) to survive localStorage.
- Dropped the separate map screen (not in Figma) in favour of the pin card.

**Files added** — app/* (14 routes), components/* (6), lib/* (8), public/manifest,
public/icon.svg, docs/*.

**Blockers / notes**

- Figma fonts + exact hex values still unconfirmed; using visual match.
- Landing page not built yet.
- Need a real logo/wordmark asset for the brand kit and landing hero.

**Next**

1. `/landing` marketing page (hero, problem, how it works, 3 km dispatch,
   volunteer, impact, disclaimer, CTA).
2. Browser QA pass: splash → onboarding → demo login → report → dispatch →
   track → admin status change → notification.
3. PWA install check, 360 px mobile audit, empty states.
4. Shareable ticket/impact card for social.
