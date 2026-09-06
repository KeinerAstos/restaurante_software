from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.database.session import get_db
from app.schemas.producto import (
    ProductoCreate,
    ProductoResponse,
    ProductoUpdate,
)
from app.services.producto_service import ProductoService


router = APIRouter(
    prefix="/api/productos",
    tags=["Productos"],
)


@router.get(
    "",
    response_model=list[ProductoResponse],
)
def listar_productos(
    db: Session = Depends(get_db),
):
    return ProductoService.list_all(db)


@router.get(
    "/{producto_id}",
    response_model=ProductoResponse,
)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
):
    try:
        return ProductoService.get_by_id(
            db,
            producto_id,
        )

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=ProductoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_producto(
    data: ProductoCreate,
    db: Session = Depends(get_db),
):
    try:
        return ProductoService.create(
            db,
            data,
        )

    except ConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{producto_id}",
    response_model=ProductoResponse,
)
def actualizar_producto(
    producto_id: int,
    data: ProductoUpdate,
    db: Session = Depends(get_db),
):
    try:
        return ProductoService.update(
            db,
            producto_id,
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
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
):
    try:
        ProductoService.delete(
            db,
            producto_id,
        )

        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc