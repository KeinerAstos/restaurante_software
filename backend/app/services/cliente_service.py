from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.models.cliente import Cliente
from app.repositories.cliente_repository import ClienteRepository
from app.schemas.cliente import ClienteCreate, ClienteUpdate


class ClienteService:

    @staticmethod
    def list_all(
        db: Session,
        *,
        include_inactive: bool = False,
        search: str | None = None,
    ) -> list[Cliente]:

        return ClienteRepository.list_all(
            db,
            include_inactive=include_inactive,
            search=search,
        )

    @staticmethod
    def get_by_id(
        db: Session,
        cliente_id: int,
    ) -> Cliente:

        cliente = ClienteRepository.get_by_id(
            db,
            cliente_id,
        )

        if cliente is None:
            raise EntityNotFoundError(
                f"El cliente con id {cliente_id} no existe."
            )

        return cliente

    @staticmethod
    def create(
        db: Session,
        data: ClienteCreate,
    ) -> Cliente:

        if data.email:
            existing = ClienteRepository.get_by_email(
                db,
                str(data.email),
            )

            if existing is not None:
                raise ConflictError(
                    "Ya existe un cliente con ese correo."
                )

        return ClienteRepository.create(db, data)

    @staticmethod
    def update(
        db: Session,
        cliente_id: int,
        data: ClienteUpdate,
    ) -> Cliente:

        cliente = ClienteService.get_by_id(
            db,
            cliente_id,
        )

        if (
            data.email is not None
            and str(data.email) != cliente.email
        ):
            existing = ClienteRepository.get_by_email(
                db,
                str(data.email),
            )

            if existing is not None:
                raise ConflictError(
                    "Ya existe un cliente con ese correo."
                )

        return ClienteRepository.update(
            db,
            cliente,
            data,
        )

    @staticmethod
    def deactivate(
        db: Session,
        cliente_id: int,
    ) -> Cliente:

        cliente = ClienteService.get_by_id(
            db,
            cliente_id,
        )

        cliente.activo = False
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

        return cliente