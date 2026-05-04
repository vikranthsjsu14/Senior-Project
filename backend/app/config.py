from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    google_api_key: str = ""
    secret_key: str = "change-this-secret-key-in-production"
    database_url: str = "sqlite:///./health_fitness.db"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    gemini_video_model: str = "gemini-2.5-flash"
    gemini_audio_model: str = "gemini-2.5-flash"
    gemini_chat_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
