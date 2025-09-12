import os


class Settings:
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")


settings = Settings()