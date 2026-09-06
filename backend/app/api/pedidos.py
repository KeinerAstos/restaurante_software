from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.common.exceptions import (
    ConflictError,
    EntityNotFoundError,
    ValidationError,
)
from app.database.session import get_db
from app.schemas.pedido import (
    DetallePedidoCreate,
    DetallePedidoResponse,
    DetallePedidoUpdate,
    PedidoCreate,
    PedidoDetalleResponse,
    PedidoEstadoUpdate,
    PedidoResponse,
)
from app.services.pedido_service import PedidoService


router = APIRouter(
    prefix="/api/pedidos",
    tags=["Pedidos"],
)


def _raise_domain_error(exc: Exception):
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

    if isinstance(exc, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    raise exc


@router.get(
    "",
    response_model=list[PedidoResponse],
)
def listar_pedidos(
    db: Session = Depends(get_db),
):
    return PedidoService.list_all(db)


@router.get(
    "/{pedido_id}",
    response_model=PedidoDetalleResponse,
)
def obtener_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.get_detail(
            db,
            pedido_id,
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)


@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_pedido(
    data: PedidoCreate,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.create(
            db,
            data.mesa_id,
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)


@router.post(
    "/{pedido_id}/items",
    response_model=DetallePedidoResponse,
    status_code=status.HTTP_201_CREATED,
)
def agregar_item(
    pedido_id: int,
    data: DetallePedidoCreate,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.add_item(
            db,
            pedido_id,
            data,
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)


@router.put(
    "/{pedido_id}/items/{detalle_id}",
    response_model=DetallePedidoResponse,
)
def actualizar_item(
    pedido_id: int,
    detalle_id: int,
    data: DetallePedidoUpdate,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.update_item(
            db,
            pedido_id,
            detalle_id,
            data,
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)


@router.delete(
    "/{pedido_id}/items/{detalle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_item(
    pedido_id: int,
    detalle_id: int,
    db: Session = Depends(get_db),
):
    try:
        PedidoService.remove_item(
            db,
            pedido_id,
            detalle_id,
        )

        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)


@router.put(
    "/{pedido_id}/estado",
    response_model=PedidoResponse,
)
def cambiar_estado(
    pedido_id: int,
    data: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.change_status(
            db,
            pedido_id,
            data.estado,
        )

    except (
        EntityNotFoundError,
        ConflictError,
        ValidationError,
    ) as exc:
        _raise_domain_error(exc)