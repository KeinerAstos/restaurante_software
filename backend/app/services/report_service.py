from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.detalle_pedido import DetallePedido
from app.models.mesa import Mesa
from app.models.pedido import Pedido
from app.models.producto import Producto
from app.models.reserva import Reserva


class ReportService:

    @staticmethod
    def dashboard(db: Session) -> dict:
        today = func.current_date()

        ventas = db.scalar(
            select(
                func.coalesce(
                    func.sum(Pedido.total),
                    0,
                )
            ).where(
                Pedido.estado == "PAGADO",
                func.date(Pedido.created_at) == today,
            )
        )

        pedidos_hoy = db.scalar(
            select(func.count(Pedido.id)).where(
                func.date(Pedido.created_at) == today
            )
        ) or 0

        ticket = db.scalar(
            select(func.avg(Pedido.total)).where(
                Pedido.estado == "PAGADO",
                func.date(Pedido.created_at) == today,
            )
        )

        reservas_hoy = db.scalar(
            select(func.count(Reserva.id)).where(
                func.date(Reserva.fecha_hora) == today,
                Reserva.estado.in_(
                    ("PENDIENTE", "CONFIRMADA", "EN_MESA")
                ),
            )
        ) or 0

        mesa_top = db.execute(
            select(
                Mesa.numero,
                func.count(Pedido.id).label("cantidad"),
            )
            .join(Pedido, Pedido.mesa_id == Mesa.id)
            .where(Pedido.estado == "PAGADO")
            .group_by(Mesa.id, Mesa.numero)
            .order_by(desc("cantidad"))
            .limit(1)
        ).first()

        producto_top = db.execute(
            select(
                Producto.nombre,
                func.sum(DetallePedido.cantidad).label("cantidad"),
            )
            .join(
                DetallePedido,
                DetallePedido.producto_id == Producto.id,
            )
            .join(
                Pedido,
                Pedido.id == DetallePedido.pedido_id,
            )
            .where(Pedido.estado == "PAGADO")
            .group_by(Producto.id, Producto.nombre)
            .order_by(desc("cantidad"))
            .limit(1)
        ).first()

        return {
            "ventas_hoy": Decimal(str(ventas or 0)),
            "pedidos_hoy": int(pedidos_hoy),
            "ticket_promedio": Decimal(str(ticket or 0)),
            "reservas_hoy": int(reservas_hoy),
            "mesa_mas_utilizada": (
                {
                    "numero": mesa_top.numero,
                    "pedidos": int(mesa_top.cantidad),
                }
                if mesa_top
                else None
            ),
            "producto_mas_vendido": (
                {
                    "nombre": producto_top.nombre,
                    "cantidad": int(producto_top.cantidad),
                }
                if producto_top
                else None
            ),
        }

    @staticmethod
    def productos(db: Session, limit: int = 10) -> list[dict]:
        rows = db.execute(
            select(
                Producto.id,
                Producto.nombre,
                func.coalesce(
                    func.sum(DetallePedido.cantidad),
                    0,
                ).label("unidades"),
                func.coalesce(
                    func.sum(DetallePedido.subtotal),
                    0,
                ).label("ventas"),
            )
            .outerjoin(
                DetallePedido,
                DetallePedido.producto_id == Producto.id,
            )
            .group_by(Producto.id, Producto.nombre)
            .order_by(desc("unidades"))
            .limit(limit)
        ).all()

        return [
            {
                "producto_id": row.id,
                "nombre": row.nombre,
                "unidades": int(row.unidades or 0),
                "ventas": Decimal(str(row.ventas or 0)),
            }
            for row in rows
        ]