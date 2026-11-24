"""Factory returning the active store (local SQLite or Firebase)."""
from core.config import get_settings


def get_store():
    settings = get_settings()
    if settings.db_backend == "local":
        from db.local_store import LocalStore
        return LocalStore()
    # Firebase path: routers fall back to direct Firestore calls
    return None


def is_local() -> bool:
    return get_settings().db_backend == "local"
