from fastapi import APIRouter, Depends, Query, HTTPException
from core.auth import get_current_user
from core.firebase import get_db
from db.store import is_local, get_store

router = APIRouter()


@router.get("/notifications")
def list_notifications(userId: str = Query(...), user=Depends(get_current_user)):
    if user["id"] != userId and user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    if is_local():
        return get_store().list_notifications(userId)
    db = get_db()
    docs = db.collection("notifications").where("userId", "==", userId).stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    out.sort(key=lambda n: n.get("createdAt", ""), reverse=True)
    return out


@router.patch("/notifications/{notif_id}/read")
def mark_read(notif_id: str, user=Depends(get_current_user)):
    if is_local():
        ok = get_store().mark_read(notif_id, user["id"])
        if not ok:
            raise HTTPException(404, "Not found")
        return {"ok": True}
    db = get_db()
    ref = db.collection("notifications").document(notif_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(404, "Not found")
    if snap.to_dict().get("userId") != user["id"]:
        raise HTTPException(403, "Forbidden")
    ref.update({"read": True})
    return {"ok": True}


@router.post("/notifications/read-all")
def mark_all_read(userId: str = Query(...), user=Depends(get_current_user)):
    if user["id"] != userId:
        raise HTTPException(403, "Forbidden")
    if is_local():
        get_store().mark_all_read(userId)
        return {"ok": True}
    db = get_db()
    docs = db.collection("notifications").where("userId", "==", userId).where("read", "==", False).stream()
    batch = db.batch()
    for d in docs:
        batch.update(d.reference, {"read": True})
    batch.commit()
    return {"ok": True}
