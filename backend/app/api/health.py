from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.config.settings import settings
from app.database.session import database_probe


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health():
    return {
        "status": "ok",
        "application": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


@router.get("/database")
def health_database():
    try:
        data = database_probe()

        return {
            "status": "ok",
            "database": "connected",
            "database_name": data["database_name"],
            "database_user": data["database_user"],
            "server_version": data["server_version"],
            "server_port": data["server_port"],
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        ) from exc