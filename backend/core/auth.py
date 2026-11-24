from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.firebase import get_auth, get_db

bearer = HTTPBearer(auto_error=False)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = credentials.credentials
    # Local mode: token is "local::<uid>"
    if token.startswith("local::"):
        uid = token.split("::", 1)[1]
        from db.store import get_store
        store = get_store()
        profile = store.get_user(uid)
        if not profile:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown user")
        profile.pop("password", None)
        return profile
    # Firebase mode
    try:
        from firebase_admin import auth as fb_auth
        decoded = fb_auth.verify_id_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has no uid")
    from core.firebase import get_db
    db = get_db()
    snap = db.collection("users").document(uid).get()
    profile = snap.to_dict() if snap.exists else None
    if profile is None:
        profile = {
            "id": uid,
            "name": decoded.get("name") or decoded.get("email", "").split("@")[0],
            "email": decoded.get("email", ""),
            "phone": decoded.get("phone_number", ""),
            "cityId": "metro",
            "sectorId": None,
            "stars": 10,
            "helped": 0,
            "isVolunteer": False,
            "skills": [],
            "preferredCategories": ["road", "waste"],
            "alertsEnabled": True,
            "alertRadiusKm": 3,
            "role": "citizen",
            "createdAt": None,
        }
        db.collection("users").document(uid).set(profile)
    profile["id"] = uid
    return profile


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user
