import hashlib
import hmac
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.firebase import get_db

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"pbkdf2${salt}${dk}"


def verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    if stored.startswith("pbkdf2$"):
        parts = stored.split("$")
        if len(parts) != 3:
            return False
        _, salt, expected = parts
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
        return hmac.compare_digest(dk, expected)
    return hmac.compare_digest(password, stored)


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
            "preferredCategories": ["road", "garbage"],
            "alertsEnabled": True,
            "alertRadiusKm": 3,
            "role": "citizen",
            "createdAt": None,
        }
        db.collection("users").document(uid).set(profile)
    profile["id"] = uid
    return profile


def require_roles(*allowed_roles: str):
    async def _guard(user=Depends(get_current_user)):
        role = user.get("role", "citizen")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role in {', '.join(allowed_roles)}",
            )
        return user

    return _guard


require_admin = require_roles("admin")
require_officer_or_admin = require_roles("officer", "admin")
