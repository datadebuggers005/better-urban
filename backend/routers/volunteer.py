from fastapi import APIRouter, Depends
from core.auth import get_current_user
from db.store import is_local, get_store
from core.firebase import get_db

router = APIRouter()


@router.post("/volunteer/join")
def join_volunteer(user=Depends(get_current_user)):
    if is_local():
        u = get_store().join_volunteer(user["id"])
        if not u:
            from fastapi import HTTPException
            raise HTTPException(404, "User not found")
        u.pop("password", None)
        return u
    db = get_db()
    ref = db.collection("users").document(user["id"])
    ref.update({"isVolunteer": True, "stars": user.get("stars", 0) + 15})
    return {"ok": True, "stars": user.get("stars", 0) + 15}
