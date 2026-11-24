from fastapi import APIRouter, HTTPException, Depends, Query
from core.auth import get_current_user
from core.firebase import get_db
from core.config import get_settings
from db.store import is_local, get_store
from models.schemas import UserUpdate

router = APIRouter()


@router.get("/users/{user_id}")
def get_user(user_id: str):
    if is_local():
        store = get_store()
        u = store.get_user(user_id)
        if not u:
            raise HTTPException(404, "User not found")
        u.pop("password", None)
        return u
    db = get_db()
    snap = db.collection("users").document(user_id).get()
    if not snap.exists:
        raise HTTPException(404, "User not found")
    data = snap.to_dict()
    data["id"] = user_id
    return data


@router.patch("/users/{user_id}")
def update_user(user_id: str, body: UserUpdate, user=Depends(get_current_user)):
    if user["id"] != user_id and user.get("role") != "admin":
        raise HTTPException(403, "Cannot edit another user")
    updates = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if is_local():
        store = get_store()
        u = store.update_user(user_id, updates)
        if not u:
            raise HTTPException(404, "User not found")
        u.pop("password", None)
        return u
    db = get_db()
    if updates:
        db.collection("users").document(user_id).update(updates)
    snap = db.collection("users").document(user_id).get()
    data = snap.to_dict() or {}
    data["id"] = user_id
    return data


@router.get("/users/{user_id}/notifications")
def list_notifications(user_id: str, user=Depends(get_current_user)):
    if user["id"] != user_id and user.get("role") != "admin":
        raise HTTPException(403, "Cannot read another user's notifications")
    if is_local():
        return get_store().list_notifications(user_id)
    db = get_db()
    docs = db.collection("notifications").where("userId", "==", user_id).order_by("createdAt", direction="DESCENDING").stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    return out


@router.post("/users/{user_id}/notifications/read-all")
def mark_all_read(user_id: str, user=Depends(get_current_user)):
    if user["id"] != user_id:
        raise HTTPException(403, "Forbidden")
    if is_local():
        get_store().mark_all_read(user_id)
        return {"ok": True}
    db = get_db()
    docs = db.collection("notifications").where("userId", "==", user_id).where("read", "==", False).stream()
    batch = db.batch()
    for d in docs:
        batch.update(d.reference, {"read": True})
    batch.commit()
    return {"ok": True}
