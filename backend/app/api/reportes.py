from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.report_service import ReportService


router = APIRouter(
    prefix="/api/reportes",
    tags=["Reportes"],
)


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
):
    return ReportService.dashboard(db)


@router.get("/productos")
def productos(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return ReportService.productos(
        db,
        limit=limit,
    )