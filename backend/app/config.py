from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:////data/app.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    cors_origins: str = "*"

    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = "admin123"
    seed_admin_name: str = "Quản trị viên"

    # Path to the built Vite frontend (`dist/`). When set, FastAPI serves the
    # SPA from the same origin so the whole app runs in a single container.
    frontend_dist: Optional[str] = None

    def frontend_dist_resolved(self) -> Optional[Path]:
        if not self.frontend_dist:
            return None
        p = Path(self.frontend_dist)
        return p if p.is_dir() else None


settings = Settings()
