from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class MesaLayout(Base):
    __tablename__ = "mesa_layout"

    __table_args__ = (
        CheckConstraint(
            "pos_x >= 0 AND pos_x <= 100",
            name="ck_mesa_layout_pos_x",
        ),
        CheckConstraint(
            "pos_y >= 0 AND pos_y <= 100",
            name="ck_mesa_layout_pos_y",
        ),
        CheckConstraint(
            "zona IN ('SALON', 'TERRAZA', 'VIP', 'BAR', 'OTRA')",
            name="ck_mesa_layout_zona",
        ),
        CheckConstraint(
            "forma IN ('ROUND', 'RECT', 'SMALL')",
            name="ck_mesa_layout_forma",
        ),
    )

    mesa_id: Mapped[int] = mapped_column(
        ForeignKey("mesas.id", ondelete="CASCADE"),
        primary_key=True,
    )

    zona: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SALON",
        server_default="SALON",
    )

    pos_x: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    pos_y: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    forma: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ROUND",
        server_default="ROUND",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )