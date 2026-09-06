from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MesaEstado = Literal[
    "LIBRE",
    "OCUPADA",
    "RESERVADA",
    "FUERA_DE_SERVICIO",
]


class MesaBase(BaseModel):
    numero: int = Field(gt=0)
    capacidad: int = Field(gt=0, le=50)
    ubicacion: str | None = Field(default=None, max_length=100)
    estado: MesaEstado = "LIBRE"


class MesaCreate(MesaBase):
    pass


class MesaUpdate(BaseModel):
    numero: int | None = Field(default=None, gt=0)
    capacidad: int | None = Field(default=None, gt=0, le=50)
    ubicacion: str | None = Field(default=None, max_length=100)
    estado: MesaEstado | None = None
    activo: bool | None = None


class MesaResponse(MesaBase):
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)