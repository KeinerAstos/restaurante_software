from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Reserva(Base):
    __tablename__ = "reservas"

    __table_args__ = (
        CheckConstraint(
            "personas > 0",
            name="ck_reservas_personas_positivas",
        ),
        CheckConstraint(
            "estado IN ('PENDIENTE', 'CONFIRMADA', 'EN_MESA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO')",
            name="ck_reservas_estado_valido",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    mesa_id: Mapped[int] = mapped_column(
        ForeignKey("mesas.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    fecha_hora: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    personas: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDIENTE",
        server_default="PENDIENTE",
        index=True,
    )

    observaciones: Mapped[str | None] = mapped_column(
        Text,
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