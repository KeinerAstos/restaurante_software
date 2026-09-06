from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClienteBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    telefono: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    observaciones: str | None = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    telefono: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    observaciones: str | None = None
    activo: bool | None = None


class ClienteResponse(ClienteBase):
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)