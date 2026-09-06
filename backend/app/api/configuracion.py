from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.restaurante_config import RestauranteConfig
from app.schemas.configuracion import (
    RestauranteConfigResponse,
    RestauranteConfigUpdate,
)


router = APIRouter(
    prefix="/api/configuracion",
    tags=["Configuracion"],
)


def _get_config(db: Session) -> RestauranteConfig:
    config = db.get(RestauranteConfig, 1)

    if config is None:
        config = RestauranteConfig(
            id=1,
            nombre="Trattoria Bellavista",
            especialidad="Cucina Italiana",
            moneda="COP",
            ciudad="Bogota",
        )
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


@router.get(
    "/restaurante",
    response_model=RestauranteConfigResponse,
)
def obtener_configuracion(
    db: Session = Depends(get_db),
):
    return _get_config(db)


@router.put(
    "/restaurante",
    response_model=RestauranteConfigResponse,
)
def actualizar_configuracion(
    data: RestauranteConfigUpdate,
    db: Session = Depends(get_db),
):
    config = _get_config(db)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(config, field, value)

    db.add(config)
    db.commit()
    db.refresh(config)

    return config