import os
import json
import base64

_settings = None


def _settings():
    global _settings
    if _settings is None:
        from core.config import get_settings
        _settings = get_settings()
    return _settings


def _load_credentials():
    from firebase_admin import credentials
    s = _settings()
    # 1. Raw JSON in env var (preferred for Railway/Render)
    raw = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
    if raw:
        try:
            info = json.loads(raw)
        except json.JSONDecodeError:
            # Maybe base64-encoded
            info = json.loads(base64.b64decode(raw).decode())
        return credentials.Certificate(info)
    # 2. File path
    cred_path = s.firebase_credentials_path
    if cred_path and os.path.exists(cred_path):
        return credentials.Certificate(cred_path)
    # 3. Application default (GCP)
    return credentials.ApplicationDefault()


def init_firebase() -> None:
    try:
        import firebase_admin
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"firebase-admin not importable: {exc}")
    if firebase_admin._apps:
        return
    s = _settings()
    cred = _load_credentials()
    options = {}
    if s.firebase_storage_bucket:
        options["storageBucket"] = s.firebase_storage_bucket
    if s.firebase_project_id:
        options["projectId"] = s.firebase_project_id
    firebase_admin.initialize_app(cred, options or None)


def get_auth():
    init_firebase()
    from firebase_admin import auth
    return auth


def get_db():
    init_firebase()
    from firebase_admin import firestore
    return firestore.client()


def get_bucket():
    init_firebase()
    from firebase_admin import storage
    return storage.bucket()
