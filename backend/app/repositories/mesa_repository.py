from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mesa import Mesa
from app.schemas.mesa import MesaCreate, MesaUpdate


class MesaRepository:

    @staticmethod
    def list_all(db: Session) -> list[Mesa]:
        statement = select(Mesa).order_by(Mesa.numero.asc())
        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(db: Session, mesa_id: int) -> Mesa | None:
        return db.get(Mesa, mesa_id)

    @staticmethod
    def get_by_numero(db: Session, numero: int) -> Mesa | None:
        statement = select(Mesa).where(Mesa.numero == numero)
        return db.scalar(statement)

    @staticmethod
    def create(db: Session, data: MesaCreate) -> Mesa:
        mesa = Mesa(**data.model_dump())

        db.add(mesa)
        db.commit()
        db.refresh(mesa)

        return mesa

    @staticmethod
    def update(
        db: Session,
        mesa: Mesa,
        data: MesaUpdate,
    ) -> Mesa:

        changes = data.model_dump(exclude_unset=True)

        for field, value in changes.items():
            setattr(mesa, field, value)

        db.add(mesa)
        db.commit()
        db.refresh(mesa)

        return mesa

    @staticmethod
    def delete(db: Session, mesa: Mesa) -> None:
        db.delete(mesa)
        db.commit()