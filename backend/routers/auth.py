import httpx
from fastapi import APIRouter, HTTPException, Depends
from core.auth import get_current_user, verify_password
from core.firebase import get_auth, get_db
from core.config import get_settings
from db.store import is_local, get_store
from models.schemas import SignupRequest, AuthResponse, UserOut

router = APIRouter()

DEMO_EMAIL = "demo@ocor.city"
DEMO_PASSWORD = "demo1234"
OFFICER_EMAIL = "officer@ocor.city"
OFFICER_PASSWORD = "officer1234"
ADMIN_EMAIL = "admin@ocor.city"
ADMIN_PASSWORD = "admin1234"


def _sector_for_city(city_id: str):
    from services.seed_data import SECTORS
    for s in SECTORS:
        if s["cityId"] == city_id and s["name"] == "Sector 18":
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
        "preferredCategories": data.get("preferredCategories", ["road", "waste"]),
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
        token = f"local::{user['id']}"
        return AuthResponse(uid=user["id"], email=user["email"], idToken=token, profile=_profile_from_dict(user))
    # Firebase path
    fb_auth = get_auth()
    db = get_db()
    try:
        user = fb_auth.create_user(email=body.email, password=body.password, display_name=body.name)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Could not create account: {exc}")
    sector = _sector_for_city(body.cityId)
    from datetime import datetime, timezone
    profile = {
        "name": body.name.strip(), "email": body.email.strip().lower(), "phone": "",
        "cityId": body.cityId, "sectorId": sector["id"], "stars": 10, "helped": 0,
        "isVolunteer": False, "skills": [], "preferredCategories": ["road", "waste"],
        "alertsEnabled": True, "alertRadiusKm": 3, "role": "citizen",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db.collection("users").document(user.uid).set(profile)
    db.collection("notifications").add({
        "userId": user.uid, "type": "system",
        "title": "Welcome to OCOR",
        "body": "You start with 10 stars. Report your first issue to activate your 3 km alert radius.",
        "createdAt": profile["createdAt"], "read": False,
    })
    # Get ID token via REST
    from core.config import get_settings
    _s = get_settings()
    id_token = None
    try:
        import httpx
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
    # Firebase path
    from core.config import get_settings
    settings = get_settings()
    if not settings.firebase_project_id:
        raise HTTPException(500, "FIREBASE_PROJECT_ID not configured")
    import httpx
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
            store.update_user(user["id"], {"stars": 340, "helped": 6, "isVolunteer": True,
                                          "skills": ["Traffic Support", "First Aid"], "sectorId": "metro-s18"})
            user = store.get_user(user["id"])
        token = f"local::{user['id']}"
        return AuthResponse(uid=user["id"], email=user["email"], idToken=token, profile=_profile_from_dict(user))
    # Firebase path
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
            "skills": ["Traffic Support", "First Aid"], "preferredCategories": ["road", "waste"],
            "alertsEnabled": True, "alertRadiusKm": 3, "role": "citizen",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        db.collection("users").document(uid).set(profile)
    snap = db.collection("users").document(uid).get()
    profile = snap.to_dict() or {}
    # Get ID token via REST
    from core.config import get_settings
    _s = get_settings()
    id_token = None
    try:
        import httpx
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


@router.post("/bootstrap")
def bootstrap_accounts():
    """Create demo/officer/admin accounts if they don't exist. Run once."""
    if is_local():
        store = get_store()
        # local store already seeds these on first run
        return {"ok": True, "mode": "local", "message": "Local DB already seeded with demo/officer/admin accounts."}
    fb_auth = get_auth()
    db = get_db()
    accounts = [
        ("demo@ocor.city", "demo1234", "Riya Sharma", "citizen", 340, 6, True, ["Traffic Support", "First Aid"], "metro-s18"),
        ("officer@ocor.city", "officer1234", "Vikram Mehta", "officer", 120, 18, False, ["Field Inspection"], "metro-s5"),
        ("admin@ocor.city", "admin1234", "Ananya Verma", "admin", 500, 42, False, ["Operations", "Dispatch"], "metro-s1"),
    ]
    created = []
    from datetime import datetime, timezone
    for email, password, name, role, stars, helped, is_vol, skills, sector in accounts:
        try:
            user = fb_auth.get_user_by_email(email)
        except Exception:  # noqa: BLE001
            user = fb_auth.create_user(email=email, password=password, display_name=name)
        db.collection("users").document(user.uid).set({
            "name": name, "email": email, "phone": "", "cityId": "metro",
            "sectorId": sector, "stars": stars, "helped": helped,
            "isVolunteer": is_vol, "skills": skills,
            "preferredCategories": ["road", "waste"], "alertsEnabled": True,
            "alertRadiusKm": 3 if role == "citizen" else (5 if role == "officer" else 10),
            "role": role, "createdAt": datetime.now(timezone.utc).isoformat(),
        }, merge=True)
        created.append({"email": email, "role": role, "uid": user.uid})
    return {"ok": True, "mode": "firebase", "accounts": created}


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user
