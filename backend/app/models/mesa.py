from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Mesa(Base):
    __tablename__ = "mesas"

    __table_args__ = (
        CheckConstraint(
            "capacidad > 0",
            name="ck_mesas_capacidad_positiva",
        ),
        CheckConstraint(
            "estado IN ('LIBRE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO')",
            name="ck_mesas_estado_valido",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    numero: Mapped[int] = mapped_column(
        Integer,
        unique=True,
        nullable=False,
        index=True,
    )

    capacidad: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    ubicacion: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="LIBRE",
        server_default="LIBRE",
    )

    activo: Mapped[bool] = mapped_column(
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