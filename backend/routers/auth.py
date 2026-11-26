import httpx
from fastapi import APIRouter, HTTPException, Depends
from core.firebase import get_auth, get_db
from core.auth import get_current_user, verify_password
from db.store import get_store, is_local
from models.schemas import SignupRequest, AuthResponse, UserOut

router = APIRouter()

DEMO_EMAIL = "demo@ocor.city"
DEMO_PASSWORD = "demo1234"


def _sector_for_city(city_id: str):
    from services.seed_data import SECTORS
    for s in SECTORS:
        if s["cityId"] == city_id and s.get("wardNumber") == 18:
            return s
    for s in SECTORS:
        if s["cityId"] == city_id:
            return s
    return SECTORS[0]


def _profile_from_dict(data: dict) -> dict:
    return {
        "id": data.get("id"),
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "cityId": data.get("cityId", "metro"),
        "sectorId": data.get("sectorId"),
        "stars": data.get("stars", 10),
        "helped": data.get("helped", 0),
        "isVolunteer": data.get("isVolunteer", False),
        "skills": data.get("skills", []),
        "preferredCategories": data.get("preferredCategories", ["road", "garbage"]),
        "alertsEnabled": data.get("alertsEnabled", True),
        "alertRadiusKm": data.get("alertRadiusKm", 3),
        "role": data.get("role", "citizen"),
        "createdAt": data.get("createdAt"),
    }


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest):
    if is_local():
        store = get_store()
        existing = store.get_user_by_email(body.email)
        if existing:
            raise HTTPException(400, "An account with this email already exists. Sign in instead.")
        if len(body.password) < 6:
            raise HTTPException(400, "Use at least 6 characters for your password.")
        user = store.create_user(body.name, body.email, body.password, body.cityId)
        store.add_notification(
            user["id"],
            "Welcome to OCOR — Our City, Our Responsibility",
            "You start with 10 civic stars. Report an issue to help keep your ward clean and safe.",
            ntype="system",
        )
        token = f"local::{user['id']}"
        return AuthResponse(uid=user["id"], email=user["email"], idToken=token, profile=_profile_from_dict(user))

    fb_auth = get_auth()
    db = get_db()
    try:
        user = fb_auth.create_user(email=body.email, password=body.password, display_name=body.name)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Could not create account: {exc}")
    sector = _sector_for_city(body.cityId)
    from datetime import datetime, timezone
    profile = {
        "name": body.name.strip(),
        "email": body.email.strip().lower(),
        "phone": "",
        "cityId": body.cityId,
        "sectorId": sector["id"],
        "stars": 10,
        "helped": 0,
        "isVolunteer": False,
        "skills": [],
        "preferredCategories": ["road", "garbage"],
        "alertsEnabled": True,
        "alertRadiusKm": 3,
        "role": "citizen",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db.collection("users").document(user.uid).set(profile)
    db.collection("notifications").add({
        "userId": user.uid,
        "type": "system",
        "title": "Welcome to OCOR — Our City, Our Responsibility",
        "body": "You start with 10 stars. Report your first issue to activate your ward alert radius.",
        "createdAt": profile["createdAt"],
        "read": False,
    })
    from core.config import get_settings as _gs
    _s = _gs()
    id_token = None
    try:
        with httpx.Client(timeout=10) as _c:
            _r = _c.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={_s.firebase_web_api_key}",
                json={"email": body.email, "password": body.password, "returnSecureToken": True},
            )
        if _r.status_code == 200:
            id_token = _r.json().get("idToken")
    except Exception:  # noqa: BLE001
        pass
    if not id_token:
        id_token = fb_auth.create_custom_token(user.uid).decode()
    return AuthResponse(uid=user.uid, email=user.email, idToken=id_token, profile=_profile_from_dict({**profile, "id": user.uid}))


@router.post("/login", response_model=AuthResponse)
async def login(body: dict):
    email = body.get("email", "")
    password = body.get("password", "")
    if is_local():
        store = get_store()
        user = store.get_user_by_email(email)
        if not user or not verify_password(password, user.get("password", "")):
            raise HTTPException(401, "Invalid email or password")
        token = f"local::{user['id']}"
        return AuthResponse(uid=user["id"], email=user["email"], idToken=token, profile=_profile_from_dict(user))

    from core.config import get_settings
    settings = get_settings()
    if not settings.firebase_project_id:
        raise HTTPException(500, "FIREBASE_PROJECT_ID not configured")
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.firebase_web_api_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={"email": email, "password": password, "returnSecureToken": True})
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid email or password")
    data = resp.json()
    uid = data["localId"]
    id_token = data["idToken"]
    db = get_db()
    snap = db.collection("users").document(uid).get()
    profile = snap.to_dict() if snap.exists else {}
    profile.setdefault("email", email)
    profile["id"] = uid
    return AuthResponse(uid=uid, email=email, idToken=id_token, profile=_profile_from_dict(profile))


@router.post("/demo", response_model=AuthResponse)
def demo_login():
    if is_local():
        store = get_store()
        user = store.get_user_by_email(DEMO_EMAIL)
        if not user:
            user = store.create_user("Riya Sharma", DEMO_EMAIL, DEMO_PASSWORD, "metro")
            store.update_user(user["id"], {
                "stars": 340,
                "helped": 6,
                "isVolunteer": True,
                "skills": ["Traffic Support", "First Aid"],
                "sectorId": "metro-s18",
            })
            user = store.get_user(user["id"])
        token = f"local::{user['id']}"
        return AuthResponse(uid=user["id"], email=user["email"], idToken=token, profile=_profile_from_dict(user))

    fb_auth = get_auth()
    db = get_db()
    try:
        user = fb_auth.get_user_by_email(DEMO_EMAIL)
    except Exception:  # noqa: BLE001
        user = fb_auth.create_user(email=DEMO_EMAIL, password=DEMO_PASSWORD, display_name="Riya Sharma")
    uid = user.uid
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        sector = _sector_for_city("metro")
        from datetime import datetime, timezone
        profile = {
            "name": "Riya Sharma", "email": DEMO_EMAIL, "phone": "", "cityId": "metro",
            "sectorId": sector["id"], "stars": 340, "helped": 6, "isVolunteer": True,
            "skills": ["Traffic Support", "First Aid"], "preferredCategories": ["road", "garbage"],
            "alertsEnabled": True, "alertRadiusKm": 3, "role": "citizen",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        db.collection("users").document(uid).set(profile)
    snap = db.collection("users").document(uid).get()
    profile = snap.to_dict() or {}
    from core.config import get_settings as _gs
    _s = _gs()
    id_token = None
    try:
        with httpx.Client(timeout=10) as _c:
            _r = _c.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={_s.firebase_web_api_key}",
                json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD, "returnSecureToken": True},
            )
        if _r.status_code == 200:
            id_token = _r.json().get("idToken")
    except Exception:  # noqa: BLE001
        pass
    if not id_token:
        id_token = fb_auth.create_custom_token(uid).decode()
    return AuthResponse(uid=uid, email=DEMO_EMAIL, idToken=id_token, profile=_profile_from_dict({**profile, "id": uid}))


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user
