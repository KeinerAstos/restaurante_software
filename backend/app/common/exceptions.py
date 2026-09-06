class DomainError(Exception):
    """Error base de la capa de dominio."""


class EntityNotFoundError(DomainError):
    """La entidad solicitada no existe."""


class ConflictError(DomainError):
    """Existe un conflicto con el estado actual de los datos."""


class ValidationError(DomainError):
    """Los datos recibidos no cumplen las reglas del dominio."""