from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Restaurante Software API"
    app_version: str = "0.1.0"
    environment: str = "development"

    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_name: str = "restaurante_db"
    db_user: str = "restaurante_app"
    db_password: str

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()