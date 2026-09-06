from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    __table_args__ = (
        CheckConstraint(
            "estado IN ('ABIERTO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'PAGADO', 'CANCELADO')",
            name="ck_pedidos_estado_valido",
        ),
        CheckConstraint(
            "total >= 0",
            name="ck_pedidos_total_no_negativo",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    mesa_id: Mapped[int] = mapped_column(
        ForeignKey(
            "mesas.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ABIERTO",
        server_default="ABIERTO",
        index=True,
    )

    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
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

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )