from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PedidoEstado = Literal[
    "ABIERTO",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
    "PAGADO",
    "CANCELADO",
]


class PedidoCreate(BaseModel):
    mesa_id: int = Field(gt=0)


class PedidoEstadoUpdate(BaseModel):
    estado: PedidoEstado


class DetallePedidoCreate(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=100)
    observacion: str | None = Field(
        default=None,
        max_length=250,
    )


class DetallePedidoUpdate(BaseModel):
    cantidad: int | None = Field(
        default=None,
        gt=0,
        le=100,
    )
    observacion: str | None = Field(
        default=None,
        max_length=250,
    )


class DetallePedidoResponse(BaseModel):
    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    observacion: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PedidoResponse(BaseModel):
    id: int
    mesa_id: int
    estado: PedidoEstado
    total: Decimal
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class PedidoDetalleResponse(PedidoResponse):
    items: list[DetallePedidoResponse] = []