from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ProductoCategoria = Literal[
    "ENTRADA",
    "PLATO_FUERTE",
    "BEBIDA",
    "POSTRE",
    "OTRO",
]


class ProductoBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = None
    precio: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    categoria: ProductoCategoria = "OTRO"
    disponible: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    descripcion: str | None = None
    precio: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )
    categoria: ProductoCategoria | None = None
    disponible: bool | None = None


class ProductoResponse(ProductoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)