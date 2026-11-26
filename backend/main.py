import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import get_settings
from core.brand import brand
from core.firebase import init_firebase

from routers import (
    auth as auth_router,
    cities as cities_router,
    users as users_router,
    incidents as incidents_router,
    notifications as notifications_router,
    leaderboard as leaderboard_router,
    volunteer as volunteer_router,
    admin as admin_router,
    vision as vision_router,
    feedback as feedback_router,
    uploads as uploads_router,
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=f"Backend API for {brand.full_name} — civic issue reporting, live mapping & ward dispatch.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.on_event("startup")
def on_startup():
    try:
        init_firebase()
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] Firebase init skipped: {exc}")


app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(cities_router.router, prefix="/api", tags=["cities"])
app.include_router(users_router.router, prefix="/api", tags=["users"])
app.include_router(incidents_router.router, prefix="/api", tags=["incidents"])
app.include_router(notifications_router.router, prefix="/api", tags=["notifications"])
app.include_router(leaderboard_router.router, prefix="/api", tags=["leaderboard"])
app.include_router(volunteer_router.router, prefix="/api", tags=["volunteer"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])
app.include_router(vision_router.router, prefix="/api", tags=["vision"])
app.include_router(feedback_router.router, prefix="/api", tags=["feedback"])
app.include_router(uploads_router.router, prefix="/api", tags=["uploads"])


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name, "brand": brand.full_name, "version": settings.app_version}


@app.get("/api/debug/db")
def debug_db():
    s = get_settings()
    if s.db_backend == "local":
        from db.models import SessionLocal, User, Incident, Notification, init_db
        db = SessionLocal()
        try:
            init_db()
            return {
                "backend": s.db_backend,
                "database_url": s.database_url,
                "counts": {
                    "users": db.query(User).count(),
                    "incidents": db.query(Incident).count(),
                    "notifications": db.query(Notification).count(),
                },
                "demo_user": {"email": "demo@ocor.city", "password": "demo1234"},
            }
        finally:
            db.close()
    try:
        db = init_firebase()
        from core.firebase import get_db
        fdb = get_db()
        users = len(list(fdb.collection("users").stream()))
        incidents = len(list(fdb.collection("incidents").stream()))
        notifications = len(list(fdb.collection("notifications").stream()))
        return {
            "backend": s.db_backend,
            "counts": {"users": users, "incidents": incidents, "notifications": notifications},
            "demo_user": {"email": "demo@ocor.city", "password": "demo1234"},
        }
    except Exception as exc:  # noqa: BLE001
        return {"backend": s.db_backend, "error": str(exc)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
