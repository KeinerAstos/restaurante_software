from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ReservaEstado = Literal[
    "PENDIENTE",
    "CONFIRMADA",
    "EN_MESA",
    "COMPLETADA",
    "CANCELADA",
    "NO_ASISTIO",
]


class ReservaCreate(BaseModel):
    mesa_id: int = Field(gt=0)
    cliente_id: int = Field(gt=0)
    fecha_hora: datetime
    personas: int = Field(gt=0, le=50)
    observaciones: str | None = None


class ReservaUpdate(BaseModel):
    mesa_id: int | None = Field(default=None, gt=0)
    cliente_id: int | None = Field(default=None, gt=0)
    fecha_hora: datetime | None = None
    personas: int | None = Field(default=None, gt=0, le=50)
    observaciones: str | None = None


class ReservaEstadoUpdate(BaseModel):
    estado: ReservaEstado


class ReservaResponse(BaseModel):
    id: int
    mesa_id: int
    cliente_id: int
    fecha_hora: datetime
    personas: int
    estado: ReservaEstado
    observaciones: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)