from fastapi import APIRouter, Query
from db.store import is_local, get_store
from core.firebase import get_db

router = APIRouter()


@router.get("/leaderboard")
def leaderboard(cityId: str = Query(None), scope: str = Query("city")):
    if is_local():
        return get_store().leaderboard(cityId if scope == "city" else None)
    db = get_db()
    q = db.collection("users")
    if scope == "city" and cityId:
        q = q.where("cityId", "==", cityId)
    docs = q.stream()
    users = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        users.append(x)
    users.sort(key=lambda u: u.get("stars", 0), reverse=True)
    return users[:50]
