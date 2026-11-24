from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from core.auth import get_current_user
from core.firebase import get_db
from db.store import is_local, get_store
import random

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


class FeedbackIn(BaseModel):
    name: str = ""
    email: str = ""
    message: str
    rating: Optional[int] = Field(None, ge=1, le=5)


def _uid():
    return "fb_" + "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))


@router.post("/feedback")
def submit_feedback(body: FeedbackIn, credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    uid = None
    if credentials and credentials.credentials:
        token = credentials.credentials
        if token.startswith("local::"):
            uid = token.split("::", 1)[1]
        else:
            try:
                from firebase_admin import auth as fb_auth
                decoded = fb_auth.verify_id_token(token)
                uid = decoded.get("uid")
            except Exception:  # noqa: BLE001
                uid = None
    now = datetime.now(timezone.utc).isoformat()
    if is_local():
        from db.models import SessionLocal, Feedback
        db = SessionLocal()
        try:
            fb = Feedback(id=_uid(), name=body.name, email=body.email, message=body.message,
                          rating=body.rating, createdAt=now, userId=uid)
            db.add(fb)
            db.commit()
            return {"ok": True, "id": fb.id}
        finally:
            db.close()
    db = get_db()
    ref = db.collection("feedback").add({
        "name": body.name, "email": body.email, "message": body.message,
        "rating": body.rating, "createdAt": now, "userId": uid,
    })
    return {"ok": True, "id": ref[1].id}
