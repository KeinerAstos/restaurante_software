from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.database.session import get_db
from app.schemas.cliente import (
    ClienteCreate,
    ClienteResponse,
    ClienteUpdate,
)
from app.services.cliente_service import ClienteService


router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"],
)


def _domain_error(exc: Exception):
    if isinstance(exc, EntityNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    if isinstance(exc, ConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    raise exc


@router.get("", response_model=list[ClienteResponse])
def listar_clientes(
    include_inactive: bool = False,
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    return ClienteService.list_all(
        db,
        include_inactive=include_inactive,
        search=search,
    )


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
):
    try:
        return ClienteService.get_by_id(db, cliente_id)
    except (EntityNotFoundError, ConflictError) as exc:
        _domain_error(exc)


@router.post(
    "",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
):
    try:
        return ClienteService.create(db, data)
    except (EntityNotFoundError, ConflictError) as exc:
        _domain_error(exc)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    db: Session = Depends(get_db),
):
    try:
        return ClienteService.update(
            db,
            cliente_id,
            data,
        )
    except (EntityNotFoundError, ConflictError) as exc:
        _domain_error(exc)


@router.delete("/{cliente_id}", response_model=ClienteResponse)
def desactivar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
):
    try:
        return ClienteService.deactivate(
            db,
            cliente_id,
        )
    except (EntityNotFoundError, ConflictError) as exc:
        _domain_error(exc)