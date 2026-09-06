from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.exceptions import (
    ConflictError,
    EntityNotFoundError,
    ValidationError,
)
from app.database.session import get_db
from app.schemas.reserva import (
    ReservaCreate,
    ReservaEstadoUpdate,
    ReservaResponse,
    ReservaUpdate,
)
from app.services.reserva_service import ReservaService


router = APIRouter(
    prefix="/api/reservas",
    tags=["Reservas"],
)


def _domain_error(exc: Exception):
    if isinstance(exc, EntityNotFoundError):
        code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ConflictError):
        code = status.HTTP_409_CONFLICT
    elif isinstance(exc, ValidationError):
        code = status.HTTP_422_UNPROCESSABLE_ENTITY
    else:
        raise exc

    raise HTTPException(
        status_code=code,
        detail=str(exc),
    ) from exc


@router.get("", response_model=list[ReservaResponse])
def listar_reservas(
    estado: str | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    db: Session = Depends(get_db),
):
    return ReservaService.list_all(
        db,
        estado=estado,
        desde=desde,
        hasta=hasta,
    )


@router.get("/{reserva_id}", response_model=ReservaResponse)
def obtener_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
):
    try:
        return ReservaService.get_by_id(db, reserva_id)
    except (EntityNotFoundError, ConflictError, ValidationError) as exc:
        _domain_error(exc)


@router.post(
    "",
    response_model=ReservaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_reserva(
    data: ReservaCreate,
    db: Session = Depends(get_db),
):
    try:
        return ReservaService.create(db, data)
    except (EntityNotFoundError, ConflictError, ValidationError) as exc:
        _domain_error(exc)


@router.put("/{reserva_id}", response_model=ReservaResponse)
def actualizar_reserva(
    reserva_id: int,
    data: ReservaUpdate,
    db: Session = Depends(get_db),
):
    try:
        return ReservaService.update(
            db,
            reserva_id,
            data,
        )
    except (EntityNotFoundError, ConflictError, ValidationError) as exc:
        _domain_error(exc)


@router.put(
    "/{reserva_id}/estado",
    response_model=ReservaResponse,
)
def cambiar_estado_reserva(
    reserva_id: int,
    data: ReservaEstadoUpdate,
    db: Session = Depends(get_db),
):
    try:
        return ReservaService.change_status(
            db,
            reserva_id,
            data.estado,
        )
    except (EntityNotFoundError, ConflictError, ValidationError) as exc:
        _domain_error(exc)