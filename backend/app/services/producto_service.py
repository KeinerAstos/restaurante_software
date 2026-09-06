from sqlalchemy.orm import Session

from app.common.exceptions import ConflictError, EntityNotFoundError
from app.models.producto import Producto
from app.repositories.producto_repository import ProductoRepository
from app.schemas.producto import ProductoCreate, ProductoUpdate


class ProductoService:

    @staticmethod
    def list_all(db: Session) -> list[Producto]:
        return ProductoRepository.list_all(db)

    @staticmethod
    def get_by_id(
        db: Session,
        producto_id: int,
    ) -> Producto:

        producto = ProductoRepository.get_by_id(
            db,
            producto_id,
        )

        if producto is None:
            raise EntityNotFoundError(
                f"El producto con id {producto_id} no existe."
            )

        return producto

    @staticmethod
    def create(
        db: Session,
        data: ProductoCreate,
    ) -> Producto:

        existing = ProductoRepository.get_by_nombre(
            db,
            data.nombre,
        )

        if existing is not None:
            raise ConflictError(
                f"Ya existe un producto con el nombre '{data.nombre}'."
            )

        return ProductoRepository.create(db, data)

    @staticmethod
    def update(
        db: Session,
        producto_id: int,
        data: ProductoUpdate,
    ) -> Producto:

        producto = ProductoService.get_by_id(
            db,
            producto_id,
        )

        if (
            data.nombre is not None
            and data.nombre != producto.nombre
        ):
            existing = ProductoRepository.get_by_nombre(
                db,
                data.nombre,
            )

            if existing is not None:
                raise ConflictError(
                    f"Ya existe un producto con el nombre '{data.nombre}'."
                )

        return ProductoRepository.update(
            db,
            producto,
            data,
        )

    @staticmethod
    def delete(
        db: Session,
        producto_id: int,
    ) -> None:

        producto = ProductoService.get_by_id(
            db,
            producto_id,
        )

        ProductoRepository.delete(
            db,
            producto,
        )