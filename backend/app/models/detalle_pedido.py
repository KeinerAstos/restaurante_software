from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    __table_args__ = (
        CheckConstraint(
            "cantidad > 0",
            name="ck_detalle_pedido_cantidad_positiva",
        ),
        CheckConstraint(
            "precio_unitario > 0",
            name="ck_detalle_pedido_precio_positivo",
        ),
        CheckConstraint(
            "subtotal > 0",
            name="ck_detalle_pedido_subtotal_positivo",
        ),
        UniqueConstraint(
            "pedido_id",
            "producto_id",
            name="uq_detalle_pedido_producto",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    pedido_id: Mapped[int] = mapped_column(
        ForeignKey(
            "pedidos.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    producto_id: Mapped[int] = mapped_column(
        ForeignKey(
            "productos.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    cantidad: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    precio_unitario: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    observacion: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )