from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.models.mesa import Mesa
from app.repositories.mesa_repository import MesaRepository
from app.schemas.mesa import MesaCreate, MesaUpdate


class MesaService:

    @staticmethod
    def list_all(db: Session) -> list[Mesa]:
        return MesaRepository.list_all(db)

    @staticmethod
    def get_by_id(db: Session, mesa_id: int) -> Mesa:
        mesa = MesaRepository.get_by_id(db, mesa_id)

        if mesa is None:
            raise EntityNotFoundError(
                f"La mesa con id {mesa_id} no existe."
            )

        return mesa

    @staticmethod
    def create(db: Session, data: MesaCreate) -> Mesa:
        existing = MesaRepository.get_by_numero(db, data.numero)

        if existing is not None:
            raise ConflictError(
                f"Ya existe una mesa con el numero {data.numero}."
            )

        return MesaRepository.create(db, data)

    @staticmethod
    def update(
        db: Session,
        mesa_id: int,
        data: MesaUpdate,
    ) -> Mesa:

        mesa = MesaService.get_by_id(db, mesa_id)

        if data.numero is not None and data.numero != mesa.numero:
            existing = MesaRepository.get_by_numero(
                db,
                data.numero,
            )

            if existing is not None:
                raise ConflictError(
                    f"Ya existe una mesa con el numero {data.numero}."
                )

        return MesaRepository.update(
            db,
            mesa,
            data,
        )

    @staticmethod
    def delete(db: Session, mesa_id: int) -> None:
        mesa = MesaService.get_by_id(db, mesa_id)
        MesaRepository.delete(db, mesa)