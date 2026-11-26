import random
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from core.auth import get_current_user, require_officer_or_admin
from core.firebase import get_db
from db.store import is_local, get_store
from models.schemas import IncidentCreate, StatusUpdate, RatingInput, DuplicateCheckRequest
from services.duplicates import find_duplicates
from services.seed_data import (
    CITIES,
    STATUS_META,
    DEMO_NGOS,
    orgs_for_city,
    normalize_category_id,
    normalize_status,
    ward_for_sector,
)
from utils.geo import haversine_km

router = APIRouter()


def _city(city_id):
    return next((c for c in CITIES if c["id"] == city_id), CITIES[0])


def _uid(prefix="id"):
    return f"{prefix}_{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))}"


@router.get("/incidents")
def list_incidents(cityId: str = Query(None), status: str = Query(None),
                   reporterId: str = Query(None), limit: int = Query(100)):
    if is_local():
        store = get_store()
        items = store.list_incidents(city_id=cityId, status=status, reporter_id=reporterId, limit=limit)
        return items
    db = get_db()
    # Single where clause to avoid Firestore composite index requirements.
    q = db.collection("incidents")
    if cityId:
        q = q.where("cityId", "==", cityId)
    elif status:
        q = q.where("status", "==", normalize_status(status))
    elif reporterId:
        q = q.where("reporterId", "==", reporterId)
    docs = q.limit(limit * 4 if (status or reporterId) else limit).stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        if cityId and status and x.get("status") != normalize_status(status):
            continue
        if cityId and reporterId and x.get("reporterId") != reporterId:
            continue
        if not cityId and status and x.get("status") != normalize_status(status):
            continue
        if not cityId and reporterId and x.get("reporterId") != reporterId:
            continue
        out.append(x)
    return out[:limit]


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    if is_local():
        store = get_store()
        inc = store.get_incident(incident_id)
        if not inc:
            from fastapi import HTTPException
            raise HTTPException(404, "Incident not found")
        return inc
    db = get_db()
    snap = db.collection("incidents").document(incident_id).get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "Incident not found")
    data = snap.to_dict()
    data["id"] = snap.id
    return data


@router.post("/incidents")
def create_incident(body: IncidentCreate, user=Depends(get_current_user)):
    if is_local():
        store = get_store()
        data = body.model_dump()
        data["title"] = body.title or body.subCategoryId
        return store.create_incident(data, user)

    db = get_db()
    city = _city(body.cityId or user.get("cityId", "metro"))
    point = {"lat": body.lat, "lng": body.lng}
    audience = 0
    for u in db.collection("users").where("cityId", "==", city["id"]).stream():
        ud = u.to_dict()
        from services.seed_data import SECTORS
        us = next((s for s in SECTORS if s["id"] == ud.get("sectorId")), None)
        if us and haversine_km(us, point) <= 3:
            audience += 1
    audience = max(audience, 1)
    used = {d.to_dict().get("code") for d in db.collection("incidents").stream()}
    code = None
    while code is None or code in used:
        code = f"OC-{random.randint(2000, 8999)}"
    now = datetime.now(timezone.utc).isoformat()
    ward_num = body.wardNumber if hasattr(body, "wardNumber") else None
    if ward_num is None:
        ward_num = ward_for_sector(body.sectorId)
    incident = {
        "code": code,
        "cityId": city["id"],
        "sectorId": body.sectorId,
        "wardNumber": ward_num,
        "categoryId": normalize_category_id(body.categoryId),
        "subCategoryId": body.subCategoryId,
        "title": body.title,
        "note": body.note,
        "lat": body.lat,
        "lng": body.lng,
        "landmark": body.landmark,
        "photoUrl": body.photoUrl,
        "tags": getattr(body, "tags", []),
        "isAnonymous": body.isAnonymous,
        "reporterId": None if body.isAnonymous else user["id"],
        "reporterName": "Anonymous citizen" if body.isAnonymous else user["name"],
        "status": "submitted",
        "mapColor": "RED",
        "severity": body.severity,
        "radiusKm": 3.0,
        "alertedCount": audience,
        "notifiedOrgs": orgs_for_city(city["name"]),
        "notifiedNgos": DEMO_NGOS,
        "events": [
            {
                "id": _uid("ev"),
                "kind": "submitted",
                "label": "Submitted",
                "detail": f"Complaint logged in {city['name']} (Ward {ward_num}).",
                "at": now,
            }
        ],
        "helpedBy": [],
        "assignedTo": None,
        "assignedToName": None,
        "duplicateOf": None,
        "createdAt": now,
        "resolvedAt": None,
        "closedAt": None,
        "rating": None,
        "ratingComment": None,
    }
    ref = db.collection("incidents").add(incident)
    incident["id"] = ref[1].id
    # notification for reporter
    if not body.isAnonymous:
        db.collection("notifications").add({
            "userId": user["id"],
            "type": "status",
            "incidentId": incident["id"],
            "title": f"{code} · Submitted",
            "body": f"Your report has been received by the {city['name']} control room.",
            "createdAt": now,
            "read": False,
        })
    # award stars
    user_ref = db.collection("users").document(user["id"])
    user_snap = user_ref.get()
    if user_snap.exists:
        user_ref.update({"stars": user_snap.to_dict().get("stars", 0) + 10})
    return incident


@router.patch("/incidents/{incident_id}/status")
def update_status(incident_id: str, body: StatusUpdate, user=Depends(require_officer_or_admin)):
    if is_local():
        store = get_store()
        inc = store.update_status(
            incident_id,
            body.status,
            actor=user,
            note=body.note,
            assigned_to=body.assignedTo,
            assigned_to_name=body.assignedToName,
        )
        if not inc:
            from fastapi import HTTPException
            raise HTTPException(404, "Incident not found")
        return inc
    db = get_db()
    ref = db.collection("incidents").document(incident_id)
    snap = ref.get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "Incident not found")
    inc = snap.to_dict()
    now = datetime.now(timezone.utc).isoformat()
    # normalize status
    from services.seed_data import normalize_status, STATUS_META
    norm_status = normalize_status(body.status)
    meta = STATUS_META[norm_status]
    old_status = inc.get("status", "")
    detail = body.note or f"Status updated from {old_status} to {meta['label']} by {user.get('name', 'Officer')}."
    events = list(inc.get("events", [])) + [{
        "id": _uid("ev"),
        "kind": "status",
        "label": meta["label"],
        "detail": detail,
        "at": now,
    }]
    updates = {"status": norm_status, "events": events}
    if body.assignedTo is not None:
        updates["assignedTo"] = body.assignedTo
    if body.assignedToName is not None:
        updates["assignedToName"] = body.assignedToName
    elif norm_status == "assigned" and not inc.get("assignedToName"):
        updates["assignedTo"] = user.get("id")
        updates["assignedToName"] = user.get("name")
    if norm_status == "resolved":
        updates["resolvedAt"] = now
    if norm_status == "closed":
        updates["closedAt"] = now
    ref.update(updates)
    if inc.get("reporterId"):
        db.collection("notifications").add({
            "userId": inc["reporterId"],
            "type": "status",
            "incidentId": incident_id,
            "title": f"{inc['code']} · {meta['label']}",
            "body": f"{inc['title']} is now {meta['label']}.",
            "createdAt": now,
            "read": False,
        })
    inc.update(updates)
    inc["id"] = incident_id
    return inc


@router.post("/incidents/{incident_id}/rate")
def rate_incident(incident_id: str, body: RatingInput, user=Depends(get_current_user)):
    if is_local():
        store = get_store()
        ok = store.rate_incident(incident_id, user["id"], body.rating, body.comment)
        if not ok:
            from fastapi import HTTPException
            raise HTTPException(403, "Cannot rate")
        return {"ok": True, "rating": body.rating}
    db = get_db()
    ref = db.collection("incidents").document(incident_id)
    snap = ref.get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "Incident not found")
    inc = snap.to_dict()
    if inc.get("reporterId") != user["id"]:
        from fastapi import HTTPException
        raise HTTPException(403, "Only the reporter can rate")
    ref.update({"rating": body.rating, "ratingComment": body.comment})
    user_ref = db.collection("users").document(user["id"])
    user_snap = user_ref.get()
    if user_snap.exists:
        user_ref.update({"stars": user_snap.to_dict().get("stars", 0) + 10})
    return {"ok": True, "rating": body.rating}


@router.post("/incidents/{incident_id}/close")
def close_incident(incident_id: str, user=Depends(get_current_user)):
    if is_local():
        store = get_store()
        inc = store.update_status(incident_id, "closed", actor=user)
        if not inc:
            from fastapi import HTTPException
            raise HTTPException(404, "Incident not found")
        return inc
    db = get_db()
    ref = db.collection("incidents").document(incident_id)
    snap = ref.get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "Incident not found")
    inc = snap.to_dict()
    if inc.get("reporterId") != user["id"] and user.get("role") not in ("officer", "admin"):
        from fastapi import HTTPException
        raise HTTPException(403, "Forbidden")
    now = datetime.now(timezone.utc).isoformat()
    ref.update({"status": "closed", "closedAt": now, "mapColor": "GREEN"})
    inc.update({"status": "closed", "closedAt": now, "mapColor": "GREEN"})
    inc["id"] = incident_id
    return inc
def help_incident(incident_id: str, user=Depends(get_current_user)):
    if is_local():
        store = get_store()
        ok = store.help_incident(incident_id, user["id"])
        return {"ok": ok}
    db = get_db()
    ref = db.collection("incidents").document(incident_id)
    snap = ref.get()
    if not snap.exists:
        from fastapi import HTTPException
        raise HTTPException(404, "Incident not found")
    inc = snap.to_dict()
    helped = inc.get("helpedBy", [])
    if user["id"] in helped:
        return {"ok": True, "already": True}
    helped.append(user["id"])
    ref.update({"helpedBy": helped})
    user_ref = db.collection("users").document(user["id"])
    user_snap = user_ref.get()
    if user_snap.exists:
        user_ref.update({"stars": user_snap.to_dict().get("stars", 0) + 25, "helped": user_snap.to_dict().get("helped", 0) + 1})
    return {"ok": True}


@router.post("/incidents/check-duplicate")
def check_duplicate(body: dict):
    lat = body.get("lat", 0)
    lng = body.get("lng", 0)
    category_id = body.get("categoryId", "")
    city_id = body.get("cityId", "metro")
    if is_local():
        store = get_store()
        matches = store.find_duplicates(lat, lng, category_id, city_id)
    else:
        from services.duplicates import find_duplicates
        db = get_db()
        docs = db.collection("incidents").where("cityId", "==", city_id).stream() if city_id else db.collection("incidents").stream()
        incs = []
        for d in docs:
            x = d.to_dict()
            x["id"] = d.id
            incs.append(x)
        matches = find_duplicates(incs, lat, lng, category_id, city_id)
    return {"hasDuplicates": len(matches) > 0, "matches": matches}
