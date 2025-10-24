# import os
# from dotenv import load_dotenv

# load_dotenv()

# class Settings:
#     DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/itsc4155")
#     SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
#     ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# settings = Settings()

# with new .env
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Settings:
    # Database settings
    USE_SUPABASE: bool = os.getenv("USE_SUPABASE", "False").lower() == "true"
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_NAME: str = os.getenv("DB_NAME", "itsc4155")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct a properly encoded database URL from components."""
        password = quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
settings = Settings()