from pydantic import BaseModel, Field
from typing import Optional, List, Literal


# ---------- User ----------
RoleType = Literal["citizen", "officer", "admin"]


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


class RoleUpdate(BaseModel):
    role: RoleType


# ---------- Incident ----------
IncidentStatus = Literal[
    "submitted",
    "under_review",
    "verified",
    "assigned",
    "in_progress",
    "resolved",
    "closed",
]
Severity = Literal["low", "medium", "high", "critical"]
MapColor = Literal["RED", "YELLOW", "GREEN"]


class IncidentCreate(BaseModel):
    categoryId: str
    subCategoryId: str
    title: str
    note: str = ""
    lat: float
    lng: float
    cityId: Optional[str] = None
    sectorId: str
    wardNumber: Optional[int] = None
    landmark: str = ""
    photoUrl: Optional[str] = None
    tags: List[str] = []
    isAnonymous: bool = False
    severity: Severity = "medium"
    duplicateOf: Optional[str] = None


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
    wardNumber: Optional[int] = None
    categoryId: str
    subCategoryId: str
    title: str
    note: str = ""
    lat: float
    lng: float
    landmark: str = ""
    photoUrl: Optional[str] = None
    tags: List[str] = []
    isAnonymous: bool = False
    reporterId: Optional[str] = None
    reporterName: str = "Anonymous citizen"
    status: IncidentStatus
    mapColor: MapColor = "RED"
    severity: Severity
    radiusKm: float = 3.0
    alertedCount: int = 0
    notifiedOrgs: List[str] = []
    notifiedNgos: List[str] = []
    events: List[IncidentEvent] = []
    helpedBy: List[str] = []
    assignedTo: Optional[str] = None
    assignedToName: Optional[str] = None
    duplicateOf: Optional[str] = None
    createdAt: str
    resolvedAt: Optional[str] = None
    closedAt: Optional[str] = None
    rating: Optional[int] = None
    ratingComment: Optional[str] = None


class StatusUpdate(BaseModel):
    status: IncidentStatus
    note: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedToName: Optional[str] = None


class DuplicateCheckRequest(BaseModel):
    lat: float
    lng: float
    categoryId: str
    cityId: Optional[str] = None


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
    wardNumber: int
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
