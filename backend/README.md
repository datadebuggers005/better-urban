# Better Urban — Backend (FastAPI + Firebase)

REST API for the Better Urban civic dispatch network. Frontend (Next.js) calls these endpoints; Firebase handles auth, Firestore holds data, Storage holds photos.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in Firebase credentials
# Place your Firebase service account JSON at ./serviceAccountKey.json
uvicorn main:app --reload --port 8000
```

> **Python 3.10+ recommended.** firebase-admin pulls in `cryptography`, which has DLL issues on Python 3.9 (Windows). Health check (`/health`) works without credentials.

Open http://localhost:8000/docs for the interactive Swagger UI.

## Firebase setup

1. Create a Firebase project.
2. Enable **Authentication → Email/Password**.
3. Create **Firestore** database.
4. Create **Storage** bucket.
5. Project Settings → Service accounts → Generate new private key → save as `serviceAccountKey.json`.
6. Project Settings → General → Web API Key → put in `.env` as `FIREBASE_WEB_API_KEY`.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | — | Health check |
| POST | /api/auth/signup | — | Create account |
| POST | /api/auth/login | — | Sign in (email+password) |
| POST | /api/auth/demo | — | Demo citizen login |
| GET | /api/auth/me | Bearer | Current user |
| GET | /api/cities | — | List cities |
| GET | /api/cities/{id}/sectors | — | Sectors for a city |
| GET | /api/categories | — | Categories + sub-categories |
| GET | /api/users/{id} | — | User profile |
| PATCH | /api/users/{id} | Bearer (self/admin) | Update profile |
| GET | /api/users/{id}/notifications | Bearer | User notifications |
| POST | /api/users/{id}/notifications/read-all | Bearer | Mark all read |
| GET | /api/incidents | — | List (filter by city/status/reporter) |
| GET | /api/incidents/{id} | — | Ticket detail |
| POST | /api/incidents | Bearer | Create report (fans out 3 km alert) |
| PATCH | /api/incidents/{id}/status | Bearer (admin) | Move ticket through workflow |
| POST | /api/incidents/{id}/rate | Bearer (reporter) | Rate a resolved ticket |
| POST | /api/incidents/{id}/help | Bearer | Volunteer accepts alert |
| GET | /api/leaderboard | — | City/global top responders |
| POST | /api/volunteer/join | Bearer | Become a volunteer |
| POST | /api/vision/analyze | Bearer | Image analysis: EXIF GPS, reverse geocode, auto-tags, suggested category |
| POST | /api/vision/analyze-public | — | Same as above, no auth (demo/report flow) |

## Frontend integration

Point the Next.js app at this backend by setting `NEXT_PUBLIC_API_BASE=http://localhost:8000` and replacing the mock calls in `lib/store.ts` with `fetch()` to these endpoints. Keep Zustand as a UI cache.
