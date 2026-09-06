from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.detalle_pedido import DetallePedido
from app.models.pedido import Pedido


ESTADOS_ACTIVOS = (
    "ABIERTO",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
)


class PedidoRepository:

    @staticmethod
    def list_all(db: Session) -> list[Pedido]:
        statement = select(Pedido).order_by(
            Pedido.created_at.desc()
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        pedido_id: int,
    ) -> Pedido | None:

        return db.get(Pedido, pedido_id)

    @staticmethod
    def list_by_mesa(
        db: Session,
        mesa_id: int,
    ) -> list[Pedido]:

        statement = (
            select(Pedido)
            .where(Pedido.mesa_id == mesa_id)
            .order_by(Pedido.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_active_by_mesa(
        db: Session,
        mesa_id: int,
    ) -> Pedido | None:

        statement = select(Pedido).where(
            Pedido.mesa_id == mesa_id,
            Pedido.estado.in_(ESTADOS_ACTIVOS),
        )

        return db.scalar(statement)

    @staticmethod
    def get_items(
        db: Session,
        pedido_id: int,
    ) -> list[DetallePedido]:

        statement = (
            select(DetallePedido)
            .where(DetallePedido.pedido_id == pedido_id)
            .order_by(DetallePedido.id.asc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_item(
        db: Session,
        pedido_id: int,
        detalle_id: int,
    ) -> DetallePedido | None:

        statement = select(DetallePedido).where(
            DetallePedido.id == detalle_id,
            DetallePedido.pedido_id == pedido_id,
        )

        return db.scalar(statement)

    @staticmethod
    def get_item_by_product(
        db: Session,
        pedido_id: int,
        producto_id: int,
    ) -> DetallePedido | None:

        statement = select(DetallePedido).where(
            DetallePedido.pedido_id == pedido_id,
            DetallePedido.producto_id == producto_id,
        )

        return db.scalar(statement)

    @staticmethod
    def calculate_total(
        db: Session,
        pedido_id: int,
    ) -> Decimal:

        statement = select(
            func.coalesce(
                func.sum(DetallePedido.subtotal),
                0,
            )
        ).where(
            DetallePedido.pedido_id == pedido_id
        )

        value = db.scalar(statement)

        return Decimal(str(value or 0))