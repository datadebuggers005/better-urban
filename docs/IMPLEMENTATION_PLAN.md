# OCOR — Our City, Our Responsibility: Audit & Implementation Plan

## 1. Overview & Documentation Audit Note

- **Project Identity:** Production upgrade and rebrand of **Better Urban** -> **OCOR - Our City, Our Responsibility** on local git branch `feat/ocor-production-upgrade`.
- **Execution Mode:** 100% local (`DB_BACKEND=local`, `DATABASE_URL=sqlite:///./ocor.db`, `UPLOAD_DIR=./uploads`, `NEXT_PUBLIC_API_BASE=http://localhost:8000`, `OLLAMA_HOST=127.0.0.1:8081`). Zero live Railway, Netlify, Vercel, or production Firebase deployments or mutations.

> **Explicit Missing-Docs Note:** `docs/feature-undefined` and `docs/FeatureFunction.docx` **do not exist** in the repository (both paths were inspected and confirmed absent). All authoritative requirements are consolidated from `ORIGINAL_REQUEST.md` (R1–R6), `docs/features.md` (P0 #1–29, P1 #30–38, P1b #39–53), `docs/agent.md`, `docs/backendfeatures.md`, `docs/log.md`, `docs/screens/manifest.json`, the OCOR Logo (`public/ocor-logo.jpg`, `669x515`), and the OCOR Color Palette (`55` PIL-sampled swatches).

---

## 2. Complete Feature Audit Matrix (Existing vs. Missing / Broken)

### Table 2A — Audit Against `docs/features.md` (P0 #1–29, P1 #30–38, P1b #39–53)

| ID(s) | Feature Scope | Current Repo State | Gap / Action Required | Target Milestone |
|---|---|---|---|---|
| P0 #1–28 | Citizen onboarding, auth, dashboard, report flow, tracking, notifications, volunteer, leaderboard, profile, feedback | Built in Next.js prototype using `localStorage` (`lib/store.ts`); only `/feedback` hits FastAPI. Still branded `"Better Urban"` with old `#f7f4ec`/`#0e1d38` colors. | Rebrand to OCOR, migrate to centralized `lib/theme.ts` + `app/globals.css`, wire all auth/incident/notification/volunteer/profile/feedback flows to FastAPI `http://localhost:8000` with Bearer JWTs. | M1, M2, M3 |
| P0 #29 | PWA shell (`manifest.webmanifest`, `icon.svg`) | Partial: `public/manifest.webmanifest` and `public/icon.svg` exist with Better Urban colors/brand; no service worker (`sw.js`). | Update `public/icon.svg`, `public/ocor-logo.jpg`, and `public/manifest.webmanifest` to OCOR brand & exact PIL colors. | M1 |
| P1 #30 | AI photo triage (`/api/vision/analyze`) | Broken/Partial: frontend uses deterministic filename-hash `"Demo AI"`; `backend/services/vision.py` crashes with `NameError` (`io` and `os` not imported); `python-multipart` / `piexif` missing from runtime setup. | Fix `import io, os` in `backend/services/vision.py`, add local multipart upload `POST /api/uploads`, wire real photo upload + AI/EXIF fallback in `/report/[category]`. | M2, M3 |
| P1 #31–32 | SLA breach highlighting & Share ticket | Existing in frontend prototype. | Preserve & verify against 7-state lifecycle and OCOR branding/hashtags (`#OCOR`). | M3 |
| P1 #33–38 | Optional P1 extras (Impact PNG, Ward report card, Clean-up drives, Live alerts feed, Hindi/English toggle, Offline draft) | Pending optional P1 extras in `docs/features.md` (outside core R1–R6 acceptance criteria). | Documented as post-V1 / optional backlog unless scoped after R1–R6 core gates pass. | Backlog |
| P1b #39–42 | 7-state workflow (`Under Review`, `Verified`, `Assigned`, `Closed` added to `Submitted`, `In Progress`, `Resolved`) | **MISSING** — only 5 old states exist (`reported`, `dispatched`, `acknowledged`, `in_progress`, `resolved`). | Implement canonical 7-state `IncidentStatus` + `mapColor` (`RED`/`YELLOW`/`GREEN`) across backend models, transitions, seeds, frontend types, `/track/[id]`, and `/admin`. | M2, M3, M4 |
| P1b #43–46 | Live City Map (`RED`/`YELLOW`/`GREEN` pins, ward numbers, city/category filters, marker click details) | **MISSING** — no Leaflet, no `/map` route, no `wardNumber` field on sectors/incidents. | Add `wardNumber` + `mapColor` in backend; install Leaflet and build client-only (`ssr: false`) `/map` route with filters, ward badges, and marker detail drawer. | M2, M4 |
| P1b #47 | Duplicate detection (`<= 100m` same location & category) | **MISSING** — no backend proximity calculation or UI warning. | Implement `backend/services/duplicates.py` (`<= 100m` Haversine + same category), `POST /api/incidents/check-duplicate`, pre-submit warning in `/report/[category]`, and Admin Duplicate Review tab. | M2, M3, M4 |
| P1b #48 | Search & filters (`cityId`, `categoryId`, `status`, `wardNumber`, `search`) | Partial — basic client filtering only; backend `GET /api/incidents` lacks `categoryId`, `wardNumber`, and `search`. | Expand `GET /api/incidents` query filters in backend and connect `/my-reports`, `/map`, and `/admin`. | M2, M3, M4 |
| P1b #49 | Data quality audit (missing/invalid fields, coordinates, orphan links) | **MISSING** — no service, endpoint, or UI. | Implement `backend/services/data_quality.py` + `GET /api/admin/data-quality` + Admin Data Quality tab. | M2, M4 |
| P1b #50 | Activity logs audit trail (who updated what and when) | **MISSING** — no `activity_logs` table, endpoint, or UI. | Add `activity_logs` SQLAlchemy/Firestore model, auto-logging on create/status/assign/help/role changes, `GET /api/admin/activity-logs`, and Admin Activity Logs tab. | M2, M4 |
| P1b #51 | RBAC (`Citizen`, `Officer`, `Admin`) | **BROKEN / PARTIAL** — `Role` is `citizen | volunteer | admin` (no `officer`); `/admin` is unguarded; `PATCH /api/incidents/{id}/status` uses `get_current_user` with zero role check. | Implement `Role = "citizen" | "officer" | "admin"` (`isVolunteer` separate flag), backend `require_roles` / `require_admin`, officer/admin seed users, and frontend role gating on `/admin`. | M2, M3, M4 |
| P1b #52 | Data sources metadata | **MISSING** — no endpoint or UI. | Add `GET /api/admin/data-sources` & `GET /api/data-sources` + Admin Data Sources tab. | M2, M4 |
| P1b #53 | Responsive web app (mobile + desktop clean layout) | Existing in `app/globals.css`. | Preserve responsive layout while migrating all CSS surfaces/colors to centralized OCOR tokens. | M1, M3, M4 |

### Table 2B — Audit Against `ORIGINAL_REQUEST.md` (R1–R6) & Codebase Defects

| Req | Scope | Current Gap | Target Milestone |
|---|---|---|---|
| **R1** | Audit, Implementation Plan & Live Progress Tracker | No `docs/IMPLEMENTATION_PLAN.md` or `docs/LIVE_PROGRESS.md`. | M1 |
| **R2** | OCOR Rebrand, Splash Screen & Centralized Color Palette | Still `"Better Urban"` with hardcoded `#f7f4ec`/`#0e1d38`/`#8a5f17` hexes and missing `/icon-192.png`. | M1 (theme/brand core & assets) + M3 (UI pages/components) |
| **R3** | Citizen E2E: Auth, Dashboard, Report (photo upload, tags, GPS/address, city, 5 categories `Road`/`Water`/`Garbage`/`Drainage`/`Streetlight`), 7-state Track, Notifications, Feedback | Prototype uses `localStorage`, 8 old categories, 5 old statuses, and fake photo strings instead of multipart uploads. | M2 (backend) + M3 (frontend) |
| **R4** | Live City Map (`RED`/`YELLOW`/`GREEN`, ward numbers, city/category filters, marker click details) | Completely absent. | M2 (API/ward/color) + M4 (`/map` Leaflet UI) |
| **R5** | Admin & Officer Management (RBAC, 7-state workflow, Activity Logs, Duplicate Detection, Data Quality, Data Sources) | Missing `officer` role, missing backend RBAC checks, missing logs/duplicates/quality/sources. | M2 (backend) + M4 (`/admin` console) |
| **R6** | Local Git Feature Branch, Prod Safety, Local Ollama Execution & Automated Tests | On `main`, missing root `.env.example`, missing `pytest`/Vitest/Playwright suites, no Ollama execution logs. | M1 (branch, env, Ollama) + M2 (`pytest`) + M4 (lint + Vitest) + E2E + M5 |

#### Known Codebase Defects & Follow-Up Flags
1. **`backend/services/vision.py`**: Uses `io.BytesIO` and `os.getenv` without `import io` or `import os` -> raises `NameError` at runtime (**Fix in M2**).
2. **`backend/scripts/seed_firebase.py:84`**: Contains stray `PY` token causing `SyntaxError` (**Fix in M2**).
3. **`backend/routers/incidents.py:126`**: `PATCH /api/incidents/{id}/status` checks `get_current_user` only — any citizen can alter status (**Fix in M2 with `require_roles("officer", "admin")`**).
4. **`backend/routers/auth.py`**: Stores/compares plaintext password in local SQLite mode and calls non-existent `store_add_notification` (**Fix in M2 with proper hashing + notification helper**).
5. **`backend/routers/users.py`**: Calls Pydantic v1 deprecated `body.dict()` (**Fix in M2 -> `model_dump()`**).
6. **`.gitignore` Follow-up (Out of M1 Write Scope)**: Currently ignores `backend/betterurban.db` explicitly, **not** `backend/ocor.db`, `backend/*.db`, or `backend/uploads/`. Before M2 runs local SQLite/uploads tests, `.gitignore` should add `backend/*.db` and `backend/uploads/` so local runtime artifacts are never committed.
7. **`backend/core/config.py` & `backend/main.py` Follow-up (M2)**: Update defaults to `app_name="OCOR API"`, `database_url="sqlite:///./ocor.db"`, `upload_dir="./uploads"`, and replace `"Better Urban"` / `"demo@betterurban.app"` references.

---

## 3. Milestone Implementation Plan (M1–M5 + E2E Track)

| Milestone | Dependencies | Owned Files (Strict Write Ownership) | Exit Gate |
|---|---|---|---|
| **M1: Git Branch, Audit/Plan, Live Tracker & Theme/Brand Core** | none | `.env.example`, `backend/.env.example`, `docs/IMPLEMENTATION_PLAN.md`, `docs/LIVE_PROGRESS.md`, `public/ocor-logo.jpg`, `public/icon.svg`, `public/manifest.webmanifest`, `lib/theme.ts`, `app/globals.css`, `lib/brand.ts`, `backend/core/brand.py` | Branch `feat/ocor-production-upgrade` created, 55+3 PIL colors exact, Ollama M1 logged, `npm run typecheck` + `npm run build` + Python/asset checks pass, clean commit of 11 files. |
| **M2: Backend API, RBAC, 7-State Workflow, Audit/Quality & Pytest Suite** | M1 | `backend/**` (excluding `backend/core/brand.py` unless coordinated), `backend/tests/**` | `backend/.venv` + `pytest` 100% pass covering signup/login, RBAC, uploads, 7-state lifecycle, 5 categories, tags/GPS/city/ward, duplicates, activity logs, data quality, data sources, notifications, feedback. |
| **M3: Frontend Rebrand, Centralized Theme, API Integration & Citizen Flows** | M1 | `lib/types.ts`, `lib/catalog.ts`, `lib/api.ts`, `lib/store.ts`, `lib/geo.ts`, `lib/format.ts`, `lib/image.ts`, `lib/utils.ts`, `components/*.tsx` (excl. `map/` & `admin/`), citizen/auth/splash/landing `app/` pages (excl. `map/` & `admin/`) | All citizen pages wired to `http://localhost:8000` via Bearer token, zero hardcoded hexes outside `lib/theme.ts`/`globals.css`, `npm run typecheck` + `npm run build` pass. |
| **M4: Live City Map (`/map`), Admin/Officer Console (`/admin`) & Frontend Tests** | M2, M3 | `package.json`, `package-lock.json`, `next.config.ts`, `eslint.config.*`, `vitest.config.*`, `components/map/**`, `app/map/**`, `components/admin/**`, `app/admin/**`, `tests/unit/**`, `docs/LIVE_PROGRESS.md` | Leaflet `/map` (`RED`/`YELLOW`/`GREEN`, wards, filters, popup), role-gated `/admin` (queue/assign, logs, duplicates, quality, sources, feedback, role mgmt), `npm run lint` + Vitest + `npm run build` pass. |
| **E2E Track: Opaque-Box Test Suite (Tiers 1–4)** | M1 (runs parallel with M2–M4) | `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/tests/**`, `TEST_INFRA.md`, `TEST_READY.md` | Independent requirement-driven Playwright + HTTP test suite ready for M5 execution. |
| **M5: Final Milestone — Tiers 1–4 Pass & Tier 5 Adversarial Hardening** | M2, M3, M4, E2E | Fixes across failing modules + `docs/LIVE_PROGRESS.md` final sync | 100% pass of E2E Tiers 1–4 against local backend+frontend, Tier 5 adversarial coverage audit clean, clean git commit on `feat/ocor-production-upgrade`. |

---

## 4. Interface Contracts

### 4.1 Roles & RBAC
- `Role = "citizen" | "officer" | "admin"` (volunteer capability tracked separately via `isVolunteer: boolean`).
- `POST /api/incidents`: any authenticated user (`citizen`, `officer`, `admin`).
- `PATCH /api/incidents/{id}/status`: `officer` or `admin` ONLY (`403` for `citizen`).
- `POST /api/incidents/{id}/close`: reporter (`citizen` owner) when `resolved`, OR `officer`/`admin`.
- `POST /api/incidents/{id}/rate`: reporter only when `resolved` or `closed`.
- `GET /api/admin/incidents`, `GET /api/admin/activity-logs`, `GET /api/admin/data-quality`, `GET /api/admin/data-sources`, `GET /api/admin/feedback`: `officer` or `admin` (`403` for `citizen`).
- `PATCH /api/admin/users/{id}/role`: `admin` ONLY (`403` for `citizen` and `officer`).
- Local Demo Accounts (`DB_BACKEND=local`):
  - Citizen: `demo@ocor.city` / `demo1234` (`role="citizen"`, `isVolunteer=true`; also support legacy `demo@betterurban.app` alias if needed).
  - Officer: `officer@ocor.city` / `officer1234` (`role="officer"`).
  - Admin: `admin@ocor.city` / `admin1234` (`role="admin"`).

### 4.2 Status Flow & Map Color Buckets
1. `submitted` ("Submitted") -> `RED`
2. `under_review` ("Under Review") -> `RED`
3. `verified` ("Verified") -> `RED`
4. `assigned` ("Assigned") -> `YELLOW`
5. `in_progress` ("In Progress") -> `YELLOW`
6. `resolved` ("Resolved") -> `GREEN`
7. `closed` ("Closed") -> `GREEN`

### 4.3 Canonical 5 Categories (`CategoryId`)
1. `road` ("Road")
2. `water` ("Water")
3. `garbage` ("Garbage") *(map legacy `waste` alias cleanly)*
4. `drainage` ("Drainage")
5. `streetlight` ("Streetlight")

### 4.4 Backend Endpoints (`http://localhost:8000`) & Frontend Routes
- Backend: `/health`, `/api/auth/{signup,login,demo,me}`, `/api/cities`, `/api/cities/{cityId}/sectors` (with `wardNumber`), `/api/categories`, `/api/categories/{categoryId}/sub`, `/api/uploads` (served at `/uploads/<filename>`), `/api/vision/{analyze,analyze-public}`, `/api/incidents/check-duplicate`, `/api/incidents`, `/api/incidents/{id}/{status,close,rate,help}`, `/api/notifications`, `/api/volunteer/join`, `/api/leaderboard`, `/api/feedback`, `/api/data-sources`, `/api/admin/{incidents,activity-logs,data-quality,data-sources,feedback,users/{id}/role}`.
- Frontend Routes: `/`, `/onboarding`, `/auth`, `/app`, `/map`, `/report/[category]`, `/report/sent/[id]`, `/track/[id]`, `/my-reports`, `/notifications`, `/volunteer`, `/leaderboard`, `/profile`, `/admin`, `/feedback`, `/landing`.
- Centralized Theme Contract: `lib/theme.ts` (`OCOR_PALETTE`, `LIGHT_SEMANTIC_TOKENS`, `DARK_SEMANTIC_TOKENS`, `THEME_CSS_VARS`, `MAP_STATUS_TOKENS`, `getMapStatusBucket`) + `app/globals.css` (`@theme`, `:root`, `[data-theme="dark"]`, `@theme inline`). Zero hardcoded hex colors in M3/M4 UI components.

---

## 5. Exact PIL-Sampled OCOR Color Palette Reference (55 Swatches + 3 Logo Colors)

- **Core:** `primary`: `#1976d2`, `secondaryAccent`: `#f5a623`, `surfaceLight`: `#f2f9fd`, `surfaceDark`: `#0b3c5d`, `surfaceContainer`: `#ffffff`.
- **Outlines:** `outline`: `#8293a3`, `outlineVariant`: `#d4e4f6`.
- **Success:** `base`: `#3dbe8b`, `10`: `#002114`, `30`: `#005237`, `50`: `#00885e`, `70`: `#40c08d`, `90`: `#7ef9c2`, `95`: `#beffdc`.
- **Error:** `base`: `#e5484d`, `10`: `#410006`, `30`: `#92011a`, `50`: `#db3e44`, `70`: `#ff8986`, `90`: `#ffdad8`, `95`: `#ffedeb`.
- **Neutral Gray:** `base`: `#5b6b7a`, `10`: `#0d1d2a`, `20`: `#22323f`, `30`: `#394856`, `40`: `#50606f`, `50`: `#697988`, `60`: `#8293a3`, `70`: `#9dadbe`, `80`: `#bbc8d9`, `90`: `#d4e4f6`, `95`: `#e7f2ff`.
- **Primary Dark / Light:** `base`: `#1976d2`, `10`: `#001e2d`, `20`: `#00344b`, `30`: `#00466a`, `40`: `#00658c`, `50`: `#0080ae`, `60`: `#57aed8`, `70`: `#51b5ea`, `80`: `#80cfff`, `90`: `#c5e7ff`, `95`: `#e4f3ff`, `primaryLight`: `#4fb3e8`.
- **Secondary:** `base`: `#f5a623`, `10`: `#291800`, `20`: `#452b00`, `30`: `#633f00`, `40`: `#835500`, `50`: `#a46b00`, `60`: `#d19b33`, `70`: `#e89b14`, `80`: `#ffb955`, `90`: `#ffddb4`, `95`: `#ffeedd`.
- **Logo (`public/ocor-logo.jpg`, `669x515`):** `navy`: `#06294e`, `orange`: `#f97514`, `green`: `#509d38`.

---

## 6. Deployment Safety & Verification Gates

- **Never** run `git push`, `netlify`, `railway`, `vercel`, or `firebase` deploy/prod seed commands.
- **M1 Gates:** `npm ci` (if `node_modules/` absent), `npm run typecheck`, `npm run build`, `python -m py_compile backend/core/brand.py`, `core.brand` contract assertion, `public/manifest.webmanifest` + `public/icon.svg` + `public/ocor-logo.jpg` validation.
- **M2–M5 Gates:** `pytest` (M2), `npm run typecheck` + `npm run build` (M3), `npm run lint` + Vitest + `npm run build` (M4), Playwright Tiers 1–4 + Tier 5 adversarial audit (E2E & M5).
