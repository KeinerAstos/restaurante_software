from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.mesa import Mesa
from app.models.mesa_layout import MesaLayout
from app.schemas.mesa_layout import (
    MesaLayoutResponse,
    MesaLayoutUpdate,
)


router = APIRouter(
    prefix="/api/layout",
    tags=["Layout"],
)


@router.get(
    "/mesas",
    response_model=list[MesaLayoutResponse],
)
def listar_layout(
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(MesaLayout).order_by(MesaLayout.mesa_id)
        ).all()
    )


@router.get(
    "/mesas/{mesa_id}",
    response_model=MesaLayoutResponse,
)
def obtener_layout(
    mesa_id: int,
    db: Session = Depends(get_db),
):
    row = db.get(MesaLayout, mesa_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La mesa no tiene posicion configurada.",
        )

    return row


@router.put(
    "/mesas/{mesa_id}",
    response_model=MesaLayoutResponse,
)
def actualizar_layout(
    mesa_id: int,
    data: MesaLayoutUpdate,
    db: Session = Depends(get_db),
):
    mesa = db.get(Mesa, mesa_id)

    if mesa is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La mesa no existe.",
        )

    row = db.get(MesaLayout, mesa_id)

    if row is None:
        row = MesaLayout(
            mesa_id=mesa_id,
            zona=data.zona or "SALON",
            pos_x=data.pos_x if data.pos_x is not None else Decimal("50"),
            pos_y=data.pos_y if data.pos_y is not None else Decimal("50"),
            forma=data.forma or "ROUND",
        )
    else:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(row, field, value)

    db.add(row)
    db.commit()
    db.refresh(row)

    return row