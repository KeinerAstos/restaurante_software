from sqlalchemy.orm import Session

from app.common.exceptions import (
    ConflictError,
    EntityNotFoundError,
    ValidationError,
)
from app.models.cliente import Cliente
from app.models.mesa import Mesa
from app.models.reserva import Reserva
from app.repositories.reserva_repository import ReservaRepository
from app.schemas.reserva import ReservaCreate, ReservaUpdate


TRANSICIONES = {
    "PENDIENTE": {"CONFIRMADA", "CANCELADA", "NO_ASISTIO"},
    "CONFIRMADA": {"EN_MESA", "CANCELADA", "NO_ASISTIO"},
    "EN_MESA": {"COMPLETADA", "CANCELADA"},
    "COMPLETADA": set(),
    "CANCELADA": set(),
    "NO_ASISTIO": set(),
}


class ReservaService:

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

        if not mesa.activo:
            raise ConflictError(
                "La mesa se encuentra inactiva."
            )

        return mesa

    @staticmethod
    def _get_cliente(
        db: Session,
        cliente_id: int,
    ) -> Cliente:

        cliente = db.get(Cliente, cliente_id)

        if cliente is None:
            raise EntityNotFoundError(
                f"El cliente con id {cliente_id} no existe."
            )

        if not cliente.activo:
            raise ConflictError(
                "El cliente se encuentra inactivo."
            )

        return cliente

    @staticmethod
    def get_by_id(
        db: Session,
        reserva_id: int,
    ) -> Reserva:

        reserva = ReservaRepository.get_by_id(
            db,
            reserva_id,
        )

        if reserva is None:
            raise EntityNotFoundError(
                f"La reserva con id {reserva_id} no existe."
            )

        return reserva

    @staticmethod
    def list_all(
        db: Session,
        *,
        estado: str | None = None,
        desde=None,
        hasta=None,
    ) -> list[Reserva]:

        return ReservaRepository.list_all(
            db,
            estado=estado,
            desde=desde,
            hasta=hasta,
        )

    @staticmethod
    def create(
        db: Session,
        data: ReservaCreate,
    ) -> Reserva:

        mesa = ReservaService._get_mesa(
            db,
            data.mesa_id,
        )

        ReservaService._get_cliente(
            db,
            data.cliente_id,
        )

        if data.personas > mesa.capacidad:
            raise ValidationError(
                f"La mesa tiene capacidad para {mesa.capacidad} personas."
            )

        conflict = ReservaRepository.get_conflict(
            db,
            mesa_id=data.mesa_id,
            fecha_hora=data.fecha_hora,
        )

        if conflict is not None:
            raise ConflictError(
                f"La mesa ya tiene la reserva {conflict.id} dentro de una ventana de 90 minutos."
            )

        return ReservaRepository.create(db, data)

    @staticmethod
    def update(
        db: Session,
        reserva_id: int,
        data: ReservaUpdate,
    ) -> Reserva:

        reserva = ReservaService.get_by_id(
            db,
            reserva_id,
        )

        if reserva.estado not in {"PENDIENTE", "CONFIRMADA"}:
            raise ConflictError(
                "Solo se pueden editar reservas pendientes o confirmadas."
            )

        mesa_id = data.mesa_id or reserva.mesa_id
        cliente_id = data.cliente_id or reserva.cliente_id
        fecha_hora = data.fecha_hora or reserva.fecha_hora
        personas = data.personas or reserva.personas

        mesa = ReservaService._get_mesa(
            db,
            mesa_id,
        )

        ReservaService._get_cliente(
            db,
            cliente_id,
        )

        if personas > mesa.capacidad:
            raise ValidationError(
                f"La mesa tiene capacidad para {mesa.capacidad} personas."
            )

        conflict = ReservaRepository.get_conflict(
            db,
            mesa_id=mesa_id,
            fecha_hora=fecha_hora,
            exclude_id=reserva.id,
        )

        if conflict is not None:
            raise ConflictError(
                f"La mesa ya tiene la reserva {conflict.id} dentro de una ventana de 90 minutos."
            )

        return ReservaRepository.update(
            db,
            reserva,
            data,
        )

    @staticmethod
    def change_status(
        db: Session,
        reserva_id: int,
        nuevo_estado: str,
    ) -> Reserva:

        reserva = ReservaService.get_by_id(
            db,
            reserva_id,
        )

        if reserva.estado == nuevo_estado:
            return reserva

        permitidos = TRANSICIONES.get(
            reserva.estado,
            set(),
        )

        if nuevo_estado not in permitidos:
            raise ValidationError(
                f"Transicion invalida: {reserva.estado} -> {nuevo_estado}."
            )

        mesa = ReservaService._get_mesa(
            db,
            reserva.mesa_id,
        )

        try:
            if nuevo_estado == "EN_MESA":
                if mesa.estado not in {"LIBRE", "RESERVADA"}:
                    raise ConflictError(
                        f"La mesa se encuentra en estado {mesa.estado}."
                    )

                mesa.estado = "RESERVADA"
                db.add(mesa)

            if nuevo_estado in {"COMPLETADA", "CANCELADA", "NO_ASISTIO"}:
                if mesa.estado == "RESERVADA":
                    mesa.estado = "LIBRE"
                    db.add(mesa)

            reserva.estado = nuevo_estado

            db.add(reserva)
            db.commit()
            db.refresh(reserva)

            return reserva

        except Exception:
            db.rollback()
            raise