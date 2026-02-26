from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.config import settings

from auth.routes import router as auth_router
from session_engine.routes import router as sessions_router
from analytics.routes import router as analytics_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    # CORS
    origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
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

    @app.get("/healthz")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
