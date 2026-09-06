from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate


class ProductoRepository:

    @staticmethod
    def list_all(db: Session) -> list[Producto]:
        statement = select(Producto).order_by(
            Producto.categoria.asc(),
            Producto.nombre.asc(),
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        producto_id: int,
    ) -> Producto | None:

        return db.get(Producto, producto_id)

    @staticmethod
    def get_by_nombre(
        db: Session,
        nombre: str,
    ) -> Producto | None:

        statement = select(Producto).where(
            Producto.nombre == nombre
        )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        data: ProductoCreate,
    ) -> Producto:

        producto = Producto(**data.model_dump())

        db.add(producto)
        db.commit()
        db.refresh(producto)

        return producto

    @staticmethod
    def update(
        db: Session,
        producto: Producto,
        data: ProductoUpdate,
    ) -> Producto:

        changes = data.model_dump(exclude_unset=True)

        for field, value in changes.items():
            setattr(producto, field, value)

        db.add(producto)
        db.commit()
        db.refresh(producto)

        return producto

    @staticmethod
    def delete(
        db: Session,
        producto: Producto,
    ) -> None:

        db.delete(producto)
        db.commit()