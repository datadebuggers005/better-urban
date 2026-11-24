"""Local SQLite-backed store implementing the same operations as the Firestore backend."""
import random
import string
import uuid as _uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from db.models import SessionLocal, User, Incident, Notification, init_db
from services.seed_data import CITIES, SECTORS, orgs_for_city, DEMO_NGOS
from utils.geo import haversine_km

STATUS_META = {
    "reported": {"label": "Reported", "short": "Reported", "step": 0},
    "dispatched": {"label": "Alert dispatched", "short": "Dispatched", "step": 1},
    "acknowledged": {"label": "Authority acknowledged", "short": "Acknowledged", "step": 2},
    "in_progress": {"label": "Work in progress", "short": "In progress", "step": 3},
    "resolved": {"label": "Resolved", "short": "Resolved", "step": 4},
}


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
            # seed cities/sectors already in seed_data; seed users + incidents
            from services.seed_data import SECTORS as _S
            # create demo user
            db.add(User(
                id="u_demo", name="Riya Sharma", email="demo@betterurban.app",
                password="demo1234", phone="", cityId="metro", sectorId="metro-s18",
                stars=340, helped=6, isVolunteer=True,
                skills=["Traffic Support", "First Aid"], preferredCategories=["road", "waste"],
                alertsEnabled=True, alertRadiusKm=3, role="citizen", createdAt=_now(),
            ))
            # seed a few citizens
            import hashlib
            for i in range(50):
                uid = f"u_seed_{i}"
                db.add(User(
                    id=uid, name=f"Citizen {i}", email=f"citizen{i}@betterurban.app",
                    password="demo1234", phone="", cityId="metro",
                    sectorId=f"metro-s{(i % 20) + 1}", stars=random.randint(0, 200),
                    helped=random.randint(0, 10), isVolunteer=random.random() > 0.7,
                    skills=[], preferredCategories=["road", "waste"],
                    alertsEnabled=True, alertRadiusKm=3, role="citizen", createdAt=_now(),
                ))
            # seed a few incidents for metro
            titles = ["Potholes / Damaged Road", "Garbage Dump", "Roadblock / Traffic Jam", "Pipe Leak / Burst", "Open Manhole"]
            for i in range(15):
                db.add(Incident(
                    id=f"inc_metro_{i}", code=f"BU-{2049 + i}", cityId="metro",
                    sectorId=f"metro-s{(i % 20) + 1}", categoryId="road",
                    subCategoryId="road-pothole", title=titles[i % len(titles)],
                    note="Seeded demo incident.", lat=28.6448, lng=77.2167,
                    landmark=f"Sector {(i % 20) + 1} Main Rd", photoUrl=None,
                    isAnonymous=False, reporterId="u_demo" if i < 3 else f"u_seed_{i}",
                    reporterName="Riya Sharma" if i < 3 else f"Citizen {i}",
                    status=["resolved", "dispatched", "in_progress", "reported", "acknowledged"][i % 5],
                    severity="medium", radiusKm=3.0, alertedCount=10,
                    notifiedOrgs=["Metro City Municipal Control Room", "Metro City Traffic Police"],
                    notifiedNgos=DEMO_NGOS, events=[], helpedBy=[],
                    createdAt=_now(), resolvedAt=None, rating=5 if i % 5 == 0 else None,
                    ratingComment=None,
                ))
            db.add(Notification(id="n_1", userId="u_demo", type="status",
                                incidentId="inc_metro_0", title="BU-2049 Field team assigned",
                                body="Your report was acknowledged by the Metro City control room.",
                                createdAt=_now(), read=False))
            db.commit()
        finally:
            db.close()

    # ---------- users ----------
    def get_user(self, uid):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == uid).first()
            return self._user_dict(u) if u else None
        finally:
            db.close()

    def get_user_by_email(self, email):
        db = self._session()
        try:
            u = db.query(User).filter(User.email == email.lower()).first()
            return self._user_dict(u) if u else None
        finally:
            db.close()

    def create_user(self, name, email, password, city_id):
        db = self._session()
        try:
            uid = f"u_{_uid('new')}"
            sector_id = f"{city_id}-s18"
            u = User(id=uid, name=name.strip(), email=email.strip().lower(),
                     password=password, phone="", cityId=city_id, sectorId=sector_id,
                     stars=10, helped=0, isVolunteer=False, skills=[],
                     preferredCategories=["road", "waste"], alertsEnabled=True,
                     alertRadiusKm=3, role="citizen", createdAt=_now())
            db.add(u)
            db.commit()
            return self._user_dict(u)
        finally:
            db.close()

    def update_user(self, uid, updates):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == uid).first()
            if not u:
                return None
            for k, v in updates.items():
                if hasattr(u, k) and v is not None:
                    setattr(u, k, v)
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
            return [self._user_dict(u) for u in q.all()]
        finally:
            db.close()

    def _user_dict(self, u):
        return {
            "id": u.id, "name": u.name, "email": u.email, "phone": u.phone,
            "cityId": u.cityId, "sectorId": u.sectorId, "stars": u.stars,
            "helped": u.helped, "isVolunteer": u.isVolunteer, "skills": u.skills or [],
            "preferredCategories": u.preferredCategories or [], "alertsEnabled": u.alertsEnabled,
            "alertRadiusKm": u.alertRadiusKm, "role": u.role, "createdAt": u.createdAt,
            "password": u.password,
        }

    # ---------- incidents ----------
    def _inc_dict(self, i):
        return {
            "id": i.id, "code": i.code, "cityId": i.cityId, "sectorId": i.sectorId,
            "categoryId": i.categoryId, "subCategoryId": i.subCategoryId, "title": i.title,
            "note": i.note, "lat": i.lat, "lng": i.lng, "landmark": i.landmark,
            "photoUrl": i.photoUrl, "isAnonymous": i.isAnonymous, "reporterId": i.reporterId,
            "reporterName": i.reporterName, "status": i.status, "severity": i.severity,
            "radiusKm": i.radiusKm, "alertedCount": i.alertedCount,
            "notifiedOrgs": i.notifiedOrgs or [], "notifiedNgos": i.notifiedNgos or [],
            "events": i.events or [], "helpedBy": i.helpedBy or [],
            "createdAt": i.createdAt, "resolvedAt": i.resolvedAt,
            "rating": i.rating, "ratingComment": i.ratingComment,
        }

    def list_incidents(self, city_id=None, status=None, reporter_id=None, limit=100):
        db = self._session()
        try:
            q = db.query(Incident)
            if city_id:
                q = q.filter(Incident.cityId == city_id)
            if status:
                q = q.filter(Incident.status == status)
            if reporter_id:
                q = q.filter(Incident.reporterId == reporter_id)
            q = q.order_by(Incident.createdAt.desc()).limit(limit)
            return [self._inc_dict(i) for i in q.all()]
        finally:
            db.close()

    def get_incident(self, iid):
        db = self._session()
        try:
            i = db.query(Incident).filter(Incident.id == iid).first()
            return self._inc_dict(i) if i else None
        finally:
            db.close()

    def create_incident(self, data, user):
        db = self._session()
        try:
            city_id = user["cityId"]
            from services.seed_data import city_by_id, orgs_for_city
            city = city_by_id(city_id)
            # audience
            point = {"lat": data["lat"], "lng": data["lng"]}
            audience = 0
            for u in db.query(User).filter(User.cityId == city_id).all():
                sec = next((s for s in SECTORS if s["id"] == u.sectorId), None)
                if sec and haversine_km(sec, point) <= 3:
                    audience += 1
            audience = max(audience, 1)
            # unique code
            used = {i.code for i in db.query(Incident).all()}
            code = None
            while code is None or code in used:
                code = f"BU-{random.randint(2000, 8999)}"
            now = _now()
            inc = Incident(
                id=_uid("inc"), code=code, cityId=city["id"], sectorId=data["sectorId"],
                categoryId=data["categoryId"], subCategoryId=data["subCategoryId"],
                title=data["title"], note=data.get("note", ""), lat=data["lat"], lng=data["lng"],
                landmark=data.get("landmark", ""), photoUrl=data.get("photoUrl"),
                isAnonymous=data.get("isAnonymous", False),
                reporterId=None if data.get("isAnonymous") else user["id"],
                reporterName="Anonymous citizen" if data.get("isAnonymous") else user["name"],
                status="dispatched", severity=data.get("severity", "medium"),
                radiusKm=3.0, alertedCount=audience,
                notifiedOrgs=orgs_for_city(city["name"]), notifiedNgos=DEMO_NGOS,
                events=[
                    {"id": _uid("ev"), "kind": "reported", "label": "Report received",
                     "detail": "Citizen report logged on the 3 km dispatch network.", "at": now},
                    {"id": _uid("ev"), "kind": "dispatch", "label": "Alert dispatched",
                     "detail": f"{city['name']} control room, 2 partner NGOs and {audience} citizens inside 3 km were alerted.", "at": now},
                ],
                helpedBy=[], createdAt=now, resolvedAt=None, rating=None, ratingComment=None,
            )
            db.add(inc)
            # notification for reporter
            if not data.get("isAnonymous"):
                db.add(Notification(id=_uid("n"), userId=user["id"], type="status",
                                    incidentId=inc.id, title=f"{code} · Alert dispatched",
                                    body=f"{city['name']} control room, 2 NGOs and {audience} neighbours have been alerted.",
                                    createdAt=now, read=False))
            # award stars
            u = db.query(User).filter(User.id == user["id"]).first()
            if u:
                u.stars = (u.stars or 0) + 10
            db.commit()
            db.refresh(inc)
            return self._inc_dict(inc)
        finally:
            db.close()

    def update_status(self, incident_id, status, city_name_for_detail=None):
        db = self._session()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc:
                return None
            now = _now()
            meta = STATUS_META.get(status, STATUS_META["reported"])
            events = list(inc.events or []) + [{
                "id": _uid("ev"), "kind": "status",
                "label": "Marked resolved" if status == "resolved" else meta["label"],
                "detail": ("Field team marked the issue resolved. Awaiting citizen confirmation."
                           if status == "resolved"
                           else f"Status updated by the control room."),
                "at": now,
            }]
            inc.status = status
            inc.events = events
            if status == "resolved":
                inc.resolvedAt = now
            # notify reporter
            if inc.reporterId:
                db.add(Notification(id=_uid("n"), userId=inc.reporterId, type="status",
                                    incidentId=incident_id, title=f"{inc.code} · {meta['label']}",
                                    body=f"{inc.title} at {inc.landmark} is now {meta['short'].lower()}.",
                                    createdAt=now, read=False))
            db.commit()
            db.refresh(inc)
            return self._inc_dict(inc)
        finally:
            db.close()

    def rate_incident(self, incident_id, user_id, rating, comment=None):
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

    def help_incident(self, incident_id, user_id):
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
    def list_notifications(self, user_id):
        db = self._session()
        try:
            docs = db.query(Notification).filter(Notification.userId == user_id).order_by(Notification.createdAt.desc()).all()
            return [{"id": n.id, "userId": n.userId, "type": n.type, "incidentId": n.incidentId,
                     "title": n.title, "body": n.body, "createdAt": n.createdAt, "read": n.read} for n in docs]
        finally:
            db.close()

    def mark_read(self, notif_id, user_id):
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

    def mark_all_read(self, user_id):
        db = self._session()
        try:
            db.query(Notification).filter(Notification.userId == user_id, Notification.read == False).update({"read": True})
            db.commit()
            return True
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
            return [self._user_dict(u) for u in users[:50]]
        finally:
            db.close()

    # ---------- volunteer ----------
    def join_volunteer(self, user_id):
        db = self._session()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            if not u:
                return None
            u.isVolunteer = True
            u.stars = (u.stars or 0) + 15
            db.commit()
            return self._user_dict(u)
        finally:
            db.close()

    # ---------- cities ----------
    def cities(self):
        return CITIES

    def sectors(self, city_id):
        return [s for s in SECTORS if s["cityId"] == city_id]

    def categories(self):
        from services.seed_data import CATEGORIES, SUB_CATEGORIES
        return CATEGORIES

    def sub_categories(self, category_id):
        from services.seed_data import SUB_CATEGORIES
        return [s for s in SUB_CATEGORIES if s["categoryId"] == category_id]
