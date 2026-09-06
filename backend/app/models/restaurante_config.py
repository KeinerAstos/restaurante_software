from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class RestauranteConfig(Base):
    __tablename__ = "restaurante_config"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Trattoria Bellavista",
        server_default="Trattoria Bellavista",
    )

    especialidad: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        default="Cucina Italiana",
        server_default="Cucina Italiana",
    )

    moneda: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="COP",
        server_default="COP",
    )

    ciudad: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    telefono: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
    )

    direccion: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    horario: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )