from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Producto(Base):
    __tablename__ = "productos"

    __table_args__ = (
        CheckConstraint(
            "precio > 0",
            name="ck_productos_precio_positivo",
        ),
        CheckConstraint(
            "categoria IN ('ENTRADA', 'PLATO_FUERTE', 'BEBIDA', 'POSTRE', 'OTRO')",
            name="ck_productos_categoria_valida",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    precio: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    categoria: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="OTRO",
        server_default="OTRO",
    )

    disponible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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