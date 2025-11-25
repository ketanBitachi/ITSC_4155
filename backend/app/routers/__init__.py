from .auth import router as auth_router
from .pantry import router as pantry_router
from .support import router as support_router, alias_router as support_alias_router
from .preferences import router as preferences_router
from .recipes import router as recipes_router

__all__ = [
    "auth_router",
    "pantry_router",
    "support_router",
    "support_alias_router",
    "preferences_router",
    "recipes_router",
]