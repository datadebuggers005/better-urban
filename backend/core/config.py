from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Better Urban API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Firebase
    firebase_project_id: str = ""
    firebase_credentials_path: str = ""  # path to service account JSON
    firebase_storage_bucket: str = ""
    firebase_credentials_json: str = ""  # raw service account JSON (alternative to file path)
    firebase_web_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database backend: "local" (SQLite) or "firebase"
    db_backend: str = "local"
    database_url: str = "sqlite:///./betterurban.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
