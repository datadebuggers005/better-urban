import os
import json
import base64

_settings_cache = None


def _settings():
    global _settings_cache
    if _settings_cache is None:
        from core.config import get_settings
        _settings_cache = get_settings()
    return _settings_cache


def _load_credentials():
    from firebase_admin import credentials
    s = _settings()
    # 1. Raw JSON in env var (preferred for Railway/Render)
    raw = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
    if raw:
        # Try 1: raw JSON (with escaped \n)
        try:
            info = json.loads(raw)
            return credentials.Certificate(info)
        except json.JSONDecodeError:
            pass
        # Try 2: JSON with actual newlines (minify by removing raw newlines inside strings)
        try:
            # Remove literal newlines that break JSON, then parse
            cleaned = raw.replace("\r\n", "\\n").replace("\r", "\\n").replace("\n", "\\n")
            # But this breaks if there are real structural newlines; try original first already failed
            info = json.loads(cleaned)
            return credentials.Certificate(info)
        except json.JSONDecodeError:
            pass
        # Try 3: base64-encoded
        try:
            info = json.loads(base64.b64decode(raw).decode())
            return credentials.Certificate(info)
        except Exception:  # noqa: BLE001
            pass
        raise RuntimeError("FIREBASE_CREDENTIALS_JSON is not valid JSON or base64")
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
