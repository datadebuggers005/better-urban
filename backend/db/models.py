from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from core.config import get_settings

_settings = get_settings()
DATABASE_URL = os.getenv("DATABASE_URL", _settings.database_url)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, default="")
    cityId = Column(String, default="metro")
    sectorId = Column(String, nullable=True)
    stars = Column(Integer, default=10)
    helped = Column(Integer, default=0)
    isVolunteer = Column(Boolean, default=False)
    skills = Column(JSON, default=list)
    preferredCategories = Column(JSON, default=list)
    alertsEnabled = Column(Boolean, default=True)
    alertRadiusKm = Column(Integer, default=3)
    role = Column(String, default="citizen")
    createdAt = Column(String, nullable=True)


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    cityId = Column(String, nullable=False)
    sectorId = Column(String, nullable=False)
    wardNumber = Column(Integer, nullable=True)
    categoryId = Column(String, nullable=False)
    subCategoryId = Column(String, nullable=False)
    title = Column(String, nullable=False)
    note = Column(Text, default="")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    landmark = Column(String, default="")
    photoUrl = Column(String, nullable=True)
    tags = Column(JSON, default=list)
    isAnonymous = Column(Boolean, default=False)
    reporterId = Column(String, nullable=True)
    reporterName = Column(String, default="Anonymous citizen")
    status = Column(String, default="submitted")
    severity = Column(String, default="medium")
    radiusKm = Column(Float, default=3.0)
    alertedCount = Column(Integer, default=0)
    notifiedOrgs = Column(JSON, default=list)
    notifiedNgos = Column(JSON, default=list)
    events = Column(JSON, default=list)
    helpedBy = Column(JSON, default=list)
    assignedTo = Column(String, nullable=True)
    assignedToName = Column(String, nullable=True)
    duplicateOf = Column(String, nullable=True)
    createdAt = Column(String, nullable=False)
    resolvedAt = Column(String, nullable=True)
    closedAt = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)
    ratingComment = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    userId = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    incidentId = Column(String, nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    createdAt = Column(String, nullable=False)
    read = Column(Boolean, default=False)


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    createdAt = Column(String, nullable=False)
    userId = Column(String, nullable=True)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(String, primary_key=True)
    actorId = Column(String, nullable=True)
    actorName = Column(String, nullable=False)
    actorRole = Column(String, nullable=False)
    action = Column(String, nullable=False)
    targetType = Column(String, nullable=False)
    targetId = Column(String, nullable=False)
    detail = Column(Text, default="")
    metadataJson = Column(JSON, default=dict)
    createdAt = Column(String, nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)
