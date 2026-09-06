from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.exceptions import EntityNotFoundError
from app.database.session import get_db
from app.schemas.pedido import PedidoResponse
from app.services.pedido_service import PedidoService


router = APIRouter(
    prefix="/api/mesas",
    tags=["Mesas"],
)


@router.get(
    "/{mesa_id}/pedidos",
    response_model=list[PedidoResponse],
)
def listar_pedidos_de_mesa(
    mesa_id: int,
    db: Session = Depends(get_db),
):
    try:
        return PedidoService.list_by_mesa(
            db,
            mesa_id,
        )

    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc