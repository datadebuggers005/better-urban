from fastapi import APIRouter, Depends, Query
from core.auth import get_current_user, require_admin
from db.store import is_local, get_store
from core.firebase import get_db

router = APIRouter()


@router.get("/incidents")
def admin_list_incidents(status: str = Query(None), cityId: str = Query(None), user=Depends(require_admin)):
    if is_local():
        items = get_store().list_incidents(city_id=cityId, status=status, limit=200)
        return items
    db = get_db()
    q = db.collection("incidents")
    if cityId:
        q = q.where("cityId", "==", cityId)
    if status:
        q = q.where("status", "==", status)
    docs = q.stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    return out
