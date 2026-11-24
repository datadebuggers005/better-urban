from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ---------- User ----------
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    cityId: str = "metro"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cityId: Optional[str] = None
    sectorId: Optional[str] = None
    preferredCategories: Optional[List[str]] = None
    alertsEnabled: Optional[bool] = None
    alertRadiusKm: Optional[int] = None
    isVolunteer: Optional[bool] = None
    skills: Optional[List[str]] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str = ""
    cityId: str
    sectorId: Optional[str] = None
    stars: int = 0
    helped: int = 0
    isVolunteer: bool = False
    skills: List[str] = []
    preferredCategories: List[str] = []
    alertsEnabled: bool = True
    alertRadiusKm: int = 3
    role: str = "citizen"
    createdAt: Optional[str] = None


# ---------- Incident ----------
IncidentStatus = Literal["reported", "dispatched", "acknowledged", "in_progress", "resolved"]
Severity = Literal["low", "medium", "high", "critical"]


class IncidentCreate(BaseModel):
    categoryId: str
    subCategoryId: str
    title: str
    note: str = ""
    lat: float
    lng: float
    sectorId: str
    landmark: str = ""
    photoUrl: Optional[str] = None
    isAnonymous: bool = False
    severity: Severity = "medium"


class IncidentEvent(BaseModel):
    id: str
    kind: str
    label: str
    detail: str
    at: str


class IncidentOut(BaseModel):
    id: str
    code: str
    cityId: str
    sectorId: str
    categoryId: str
    subCategoryId: str
    title: str
    note: str = ""
    lat: float
    lng: float
    landmark: str = ""
    photoUrl: Optional[str] = None
    isAnonymous: bool = False
    reporterId: Optional[str] = None
    reporterName: str = "Anonymous citizen"
    status: IncidentStatus
    severity: Severity
    radiusKm: float = 3.0
    alertedCount: int = 0
    notifiedOrgs: List[str] = []
    notifiedNgos: List[str] = []
    events: List[IncidentEvent] = []
    helpedBy: List[str] = []
    createdAt: str
    resolvedAt: Optional[str] = None
    rating: Optional[int] = None
    ratingComment: Optional[str] = None


class StatusUpdate(BaseModel):
    status: IncidentStatus


class RatingInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


# ---------- Notification ----------
class NotificationOut(BaseModel):
    id: str
    userId: str
    type: str
    incidentId: Optional[str] = None
    title: str
    body: str
    createdAt: str
    read: bool = False


# ---------- City / Sector ----------
class CityOut(BaseModel):
    id: str
    name: str
    short: str
    center: dict


class SectorOut(BaseModel):
    id: str
    cityId: str
    name: str
    lat: float
    lng: float


# ---------- Auth ----------
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    cityId: str = "metro"


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    uid: str
    email: str
    idToken: str
    profile: UserOut


class DemoLoginRequest(BaseModel):
    pass
