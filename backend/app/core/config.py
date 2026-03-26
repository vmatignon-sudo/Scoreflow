from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API
    api_title: str = "ScoreFlow Scoring Engine"
    api_version: str = "1.0.0"
    debug: bool = False

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Claude API
    anthropic_api_key: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Security
    scoring_api_secret: str = ""
    jwt_secret: str = ""

    # External APIs
    insee_api_key: str = ""
    inpi_username: str = ""
    inpi_password: str = ""
    serper_api_key: str = ""
    mistral_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
