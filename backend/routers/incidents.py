import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from core.auth import get_current_user
from core.firebase import get_db
from core.config import get_settings
from db.store import is_local, get_store
from models.schemas import IncidentCreate, StatusUpdate, RatingInput
from services.seed_data import CITIES, SECTORS, orgs_for_city, DEMO_NGOS
from utils.geo import haversine_km

router = APIRouter()


STATUS_META = {
    "reported": {"label": "Reported", "short": "Reported", "step": 0},
    "dispatched": {"label": "Alert dispatched", "short": "Dispatched", "step": 1},
    "acknowledged": {"label": "Authority acknowledged", "short": "Acknowledged", "step": 2},
    "in_progress": {"label": "Work in progress", "short": "In progress", "step": 3},
    "resolved": {"label": "Resolved", "short": "Resolved", "step": 4},
}


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
    q = db.collection("incidents")
    if cityId:
        q = q.where("cityId", "==", cityId)
    if status:
        q = q.where("status", "==", status)
    if reporterId:
        q = q.where("reporterId", "==", reporterId)
    docs = q.limit(limit).stream()
    out = []
    for d in docs:
        x = d.to_dict()
        x["id"] = d.id
        out.append(x)
    return out


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
        data = body.dict()
        data["title"] = body.title or body.subCategoryId
        return store.create_incident(data, user)
    # firebase path (original)
    db = get_db()
    city = _city(user.get("cityId", "metro"))
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
        code = f"BU-{__import__('random').randint(2000, 8999)}"
    now = datetime.now(timezone.utc).isoformat()
    incident = {
        "code": code, "cityId": city["id"], "sectorId": body.sectorId,
        "categoryId": body.categoryId, "subCategoryId": body.subCategoryId,
        "title": body.title, "note": body.note, "lat": body.lat, "lng": body.lng,
        "landmark": body.landmark, "photoUrl": body.photoUrl, "isAnonymous": body.isAnonymous,
        "reporterId": None if body.isAnonymous else user["id"],
        "reporterName": "Anonymous citizen" if body.isAnonymous else user["name"],
        "status": "dispatched", "severity": body.severity, "radiusKm": 3.0,
        "alertedCount": audience, "notifiedOrgs": orgs_for_city(city["name"]),
        "notifiedNgos": DEMO_NGOS,
        "events": [], "helpedBy": [], "createdAt": now, "resolvedAt": None,
        "rating": None, "ratingComment": None,
    }
    ref = db.collection("incidents").add(incident)
    incident["id"] = ref[1].id
    if not body.isAnonymous:
        db.collection("notifications").add({
            "userId": user["id"], "type": "status", "incidentId": incident["id"],
            "title": f"{code} · Alert dispatched",
            "body": f"{city['name']} control room, 2 NGOs and {audience} neighbours have been alerted.",
            "createdAt": now, "read": False,
        })
    db.collection("users").document(user["id"]).update({"stars": user.get("stars", 0) + 10})
    return incident


@router.patch("/incidents/{incident_id}/status")
def update_status(incident_id: str, body: StatusUpdate, user=Depends(get_current_user)):
    if is_local():
        store = get_store()
        inc = store.update_status(incident_id, body.status)
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
    meta = STATUS_META.get(body.status, STATUS_META["reported"])
    events = list(inc.get("events", [])) + [{
        "id": _uid("ev"), "kind": "status",
        "label": "Marked resolved" if body.status == "resolved" else meta["label"],
        "detail": ("Field team marked the issue resolved. Awaiting citizen confirmation."
                   if body.status == "resolved"
                   else f"Status updated by the {_city(inc['cityId'])['name']} control room."),
        "at": now,
    }]
    updates = {"status": body.status, "events": events}
    if body.status == "resolved":
        updates["resolvedAt"] = now
    ref.update(updates)
    if inc.get("reporterId"):
        db.collection("notifications").add({
            "userId": inc["reporterId"], "type": "status", "incidentId": incident_id,
            "title": f"{inc['code']} · {meta['label']}",
            "body": f"{inc['title']} at {inc.get('landmark','')} is now {meta['short'].lower()}.",
            "createdAt": now, "read": False,
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
    db.collection("users").document(user["id"]).update({"stars": user.get("stars", 0) + 10})
    return {"ok": True, "rating": body.rating}


@router.post("/incidents/{incident_id}/help")
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
    db.collection("users").document(user["id"]).update({"stars": user.get("stars", 0) + 25, "helped": user.get("helped", 0) + 1})
    return {"ok": True}
