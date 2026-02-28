from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import json

from src.utils.config import settings
from src.auth.routes import router as auth_router
from src.session_engine.routes import router as sessions_router
from src.analytics.routes import router as analytics_router
from src.profile.routes import router as profile_router

logger = logging.getLogger(__name__)

def create_app():
    app = FastAPI(title=settings.APP_NAME)

    # CORS
    origins = settings.CORS_ORIGINS
    if isinstance(origins, str):
        parsed = None
        try:
            parsed = json.loads(origins)
        except Exception:
            parsed = None

        if isinstance(parsed, list):
            origins = [str(o).strip() for o in parsed if str(o).strip()]
        else:
            origins = [o.strip() for o in origins.split(",") if o.strip()]
    elif isinstance(origins, list):
        origins = [str(o).strip() for o in origins if str(o).strip()]
    else:
        origins = []

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers under API version prefix
    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["auth"])
    app.include_router(sessions_router, prefix=f"{api_prefix}/sessions", tags=["sessions"])
    app.include_router(analytics_router, prefix=f"{api_prefix}/analytics", tags=["analytics"])
    app.include_router(profile_router, prefix=f"{api_prefix}/profile", tags=["profile"])

    @app.get("/healthz")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
