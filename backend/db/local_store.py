"""Local SQLite-backed store implementing the same operations as the Firestore backend."""
import random
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from core.auth import hash_password
from db.models import SessionLocal, User, Incident, Notification, Feedback, ActivityLog, init_db
from services.seed_data import (
    CITIES,
    SECTORS,
    CATEGORIES,
    SUB_CATEGORIES,
    STATUS_META,
    DEMO_NGOS,
    orgs_for_city,
    city_by_id,
    ward_for_sector,
    normalize_category_id,
    normalize_status,
    map_color_for_status,
)
from utils.geo import haversine_km


def _uid(prefix="id"):
    return f"{prefix}_{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))}"


def _now():
    return datetime.now(timezone.utc).isoformat()


class LocalStore:
    def __init__(self):
        init_db()
        self._seed_if_empty()

    def _session(self) -> Session:
        return SessionLocal()

    def _seed_if_empty(self):
        db = self._session()
        try:
            if db.query(User).count() > 0:
                return

            now = _now()
            # Primary demo citizen + officer + admin
            db.add(User(
                id="u_demo",
                name="Riya Sharma",
                email="demo@ocor.city",
                password=hash_password("demo1234"),
                phone="",
                cityId="metro",
                sectorId="metro-s18",
                stars=340,
                helped=6,
                isVolunteer=True,
                skills=["Traffic Support", "First Aid"],
                preferredCategories=["road", "garbage"],
                alertsEnabled=True,
                alertRadiusKm=3,
                role="citizen",
                createdAt=now,
            ))
            db.add(User(
                id="u_officer",
                name="Vikram Mehta",
                email="officer@ocor.city",
                password=hash_password("officer1234"),
                phone="",
                cityId="metro",
                sectorId="metro-s5",
                stars=120,
                helped=18,
                isVolunteer=False,
                skills=["Field Inspection"],
                preferredCategories=["road", "water", "drainage"],
                alertsEnabled=True,
                alertRadiusKm=5,
                role="officer",
                createdAt=now,
            ))
            db.add(User(
                id="u_admin",
                name="Ananya Verma",
                email="admin@ocor.city",
                password=hash_password("admin1234"),
                phone="",
                cityId="metro",
                sectorId="metro-s1",
                stars=500,
                helped=42,
                isVolunteer=False,
                skills=["Operations", "Dispatch"],
                preferredCategories=["road", "water", "garbage", "drainage", "streetlight"],
                alertsEnabled=True,
                alertRadiusKm=10,
                role="admin",
                createdAt=now,
            ))

            # Seed sample citizens across wards
            for i in range(1, 21):
                uid = f"u_seed_{i}"
                db.add(User(
                    id=uid,
                    name=f"Citizen {i}",
                    email=f"citizen{i}@ocor.city",
                    password=hash_password("demo1234"),
                    phone="",
                    cityId="metro",
                    sectorId=f"metro-s{i}",
                    stars=random.randint(20, 220),
                    helped=random.randint(0, 10),
                    isVolunteer=(i % 3 == 0),
                    skills=[],
                    preferredCategories=["road", "garbage"],
                    alertsEnabled=True,
                    alertRadiusKm=3,
                    role="citizen",
                    createdAt=now,
                ))

            # Seed 15 diverse incidents across 5 categories, 7 statuses, and multiple wards/cities
            seed_specs = [
                ("road", "road-pothole", "Deep pothole near main crossing", "metro", 18, "submitted", "high", ["pothole", "damaged road"]),
                ("water", "water-leak", "Main water pipeline burst on avenue", "metro", 12, "under_review", "critical", ["pipe leak", "water burst"]),
                ("garbage", "garbage-dump", "Uncollected garbage pile near market", "metro", 7, "verified", "medium", ["garbage dump", "waste"]),
                ("drainage", "drainage-overflow", "Blocked storm drain overflowing", "metro", 4, "assigned", "high", ["blocked drain", "overflow"]),
                ("streetlight", "streetlight-outage", "Three streetlights out on park lane", "metro", 9, "in_progress", "medium", ["dark street", "broken streetlight"]),
                ("road", "road-jam", "Traffic signal failure causing gridlock", "metro", 15, "resolved", "high", ["traffic jam", "signal"]),
                ("garbage", "garbage-bin", "Overflowing community bin", "metro", 2, "closed", "low", ["overflowing bin", "litter"]),
                ("water", "water-supply", "Low water pressure in morning hours", "riverport", 6, "submitted", "medium", ["no water", "supply"]),
                ("drainage", "drainage-manhole", "Open manhole without barricade", "riverport", 11, "in_progress", "critical", ["open manhole", "safety"]),
                ("streetlight", "streetlight-dark", "Dark stretch near school gate", "northvale", 3, "assigned", "high", ["poor lighting", "school zone"]),
                ("road", "road-pothole", "Damaged speed breaker near clinic", "oldtown", 8, "resolved", "medium", ["damaged road"]),
                ("garbage", "garbage-dump", "Construction debris dumped on footpath", "greenfield", 14, "verified", "medium", ["garbage dump"]),
            ]

            for idx, (cat, sub, title, c_id, ward, status, sev, tags) in enumerate(seed_specs):
                sec_id = f"{c_id}-s{ward}"
                sec = next((s for s in SECTORS if s["id"] == sec_id), SECTORS[0])
                code = f"OC-{2100 + idx}"
                reporter_id = "u_demo" if idx < 4 else f"u_seed_{(idx % 20) + 1}"
                reporter_name = "Riya Sharma" if idx < 4 else f"Citizen {(idx % 20) + 1}"
                assigned_to = "u_officer" if status in ("assigned", "in_progress", "resolved", "closed") else None
                assigned_name = "Vikram Mehta" if assigned_to else None
                db.add(Incident(
                    id=f"inc_seed_{idx}",
                    code=code,
                    cityId=c_id,
                    sectorId=sec_id,
                    wardNumber=ward,
                    categoryId=cat,
                    subCategoryId=sub,
                    title=title,
                    note="Seeded civic report for OCOR live map and workflow.",
                    lat=sec["lat"],
                    lng=sec["lng"],
                    landmark=f"Ward {ward} Main Road",
                    photoUrl=None,
                    tags=tags,
                    isAnonymous=False,
                    reporterId=reporter_id,
                    reporterName=reporter_name,
                    status=status,
                    severity=sev,
                    radiusKm=3.0,
                    alertedCount=12,
                    notifiedOrgs=orgs_for_city(city_by_id(c_id)["name"]),
                    notifiedNgos=DEMO_NGOS,
                    events=[
                        {
                            "id": _uid("ev"),
                            "kind": "status",
                            "label": STATUS_META[status]["label"],
                            "detail": f"Initial seeded state: {STATUS_META[status]['label']}.",
                            "at": now,
                        }
                    ],
                    helpedBy=[],
                    assignedTo=assigned_to,
                    assignedToName=assigned_name,
                    duplicateOf=None,
                    createdAt=now,
                    resolvedAt=now if status in ("resolved", "closed") else None,
                    closedAt=now if status == "closed" else None,
                    rating=5 if status == "closed" else None,
                    ratingComment="Quickly resolved by the ward team." if status == "closed" else None,
                ))

            db.add(Notification(
                id="n_seed_1",
                userId="u_demo",
                type="status",
                incidentId="inc_seed_0",
                title="OC-2100 · Submitted",
                body="Your report in Ward 18 has been logged with OCOR.",
                createdAt=now,
                read=False,
            ))
            db.add(ActivityLog(
                id="log_seed_1",
                actorId="u_admin",
                actorName="Ananya Verma",
                actorRole="admin",
                action="system_seed",
                targetType="system",
                targetId="ocor-local",
                detail="Initialized OCOR local database with roles, wards, and sample incidents.",
                metadataJson={"count": len(seed_specs)},
                createdAt=now,
            ))
            db.commit()
        finally:
            db.close()

    # ---------- users ----------
    def _user_dict(self, u: User) -> dict:
        return {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "cityId": u.cityId,
            "sectorId": u.sectorId,
            "stars": u.stars,
            "helped": u.helped,
            "isVolunteer": u.isVolunteer,
            "skills": u.skills or [],
            "preferredCategories": u.preferredCategories or [],
            "alertsEnabled": u.alertsEnabled,
            "alertRadiusKm": u.alertRadiusKm,
            "role": u.role,
            "createdAt": u.createdAt,
            "password": u.password,
        }

    def get_user(self, uid: str):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == uid).first()
            return self._user_dict(u) if u else None
        finally:
            db.close()

    def get_user_by_email(self, email: str):
        db = self._session()
        try:
            normalized = (email or "").strip().lower()
            if normalized == "demo@betterurban.app":
                normalized = "demo@ocor.city"
            u = db.query(User).filter(User.email == normalized).first()
            return self._user_dict(u) if u else None
        finally:
            db.close()

    def create_user(self, name: str, email: str, password: str, city_id: str, role: str = "citizen"):
        db = self._session()
        try:
            uid = f"u_{_uid('new')}"
            sector_id = f"{city_id}-s18"
            u = User(
                id=uid,
                name=name.strip(),
                email=email.strip().lower(),
                password=hash_password(password),
                phone="",
                cityId=city_id,
                sectorId=sector_id,
                stars=10,
                helped=0,
                isVolunteer=False,
                skills=[],
                preferredCategories=["road", "garbage"],
                alertsEnabled=True,
                alertRadiusKm=3,
                role=role,
                createdAt=_now(),
            )
            db.add(u)
            db.commit()
            return self._user_dict(u)
        finally:
            db.close()

    def update_user(self, uid: str, updates: dict):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == uid).first()
            if not u:
                return None
            for k, v in updates.items():
                if hasattr(u, k) and v is not None and k != "role":
                    setattr(u, k, v)
            db.commit()
            return self._user_dict(u)
        finally:
            db.close()

    def update_user_role(self, target_uid: str, new_role: str, actor: dict):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == target_uid).first()
            if not u:
                return None
            old_role = u.role
            u.role = new_role
            db.add(ActivityLog(
                id=_uid("log"),
                actorId=actor.get("id"),
                actorName=actor.get("name", "Admin"),
                actorRole=actor.get("role", "admin"),
                action="role_changed",
                targetType="user",
                targetId=target_uid,
                detail=f"Changed role of {u.email} from {old_role} to {new_role}.",
                metadataJson={"oldRole": old_role, "newRole": new_role},
                createdAt=_now(),
            ))
            db.commit()
            return self._user_dict(u)
        finally:
            db.close()

    def list_users(self, city_id=None):
        db = self._session()
        try:
            q = db.query(User)
            if city_id:
                q = q.filter(User.cityId == city_id)
            out = []
            for u in q.all():
                d = self._user_dict(u)
                d.pop("password", None)
                out.append(d)
            return out
        finally:
            db.close()

    # ---------- incidents ----------
    def _inc_dict(self, i: Incident) -> dict:
        norm_status = normalize_status(i.status)
        return {
            "id": i.id,
            "code": i.code,
            "cityId": i.cityId,
            "sectorId": i.sectorId,
            "wardNumber": i.wardNumber or ward_for_sector(i.sectorId),
            "categoryId": normalize_category_id(i.categoryId),
            "subCategoryId": i.subCategoryId,
            "title": i.title,
            "note": i.note,
            "lat": i.lat,
            "lng": i.lng,
            "landmark": i.landmark,
            "photoUrl": i.photoUrl,
            "tags": i.tags or [],
            "isAnonymous": i.isAnonymous,
            "reporterId": i.reporterId,
            "reporterName": i.reporterName,
            "status": norm_status,
            "mapColor": map_color_for_status(norm_status),
            "severity": i.severity,
            "radiusKm": i.radiusKm,
            "alertedCount": i.alertedCount,
            "notifiedOrgs": i.notifiedOrgs or [],
            "notifiedNgos": i.notifiedNgos or [],
            "events": i.events or [],
            "helpedBy": i.helpedBy or [],
            "assignedTo": i.assignedTo,
            "assignedToName": i.assignedToName,
            "duplicateOf": i.duplicateOf,
            "createdAt": i.createdAt,
            "resolvedAt": i.resolvedAt,
            "closedAt": i.closedAt,
            "rating": i.rating,
            "ratingComment": i.ratingComment,
        }

    def list_incidents(
        self,
        city_id=None,
        category_id=None,
        status=None,
        ward_number=None,
        search=None,
        reporter_id=None,
        limit=100,
    ):
        db = self._session()
        try:
            q = db.query(Incident)
            if city_id:
                q = q.filter(Incident.cityId == city_id)
            if category_id:
                q = q.filter(Incident.categoryId == normalize_category_id(category_id))
            if status:
                q = q.filter(Incident.status == normalize_status(status))
            if ward_number is not None:
                q = q.filter(Incident.wardNumber == ward_number)
            if reporter_id:
                q = q.filter(Incident.reporterId == reporter_id)
            q = q.order_by(Incident.createdAt.desc())
            items = [self._inc_dict(i) for i in q.all()]
            if search:
                needle = search.strip().lower()
                items = [
                    it
                    for it in items
                    if needle in (it.get("title") or "").lower()
                    or needle in (it.get("code") or "").lower()
                    or needle in (it.get("landmark") or "").lower()
                    or needle in (it.get("note") or "").lower()
                    or any(needle in t.lower() for t in (it.get("tags") or []))
                ]
            return items[:limit]
        finally:
            db.close()

    def get_incident(self, iid: str):
        db = self._session()
        try:
            i = db.query(Incident).filter(Incident.id == iid).first()
            return self._inc_dict(i) if i else None
        finally:
            db.close()

    def create_incident(self, data: dict, user: dict):
        db = self._session()
        try:
            city_id = data.get("cityId") or user.get("cityId", "metro")
            city = city_by_id(city_id)
            point = {"lat": data["lat"], "lng": data["lng"]}
            audience = 0
            for u in db.query(User).filter(User.cityId == city["id"]).all():
                sec = next((s for s in SECTORS if s["id"] == u.sectorId), None)
                if sec and haversine_km(sec, point) <= 3:
                    audience += 1
            audience = max(audience, 1)

            used = {i.code for i in db.query(Incident).all()}
            code = None
            while code is None or code in used:
                code = f"OC-{random.randint(2000, 8999)}"

            now = _now()
            cat_id = normalize_category_id(data["categoryId"])
            ward_num = data.get("wardNumber") or ward_for_sector(data["sectorId"])

            inc = Incident(
                id=_uid("inc"),
                code=code,
                cityId=city["id"],
                sectorId=data["sectorId"],
                wardNumber=ward_num,
                categoryId=cat_id,
                subCategoryId=data["subCategoryId"],
                title=data["title"],
                note=data.get("note", ""),
                lat=data["lat"],
                lng=data["lng"],
                landmark=data.get("landmark", ""),
                photoUrl=data.get("photoUrl"),
                tags=data.get("tags") or [],
                isAnonymous=data.get("isAnonymous", False),
                reporterId=None if data.get("isAnonymous") else user["id"],
                reporterName="Anonymous citizen" if data.get("isAnonymous") else user["name"],
                status="submitted",
                severity=data.get("severity", "medium"),
                radiusKm=3.0,
                alertedCount=audience,
                notifiedOrgs=orgs_for_city(city["name"]),
                notifiedNgos=DEMO_NGOS,
                events=[
                    {
                        "id": _uid("ev"),
                        "kind": "submitted",
                        "label": "Submitted",
                        "detail": f"Complaint logged in {city['name']} (Ward {ward_num}).",
                        "at": now,
                    }
                ],
                helpedBy=[],
                assignedTo=None,
                assignedToName=None,
                duplicateOf=data.get("duplicateOf"),
                createdAt=now,
                resolvedAt=None,
                closedAt=None,
                rating=None,
                ratingComment=None,
            )
            db.add(inc)
            if not data.get("isAnonymous"):
                db.add(Notification(
                    id=_uid("n"),
                    userId=user["id"],
                    type="status",
                    incidentId=inc.id,
                    title=f"{code} · Submitted",
                    body=f"Your complaint in {city['name']} Ward {ward_num} has been submitted.",
                    createdAt=now,
                    read=False,
                ))
            db.add(ActivityLog(
                id=_uid("log"),
                actorId=user["id"],
                actorName=user.get("name", "Citizen"),
                actorRole=user.get("role", "citizen"),
                action="incident_created",
                targetType="incident",
                targetId=inc.id,
                detail=f"Submitted {code} ({cat_id}) in Ward {ward_num}.",
                metadataJson={"code": code, "cityId": city["id"], "wardNumber": ward_num},
                createdAt=now,
            ))
            u = db.query(User).filter(User.id == user["id"]).first()
            if u:
                u.stars = (u.stars or 0) + 10
            db.commit()
            db.refresh(inc)
            return self._inc_dict(inc)
        finally:
            db.close()

    def update_status(
        self,
        incident_id: str,
        status: str,
        actor: dict,
        note: Optional[str] = None,
        assigned_to: Optional[str] = None,
        assigned_to_name: Optional[str] = None,
    ):
        db = self._session()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc:
                return None
            now = _now()
            norm_status = normalize_status(status)
            meta = STATUS_META[norm_status]
            old_status = inc.status

            detail = note or f"Status updated from {old_status} to {meta['label']} by {actor.get('name', 'Officer')}."
            events = list(inc.events or []) + [
                {
                    "id": _uid("ev"),
                    "kind": "status",
                    "label": meta["label"],
                    "detail": detail,
                    "at": now,
                }
            ]
            inc.status = norm_status
            inc.events = events
            if assigned_to is not None:
                inc.assignedTo = assigned_to
            if assigned_to_name is not None:
                inc.assignedToName = assigned_to_name
            elif norm_status == "assigned" and not inc.assignedToName:
                inc.assignedTo = actor.get("id")
                inc.assignedToName = actor.get("name")
            if norm_status == "resolved":
                inc.resolvedAt = now
            if norm_status == "closed":
                inc.closedAt = now

            if inc.reporterId:
                db.add(Notification(
                    id=_uid("n"),
                    userId=inc.reporterId,
                    type="status",
                    incidentId=incident_id,
                    title=f"{inc.code} · {meta['label']}",
                    body=f"{inc.title} is now {meta['label']}.",
                    createdAt=now,
                    read=False,
                ))
            db.add(ActivityLog(
                id=_uid("log"),
                actorId=actor.get("id"),
                actorName=actor.get("name", "Officer"),
                actorRole=actor.get("role", "officer"),
                action="status_updated",
                targetType="incident",
                targetId=incident_id,
                detail=f"Updated {inc.code} status: {old_status} -> {norm_status}.",
                metadataJson={"oldStatus": old_status, "newStatus": norm_status, "assignedTo": inc.assignedTo},
                createdAt=now,
            ))
            db.commit()
            db.refresh(inc)
            return self._inc_dict(inc)
        finally:
            db.close()

    def rate_incident(self, incident_id: str, user_id: str, rating: int, comment: Optional[str] = None):
        db = self._session()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc or inc.reporterId != user_id:
                return False
            inc.rating = rating
            inc.ratingComment = comment
            u = db.query(User).filter(User.id == user_id).first()
            if u:
                u.stars = (u.stars or 0) + 10
            db.commit()
            return True
        finally:
            db.close()

    def help_incident(self, incident_id: str, user_id: str):
        db = self._session()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc:
                return False
            helped = list(inc.helpedBy or [])
            if user_id in helped:
                return True
            helped.append(user_id)
            inc.helpedBy = helped
            u = db.query(User).filter(User.id == user_id).first()
            if u:
                u.stars = (u.stars or 0) + 25
                u.helped = (u.helped or 0) + 1
            db.commit()
            return True
        finally:
            db.close()

    # ---------- notifications ----------
    def add_notification(self, user_id: str, title: str, body: str, ntype: str = "system", incident_id: Optional[str] = None):
        db = self._session()
        try:
            n = Notification(
                id=_uid("n"),
                userId=user_id,
                type=ntype,
                incidentId=incident_id,
                title=title,
                body=body,
                createdAt=_now(),
                read=False,
            )
            db.add(n)
            db.commit()
            return n.id
        finally:
            db.close()

    def list_notifications(self, user_id: str):
        db = self._session()
        try:
            docs = db.query(Notification).filter(Notification.userId == user_id).order_by(Notification.createdAt.desc()).all()
            return [
                {
                    "id": n.id,
                    "userId": n.userId,
                    "type": n.type,
                    "incidentId": n.incidentId,
                    "title": n.title,
                    "body": n.body,
                    "createdAt": n.createdAt,
                    "read": n.read,
                }
                for n in docs
            ]
        finally:
            db.close()

    def mark_read(self, notif_id: str, user_id: str):
        db = self._session()
        try:
            n = db.query(Notification).filter(Notification.id == notif_id).first()
            if not n or n.userId != user_id:
                return False
            n.read = True
            db.commit()
            return True
        finally:
            db.close()

    def mark_all_read(self, user_id: str):
        db = self._session()
        try:
            db.query(Notification).filter(Notification.userId == user_id, Notification.read == False).update({"read": True})  # noqa: E712
            db.commit()
            return True
        finally:
            db.close()

    # ---------- activity logs & feedback ----------
    def list_activity_logs(self, limit: int = 100):
        db = self._session()
        try:
            rows = db.query(ActivityLog).order_by(ActivityLog.createdAt.desc()).limit(limit).all()
            return [
                {
                    "id": r.id,
                    "actorId": r.actorId,
                    "actorName": r.actorName,
                    "actorRole": r.actorRole,
                    "action": r.action,
                    "targetType": r.targetType,
                    "targetId": r.targetId,
                    "detail": r.detail,
                    "metadata": r.metadataJson or {},
                    "createdAt": r.createdAt,
                }
                for r in rows
            ]
        finally:
            db.close()

    def list_feedback(self, limit: int = 100):
        db = self._session()
        try:
            rows = db.query(Feedback).order_by(Feedback.createdAt.desc()).limit(limit).all()
            return [
                {
                    "id": r.id,
                    "name": r.name,
                    "email": r.email,
                    "message": r.message,
                    "rating": r.rating,
                    "userId": r.userId,
                    "createdAt": r.createdAt,
                }
                for r in rows
            ]
        finally:
            db.close()

    # ---------- leaderboard ----------
    def leaderboard(self, city_id=None):
        db = self._session()
        try:
            q = db.query(User)
            if city_id:
                q = q.filter(User.cityId == city_id)
            users = sorted(q.all(), key=lambda u: u.stars or 0, reverse=True)
            out = []
            for u in users[:50]:
                d = self._user_dict(u)
                d.pop("password", None)
                out.append(d)
            return out
        finally:
            db.close()

    # ---------- volunteer ----------
    def join_volunteer(self, user_id: str):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            if not u:
                return None
            u.isVolunteer = True
            u.stars = (u.stars or 0) + 15
            db.commit()
            d = self._user_dict(u)
            d.pop("password", None)
            return d
        finally:
            db.close()

    # ---------- cities / categories ----------
    def cities(self):
        return CITIES

    def sectors(self, city_id: str):
        return [s for s in SECTORS if s["cityId"] == city_id]

    def categories(self):
        return CATEGORIES

    def sub_categories(self, category_id: str):
        norm = normalize_category_id(category_id)
        return [s for s in SUB_CATEGORIES if s["categoryId"] == norm]

    def find_duplicates(self, lat, lng, category_id, city_id=None, threshold_meters=100.0):
        from services.duplicates import find_duplicates as fd
        db = self._session()
        try:
            incs = [self._inc_dict(i) for i in db.query(Incident).all()]
            return fd(incs, lat, lng, category_id, city_id, threshold_meters)
        finally:
            db.close()

    # ---------- admin / ops ----------
    def activity_logs(self, limit: int = 50):
        from db.models import ActivityLog
        db = self._session()
        try:
            rows = db.query(ActivityLog).order_by(ActivityLog.createdAt.desc()).limit(limit).all()
            return [{"id": r.id, "actorId": r.actorId, "actorName": r.actorName,
                     "actorRole": r.actorRole, "action": r.action, "targetType": r.targetType,
                     "targetId": r.targetId, "detail": r.detail, "metadataJson": r.metadataJson,
                     "createdAt": r.createdAt} for r in rows]
        finally:
            db.close()

    def data_quality(self):
        db = self._session()
        try:
            total = db.query(Incident).count()
            missing_photo = db.query(Incident).filter(Incident.photoUrl.is_(None)).count()
            missing_loc = db.query(Incident).filter((Incident.lat == 0) | (Incident.lng == 0)).count()
            invalid = db.query(Incident).filter(Incident.title == "").count()
            return {
                "total": total,
                "missingPhoto": missing_photo,
                "missingLocation": missing_loc,
                "invalidTitle": invalid,
                "qualityScore": round((1 - (missing_photo + missing_loc + invalid) / max(total, 1)) * 100, 1),
            }
        finally:
            db.close()

    def data_sources(self):
        return {
            "sources": ["Seeded demo data", "Citizen reports"],
            "lastUpdated": _now(),
            "cities": len(CITIES),
            "sectors": len(SECTORS),
        }

    def duplicates(self):
        from services.duplicates import find_duplicates
        db = self._session()
        try:
            incs = [self._inc_dict(i) for i in db.query(Incident).all()]
            # find groups of incidents within 100m with same category
            groups = []
            seen = set()
            for i, a in enumerate(incs):
                if a["id"] in seen:
                    continue
                matches = [m for m in find_duplicates(incs, a["lat"], a["lng"], a["categoryId"], a["cityId"]) if m["id"] != a["id"]]
                if matches:
                    groups.append({"primary": a["id"], "duplicates": [m["id"] for m in matches]})
                    seen.add(a["id"])
                    for m in matches:
                        seen.add(m["id"])
            return groups
        finally:
            db.close()

    def admin_feedback(self):
        from db.models import Feedback
        db = self._session()
        try:
            rows = db.query(Feedback).order_by(Feedback.createdAt.desc()).all()
            return [{"id": f.id, "name": f.name, "email": f.email, "message": f.message,
                     "rating": f.rating, "createdAt": f.createdAt, "userId": f.userId} for f in rows]
        finally:
            db.close()

    def add_notification(self, user_id, title, body, ntype="system", incident_id=None):
        db = self._session()
        try:
            db.add(Notification(id=_uid("n"), userId=user_id, type=ntype, incidentId=incident_id,
                                title=title, body=body, createdAt=_now(), read=False))
            db.commit()
        finally:
            db.close()
