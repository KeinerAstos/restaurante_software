from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.reserva import Reserva
from app.schemas.reserva import ReservaCreate, ReservaUpdate


ESTADOS_RESERVA_ACTIVA = (
    "PENDIENTE",
    "CONFIRMADA",
    "EN_MESA",
)


class ReservaRepository:

    @staticmethod
    def list_all(
        db: Session,
        *,
        estado: str | None = None,
        desde: datetime | None = None,
        hasta: datetime | None = None,
    ) -> list[Reserva]:

        statement = select(Reserva)

        if estado:
            statement = statement.where(Reserva.estado == estado)

        if desde:
            statement = statement.where(Reserva.fecha_hora >= desde)

        if hasta:
            statement = statement.where(Reserva.fecha_hora <= hasta)

        statement = statement.order_by(
            Reserva.fecha_hora.asc()
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        reserva_id: int,
    ) -> Reserva | None:

        return db.get(Reserva, reserva_id)

    @staticmethod
    def get_conflict(
        db: Session,
        *,
        mesa_id: int,
        fecha_hora: datetime,
        exclude_id: int | None = None,
    ) -> Reserva | None:

        start = fecha_hora - timedelta(minutes=90)
        end = fecha_hora + timedelta(minutes=90)

        statement = select(Reserva).where(
            Reserva.mesa_id == mesa_id,
            Reserva.estado.in_(ESTADOS_RESERVA_ACTIVA),
            Reserva.fecha_hora >= start,
            Reserva.fecha_hora <= end,
        )

        if exclude_id is not None:
            statement = statement.where(
                Reserva.id != exclude_id
            )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        data: ReservaCreate,
    ) -> Reserva:

        reserva = Reserva(**data.model_dump())

        db.add(reserva)
        db.commit()
        db.refresh(reserva)

        return reserva

    @staticmethod
    def update(
        db: Session,
        reserva: Reserva,
        data: ReservaUpdate,
    ) -> Reserva:

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(reserva, field, value)

        db.add(reserva)
        db.commit()
        db.refresh(reserva)

        return reserva