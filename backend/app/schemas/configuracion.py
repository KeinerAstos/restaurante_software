from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RestauranteConfigUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    especialidad: str | None = Field(default=None, min_length=2, max_length=120)
    moneda: str | None = Field(default=None, min_length=3, max_length=10)
    ciudad: str | None = Field(default=None, max_length=120)
    telefono: str | None = Field(default=None, max_length=40)
    direccion: str | None = Field(default=None, max_length=200)
    horario: str | None = Field(default=None, max_length=160)


class RestauranteConfigResponse(BaseModel):
    id: int
    nombre: str
    especialidad: str
    moneda: str
    ciudad: str | None
    telefono: str | None
    direccion: str | None
    horario: str | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)