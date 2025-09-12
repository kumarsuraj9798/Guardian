from pydantic import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str | None = None


settings = Settings()