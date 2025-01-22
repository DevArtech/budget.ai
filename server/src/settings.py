from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    groq_api_key: str
    jwt_secret_key: str
    jwt_algorithm: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
