from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MesaZona = Literal["SALON", "TERRAZA", "VIP", "BAR", "OTRA"]
MesaForma = Literal["ROUND", "RECT", "SMALL"]


class MesaLayoutUpdate(BaseModel):
    zona: MesaZona | None = None
    pos_x: Decimal | None = Field(default=None, ge=0, le=100)
    pos_y: Decimal | None = Field(default=None, ge=0, le=100)
    forma: MesaForma | None = None


class MesaLayoutResponse(BaseModel):
    mesa_id: int
    zona: MesaZona
    pos_x: Decimal
    pos_y: Decimal
    forma: MesaForma
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)