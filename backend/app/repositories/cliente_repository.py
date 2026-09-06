from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate


class ClienteRepository:

    @staticmethod
    def list_all(
        db: Session,
        *,
        include_inactive: bool = False,
        search: str | None = None,
    ) -> list[Cliente]:

        statement = select(Cliente)

        if not include_inactive:
            statement = statement.where(Cliente.activo.is_(True))

        if search:
            value = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Cliente.nombre.ilike(value),
                    Cliente.telefono.ilike(value),
                    Cliente.email.ilike(value),
                )
            )

        statement = statement.order_by(Cliente.nombre.asc())

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        cliente_id: int,
    ) -> Cliente | None:

        return db.get(Cliente, cliente_id)

    @staticmethod
    def get_by_email(
        db: Session,
        email: str,
    ) -> Cliente | None:

        statement = select(Cliente).where(
            Cliente.email == email
        )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        data: ClienteCreate,
    ) -> Cliente:

        cliente = Cliente(**data.model_dump())

        db.add(cliente)
        db.commit()
        db.refresh(cliente)

        return cliente

    @staticmethod
    def update(
        db: Session,
        cliente: Cliente,
        data: ClienteUpdate,
    ) -> Cliente:

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(cliente, field, value)

        db.add(cliente)
        db.commit()
        db.refresh(cliente)

        return cliente