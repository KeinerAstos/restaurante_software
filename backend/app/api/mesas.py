from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.database.session import get_db
from app.schemas.mesa import MesaCreate, MesaResponse, MesaUpdate
from app.services.mesa_service import MesaService


router = APIRouter(
    prefix="/api/mesas",
    tags=["Mesas"],
)


@router.get(
    "",
    response_model=list[MesaResponse],
)
def listar_mesas(
    db: Session = Depends(get_db),
):
    return MesaService.list_all(db)


@router.get(
    "/{mesa_id}",
    response_model=MesaResponse,
)
def obtener_mesa(
    mesa_id: int,
    db: Session = Depends(get_db),
):
    try:
        return MesaService.get_by_id(db, mesa_id)

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=MesaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_mesa(
    data: MesaCreate,
    db: Session = Depends(get_db),
):
    try:
        return MesaService.create(db, data)

    except ConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{mesa_id}",
    response_model=MesaResponse,
)
def actualizar_mesa(
    mesa_id: int,
    data: MesaUpdate,
    db: Session = Depends(get_db),
):
    try:
        return MesaService.update(
            db,
            mesa_id,
            data,
        )

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{mesa_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_mesa(
    mesa_id: int,
    db: Session = Depends(get_db),
):
    try:
        MesaService.delete(db, mesa_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc