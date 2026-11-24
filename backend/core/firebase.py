import os

_settings = None


def _settings():
    global _settings
    if _settings is None:
        from core.config import get_settings
        _settings = get_settings()
    return _settings


def init_firebase() -> None:
    try:
        import firebase_admin
        from firebase_admin import credentials
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"firebase-admin not importable: {exc}")
    if firebase_admin._apps:
        return
    s = _settings()
    cred_path = s.firebase_credentials_path
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        from firebase_admin import credentials as c
        cred = c.ApplicationDefault()
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
