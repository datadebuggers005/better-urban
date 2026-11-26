from fastapi import APIRouter, Depends, Query, HTTPException
from core.auth import get_current_user, require_officer_or_admin
from core.firebase import get_db
from db.store import is_local, get_store

router = APIRouter()


@router.get("/incidents")
def admin_list_incidents(status: str = Query(None), cityId: str = Query(None), user=Depends(require_officer_or_admin)):
    if is_local():
        items = get_store().list_incidents(city_id=cityId, status=status, limit=200)
        return items
    db = get_db()
    # Single where clause to avoid composite index requirements.
    q = db.collection("incidents")
    if cityId:
        q = q.where("cityId", "==", cityId)
    elif status:
        q = q.where("status", "==", status)
    docs = q.stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        if cityId and status and x.get("status") != status:
            continue
        if not cityId and status and x.get("status") != status:
            continue
        out.append(x)
    return out


@router.get("/activity-logs")
def activity_logs(limit: int = Query(50), user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().activity_logs(limit=limit)
    db = get_db()
    docs = db.collection("activityLogs").order_by("createdAt", direction="DESCENDING").limit(limit).stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    return out


@router.get("/data-quality")
def data_quality(user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().data_quality()
    from services.data_quality import compute_data_quality
    db = get_db()
    return compute_data_quality(db)


@router.get("/data-sources")
def data_sources(user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().data_sources()
    from services.data_quality import data_sources as ds
    return ds()


@router.get("/duplicates")
def duplicates(user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().duplicates()
    from services.duplicates import find_all_duplicates
    db = get_db()
    return find_all_duplicates(db)


@router.get("/users")
def list_users(user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().list_users()
    db = get_db()
    docs = db.collection("users").stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        x.pop("password", None)
        out.append(x)
    return out


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, body: dict, user=Depends(require_officer_or_admin)):
    if user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(403, "Only admins can change roles")
    if is_local():
        store = get_store()
        u = store.update_user_role(user_id, body.get("role", "citizen"), actor=user)
        if not u:
            from fastapi import HTTPException
            raise HTTPException(404, "User not found")
        u.pop("password", None)
        return u
    db = get_db()
    ref = db.collection("users").document(user_id)
    snap = ref.get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found")
    ref.update({"role": body.get("role", "citizen")})
    data = snap.to_dict()
    data["id"] = user_id
    data["role"] = body.get("role", "citizen")
    return data


@router.get("/feedback")
def admin_feedback(user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().admin_feedback()
    db = get_db()
    docs = db.collection("feedback").stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    out.sort(key=lambda f: f.get("createdAt", ""), reverse=True)
    return out
