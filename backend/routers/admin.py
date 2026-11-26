from fastapi import APIRouter, Depends, HTTPException, Query
from core.auth import require_admin, require_officer_or_admin
from core.firebase import get_db
from db.store import is_local, get_store
from models.schemas import RoleUpdate
from services.data_quality import audit_data_quality
from services.duplicates import find_duplicates
from services.seed_data import DATA_SOURCES

router = APIRouter()


@router.get("/incidents")
def admin_list_incidents(
    status: str = Query(None),
    cityId: str = Query(None),
    categoryId: str = Query(None),
    wardNumber: int = Query(None),
    search: str = Query(None),
    user=Depends(require_officer_or_admin),
):
    if is_local():
        return get_store().list_incidents(
            city_id=cityId,
            category_id=categoryId,
            status=status,
            ward_number=wardNumber,
            search=search,
            limit=300,
        )
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


@router.get("/activity-logs")
def admin_activity_logs(limit: int = Query(100), user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().list_activity_logs(limit=limit)
    return []


@router.get("/data-quality")
def admin_data_quality(user=Depends(require_officer_or_admin)):
    if is_local():
        store = get_store()
        incidents = store.list_incidents(limit=1000)
        users = store.list_users()
        return audit_data_quality(incidents, users)
    return {"totalIncidents": 0, "healthyIncidents": 0, "flaggedIncidents": 0, "qualityScore": 100.0, "summary": {}, "flaggedRecords": []}


@router.get("/data-sources")
def admin_data_sources(user=Depends(require_officer_or_admin)):
    return DATA_SOURCES


@router.get("/feedback")
def admin_feedback(limit: int = Query(100), user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().list_feedback(limit=limit)
    return []


@router.get("/duplicates")
def admin_duplicates(user=Depends(require_officer_or_admin)):
    if is_local():
        store = get_store()
        incidents = store.list_incidents(limit=500)
        clusters = []
        seen = set()
        for inc in incidents:
            if inc["id"] in seen:
                continue
            matches = [
                m
                for m in find_duplicates(
                    incidents, inc["lat"], inc["lng"], inc["categoryId"], city_id=inc["cityId"]
                )
                if m["id"] != inc["id"]
            ]
            if matches:
                seen.add(inc["id"])
                for m in matches:
                    seen.add(m["id"])
                clusters.append({
                    "primary": {
                        "id": inc["id"],
                        "code": inc["code"],
                        "title": inc["title"],
                        "categoryId": inc["categoryId"],
                        "wardNumber": inc.get("wardNumber"),
                        "status": inc["status"],
                    },
                    "duplicates": matches,
                })
        return clusters
    return []


@router.get("/users")
def admin_list_users(cityId: str = Query(None), user=Depends(require_officer_or_admin)):
    if is_local():
        return get_store().list_users(city_id=cityId)
    return []


@router.patch("/users/{user_id}/role")
def admin_update_role(user_id: str, body: RoleUpdate, user=Depends(require_admin)):
    if is_local():
        updated = get_store().update_user_role(user_id, body.role, actor=user)
        if not updated:
            raise HTTPException(404, "User not found")
        updated.pop("password", None)
        return updated
    raise HTTPException(501, "Role update not implemented for Firestore")
