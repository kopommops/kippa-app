from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./pelo_finance.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    currency: str = "BWP"
    app_name: str = "Pelo Finance API"
    environment: str = "development"
    jwt_secret_key: str = "dev-only-change-this-secret-before-deployment"
    access_token_hours: int = 12
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    peloyame_session_limit: int = 5
    peloyame_daily_user_limit: int = 20
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_deployment_secrets(self) -> None:
        if self.environment.lower() in {"production", "prod"}:
            if len(self.jwt_secret_key) < 32 or self.jwt_secret_key in {"dev-only-change-this-secret-before-deployment", "replace-this-with-a-unique-random-secret-before-sharing-or-deployment"}:
                raise RuntimeError("Set a unique JWT_SECRET_KEY of at least 32 characters before production deployment.")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
