from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql://pmro_user:pmro_secret@db:5432/pmro_requerimentos",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(default="TROQUE_POR_UMA_CHAVE_SEGURA_ALEATORIA", alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=480, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    backend_cors_origins: str = Field(default="http://localhost:5173", alias="BACKEND_CORS_ORIGINS")

    initial_admin_name: str = Field(default="Administrador PMRO", alias="INITIAL_ADMIN_NAME")
    initial_admin_email: str = Field(default="admin@pmro.local", alias="INITIAL_ADMIN_EMAIL")
    initial_admin_password: str = Field(default="admin123", alias="INITIAL_ADMIN_PASSWORD")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


settings = Settings()
