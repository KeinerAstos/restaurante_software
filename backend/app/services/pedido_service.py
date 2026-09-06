from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.common.exceptions import (
    ConflictError,
    EntityNotFoundError,
    ValidationError,
)
from app.models.detalle_pedido import DetallePedido
from app.models.mesa import Mesa
from app.models.pedido import Pedido
from app.models.producto import Producto
from app.repositories.pedido_repository import PedidoRepository
from app.schemas.pedido import (
    DetallePedidoCreate,
    DetallePedidoUpdate,
)


ESTADOS_TERMINALES = {
    "PAGADO",
    "CANCELADO",
}


TRANSICIONES_VALIDAS = {
    "ABIERTO": {
        "EN_PREPARACION",
        "CANCELADO",
    },
    "EN_PREPARACION": {
        "LISTO",
        "CANCELADO",
    },
    "LISTO": {
        "ENTREGADO",
        "CANCELADO",
    },
    "ENTREGADO": {
        "PAGADO",
        "CANCELADO",
    },
    "PAGADO": set(),
    "CANCELADO": set(),
}


class PedidoService:

    @staticmethod
    def _get_mesa(
        db: Session,
        mesa_id: int,
    ) -> Mesa:

        mesa = db.get(Mesa, mesa_id)

        if mesa is None:
            raise EntityNotFoundError(
                f"La mesa con id {mesa_id} no existe."
            )

        return mesa

    @staticmethod
    def _get_producto(
        db: Session,
        producto_id: int,
    ) -> Producto:

        producto = db.get(Producto, producto_id)

        if producto is None:
            raise EntityNotFoundError(
                f"El producto con id {producto_id} no existe."
            )

        return producto

    @staticmethod
    def get_by_id(
        db: Session,
        pedido_id: int,
    ) -> Pedido:

        pedido = PedidoRepository.get_by_id(
            db,
            pedido_id,
        )

        if pedido is None:
            raise EntityNotFoundError(
                f"El pedido con id {pedido_id} no existe."
            )

        return pedido

    @staticmethod
    def list_all(
        db: Session,
    ) -> list[Pedido]:

        return PedidoRepository.list_all(db)

    @staticmethod
    def list_by_mesa(
        db: Session,
        mesa_id: int,
    ) -> list[Pedido]:

        PedidoService._get_mesa(
            db,
            mesa_id,
        )

        return PedidoRepository.list_by_mesa(
            db,
            mesa_id,
        )

    @staticmethod
    def get_detail(
        db: Session,
        pedido_id: int,
    ) -> dict:

        pedido = PedidoService.get_by_id(
            db,
            pedido_id,
        )

        items = PedidoRepository.get_items(
            db,
            pedido_id,
        )

        return {
            "id": pedido.id,
            "mesa_id": pedido.mesa_id,
            "estado": pedido.estado,
            "total": pedido.total,
            "created_at": pedido.created_at,
            "updated_at": pedido.updated_at,
            "closed_at": pedido.closed_at,
            "items": items,
        }

    @staticmethod
    def create(
        db: Session,
        mesa_id: int,
    ) -> Pedido:

        mesa = PedidoService._get_mesa(
            db,
            mesa_id,
        )

        if not mesa.activo:
            raise ConflictError(
                "La mesa se encuentra inactiva."
            )

        if mesa.estado == "FUERA_DE_SERVICIO":
            raise ConflictError(
                "La mesa se encuentra fuera de servicio."
            )

        existing = PedidoRepository.get_active_by_mesa(
            db,
            mesa_id,
        )

        if existing is not None:
            raise ConflictError(
                f"La mesa ya tiene el pedido activo {existing.id}."
            )

        if mesa.estado not in {
            "LIBRE",
            "RESERVADA",
        }:
            raise ConflictError(
                f"La mesa se encuentra en estado {mesa.estado}."
            )

        pedido = Pedido(
            mesa_id=mesa.id,
            estado="ABIERTO",
            total=Decimal("0.00"),
        )

        mesa.estado = "OCUPADA"

        try:
            db.add(pedido)
            db.add(mesa)

            db.commit()

            db.refresh(pedido)

            return pedido

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def add_item(
        db: Session,
        pedido_id: int,
        data: DetallePedidoCreate,
    ) -> DetallePedido:

        pedido = PedidoService.get_by_id(
            db,
            pedido_id,
        )

        if pedido.estado in ESTADOS_TERMINALES:
            raise ConflictError(
                "No se pueden modificar items de un pedido cerrado."
            )

        producto = PedidoService._get_producto(
            db,
            data.producto_id,
        )

        if not producto.disponible:
            raise ConflictError(
                f"El producto '{producto.nombre}' no esta disponible."
            )

        existing = PedidoRepository.get_item_by_product(
            db,
            pedido.id,
            producto.id,
        )

        try:
            if existing is not None:
                existing.cantidad += data.cantidad

                if data.observacion is not None:
                    existing.observacion = data.observacion

                existing.subtotal = (
                    existing.precio_unitario
                    * existing.cantidad
                )

                detalle = existing

            else:
                precio = Decimal(str(producto.precio))

                detalle = DetallePedido(
                    pedido_id=pedido.id,
                    producto_id=producto.id,
                    cantidad=data.cantidad,
                    precio_unitario=precio,
                    subtotal=precio * data.cantidad,
                    observacion=data.observacion,
                )

                db.add(detalle)

            db.flush()

            pedido.total = PedidoRepository.calculate_total(
                db,
                pedido.id,
            )

            db.add(pedido)

            db.commit()

            db.refresh(detalle)

            return detalle

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_item(
        db: Session,
        pedido_id: int,
        detalle_id: int,
        data: DetallePedidoUpdate,
    ) -> DetallePedido:

        pedido = PedidoService.get_by_id(
            db,
            pedido_id,
        )

        if pedido.estado in ESTADOS_TERMINALES:
            raise ConflictError(
                "No se pueden modificar items de un pedido cerrado."
            )

        detalle = PedidoRepository.get_item(
            db,
            pedido_id,
            detalle_id,
        )

        if detalle is None:
            raise EntityNotFoundError(
                f"El detalle con id {detalle_id} no existe en el pedido."
            )

        changes = data.model_dump(
            exclude_unset=True
        )

        try:
            if "cantidad" in changes:
                detalle.cantidad = changes["cantidad"]

            if "observacion" in changes:
                detalle.observacion = changes["observacion"]

            detalle.subtotal = (
                detalle.precio_unitario
                * detalle.cantidad
            )

            db.add(detalle)
            db.flush()

            pedido.total = PedidoRepository.calculate_total(
                db,
                pedido.id,
            )

            db.add(pedido)

            db.commit()

            db.refresh(detalle)

            return detalle

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def remove_item(
        db: Session,
        pedido_id: int,
        detalle_id: int,
    ) -> None:

        pedido = PedidoService.get_by_id(
            db,
            pedido_id,
        )

        if pedido.estado in ESTADOS_TERMINALES:
            raise ConflictError(
                "No se pueden modificar items de un pedido cerrado."
            )

        detalle = PedidoRepository.get_item(
            db,
            pedido_id,
            detalle_id,
        )

        if detalle is None:
            raise EntityNotFoundError(
                f"El detalle con id {detalle_id} no existe en el pedido."
            )

        try:
            db.delete(detalle)
            db.flush()

            pedido.total = PedidoRepository.calculate_total(
                db,
                pedido.id,
            )

            db.add(pedido)

            db.commit()

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def change_status(
        db: Session,
        pedido_id: int,
        nuevo_estado: str,
    ) -> Pedido:

        pedido = PedidoService.get_by_id(
            db,
            pedido_id,
        )

        if nuevo_estado == pedido.estado:
            return pedido

        permitidos = TRANSICIONES_VALIDAS.get(
            pedido.estado,
            set(),
        )

        if nuevo_estado not in permitidos:
            raise ValidationError(
                f"Transicion invalida: {pedido.estado} -> {nuevo_estado}."
            )

        if (
            nuevo_estado == "PAGADO"
            and pedido.total <= 0
        ):
            raise ValidationError(
                "No se puede pagar un pedido sin productos."
            )

        try:
            pedido.estado = nuevo_estado

            if nuevo_estado in ESTADOS_TERMINALES:
                pedido.closed_at = datetime.now(
                    timezone.utc
                )

                mesa = PedidoService._get_mesa(
                    db,
                    pedido.mesa_id,
                )

                mesa.estado = "LIBRE"
                db.add(mesa)

            db.add(pedido)

            db.commit()

            db.refresh(pedido)

            return pedido

        except Exception:
            db.rollback()
            raise