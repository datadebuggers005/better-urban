# Backend Features — Better Urban API

FastAPI service powering the Better Urban frontend. Mirrors the frontend data model (`lib/types.ts`) and reuses the same city/sector/category seed.

## Feature groups

### 1. Authentication (`/api/auth`)
- Email + password signup with profile creation in Firestore.
- Email + password login via Firebase Identity Toolkit (returns Firebase ID token).
- Demo citizen login (auto-provisions `demo@betterurban.app`).
- `/me` returns the authenticated user's profile.
- Bearer-token auth middleware verifying Firebase ID tokens (auto-provisions first-time users).

### 2. Users (`/api/users`)
- Get / update profile (name, phone, city, sector, prefs, volunteer status).
- List notifications for a user.
- Mark all notifications read.

### 3. Cities & Sectors (`/api/cities`, `/api/categories`)
- List 5 cities, sectors per city, categories and sub-categories.
- Static seed data (mirrors frontend).

### 4. Incidents / Tickets (`/api/incidents`)
- List with filters (city, status, reporter).
- Get by id.
- Create report: computes 3 km audience via haversine over seeded citizen coordinates, generates unique code, creates notifications, awards stars.
- Update status (admin): moves ticket through workflow, notifies reporter.
- Rate a resolved ticket (reporter only, awards stars).
- Volunteer accepts an alert (awards stars + helped count).

### 5. Notifications (`/api/notifications`)
- List per user, mark read, mark all read.

### 6. Leaderboard (`/api/leaderboard`)
- City or global top responders by stars.

### 7. Volunteer (`/api/volunteer`)
- Join as volunteer (awards 15 stars).

### 8. Admin (`/api/admin`)
- List incidents for the ops console (admin role required).

## Data model (Firestore collections)

- `users/{uid}` — profile, stars, skills, prefs.
- `incidents/{id}` — ticket (code, status, events, rating, ...).
- `notifications/{id}` — per-user alerts.
- `cities/{id}`, `sectors/{id}` — static config (seeded).

## Security

- Bearer token = Firebase ID token, verified by Admin SDK.
- Admin routes require `role == "admin"` (set via custom claim or Firestore field).
- Firestore security rules to be added before production.

## Status

- Scaffold complete. Needs: Firebase project credentials, security rules, and frontend swap from mock store to these endpoints.
- Estimated integration: 3-5 days (solo).

## 9. Image analysis / auto-tagging (`/api/vision`)
- Upload an image → returns EXIF GPS (lat/lng), reverse-geocoded location (Nominatim, free), auto-tags, suggested category.
- Auto-tagging via Hugging Face Inference API (CLIP zero-shot) if `HF_TOKEN` set.
- Fallback to Google Cloud Vision (label + landmark detection) if `GOOGLE_VISION_API_KEY` set.
- Maps detected labels to our 8 category ids.
- Two endpoints: `/api/vision/analyze` (auth) and `/api/vision/analyze-public` (demo).

## Where to find deployed models / APIs (no training needed)

| Need | Provider | Free tier | Key env var |
|---|---|---|---|
| Label/landmark detection | Google Cloud Vision | 1000 units/month free | `GOOGLE_VISION_API_KEY` |
| Zero-shot image classification | Hugging Face Inference API | Free (rate-limited) | `HF_TOKEN` |
| Object detection | Roboflow Hosted API | Free tier | `ROBOFLOW_API_KEY` |
| Reverse geocoding | OpenStreetMap Nominatim | Free (1 req/s) | none |
| EXIF GPS extraction | Pillow (local) | Free | none |
| Image captioning | Hugging Face (BLIP) | Free | `HF_TOKEN` |

## Auto-tagging location from photo
1. Extract EXIF GPS with Pillow (`_getexif` -> GPSInfo).
2. If GPS present -> reverse geocode via Nominatim -> city/state/country.
3. If no GPS -> use landmark detection (Google Vision) or ask user to drop pin.

## Frontend integration
- In report flow, after photo upload, call `/api/vision/analyze-public` (or analyze) -> pre-fill category, sub-issue, severity, and landmark text. User confirms before submit.
