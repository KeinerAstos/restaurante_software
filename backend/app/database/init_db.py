from decimal import Decimal

from sqlalchemy import select

from app.database.base import Base
from app.database.session import SessionLocal, engine

# Registrar todos los modelos actuales.
from app.models.cliente import Cliente  # noqa: F401
from app.models.detalle_pedido import DetallePedido  # noqa: F401
from app.models.mesa import Mesa
from app.models.mesa_layout import MesaLayout
from app.models.pedido import Pedido  # noqa: F401
from app.models.producto import Producto
from app.models.reserva import Reserva  # noqa: F401
from app.models.restaurante_config import RestauranteConfig


DEFAULT_MESAS = [
    {"numero": 1, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 2, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 3, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 4, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 5, "capacidad": 4, "ubicacion": "Terraza"},
    {"numero": 6, "capacidad": 4, "ubicacion": "Terraza"},
    {"numero": 7, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 8, "capacidad": 4, "ubicacion": "Salon principal"},
    {"numero": 9, "capacidad": 6, "ubicacion": "Salon principal"},
    {"numero": 10, "capacidad": 6, "ubicacion": "Salon principal"},
    {"numero": 11, "capacidad": 6, "ubicacion": "Sala privada VIP"},
    {"numero": 12, "capacidad": 6, "ubicacion": "Sala privada VIP"},
]


DEFAULT_LAYOUT_BY_NUMBER = {
    1: ("SALON", Decimal("28"), Decimal("28"), "RECT"),
    2: ("SALON", Decimal("41"), Decimal("28"), "RECT"),
    3: ("SALON", Decimal("55"), Decimal("27"), "ROUND"),
    4: ("SALON", Decimal("68"), Decimal("27"), "ROUND"),
    5: ("TERRAZA", Decimal("9"), Decimal("25"), "ROUND"),
    6: ("TERRAZA", Decimal("9"), Decimal("67"), "ROUND"),
    7: ("SALON", Decimal("28"), Decimal("61"), "RECT"),
    8: ("SALON", Decimal("41"), Decimal("61"), "RECT"),
    9: ("SALON", Decimal("55"), Decimal("61"), "ROUND"),
    10: ("SALON", Decimal("68"), Decimal("61"), "RECT"),
    11: ("VIP", Decimal("93"), Decimal("66"), "SMALL"),
    12: ("VIP", Decimal("93"), Decimal("28"), "SMALL"),
}


DEFAULT_PRODUCTS = [
    {
        "nombre": "Bruschetta al Pomodoro",
        "descripcion": "Pan artesanal tostado, tomate fresco, albahaca y aceite de oliva.",
        "precio": Decimal("16000"),
        "categoria": "ENTRADA",
    },
    {
        "nombre": "Burrata Bellavista",
        "descripcion": "Burrata cremosa, tomates, pesto de albahaca y focaccia.",
        "precio": Decimal("24000"),
        "categoria": "ENTRADA",
    },
    {
        "nombre": "Pizza Margherita",
        "descripcion": "Tomate San Marzano, mozzarella y albahaca.",
        "precio": Decimal("30000"),
        "categoria": "PLATO_FUERTE",
    },
    {
        "nombre": "Lasagna della Casa",
        "descripcion": "Lasagna horneada con ragu, bechamel y parmesano.",
        "precio": Decimal("34000"),
        "categoria": "PLATO_FUERTE",
    },
    {
        "nombre": "Risotto ai Funghi",
        "descripcion": "Arroz arborio, hongos, parmesano y mantequilla.",
        "precio": Decimal("36000"),
        "categoria": "PLATO_FUERTE",
    },
    {
        "nombre": "Spaghetti Carbonara",
        "descripcion": "Pasta, huevo, queso, pimienta y panceta.",
        "precio": Decimal("32000"),
        "categoria": "PLATO_FUERTE",
    },
    {
        "nombre": "Limonata della Casa",
        "descripcion": "Limonada italiana con hierbabuena.",
        "precio": Decimal("9000"),
        "categoria": "BEBIDA",
    },
    {
        "nombre": "Espresso Italiano",
        "descripcion": "Cafe espresso de tueste intenso.",
        "precio": Decimal("6000"),
        "categoria": "BEBIDA",
    },
    {
        "nombre": "Tiramisu",
        "descripcion": "Clasico italiano de cafe, mascarpone y cacao.",
        "precio": Decimal("16000"),
        "categoria": "POSTRE",
    },
    {
        "nombre": "Panna Cotta",
        "descripcion": "Panna cotta de vainilla con salsa de frutos rojos.",
        "precio": Decimal("15000"),
        "categoria": "POSTRE",
    },
]


def seed_config(db):
    config = db.get(RestauranteConfig, 1)

    if config is None:
        db.add(
            RestauranteConfig(
                id=1,
                nombre="Trattoria Bellavista",
                especialidad="Cucina Italiana",
                moneda="COP",
                ciudad="Bogota",
            )
        )


def seed_mesas(db):
    existing_numbers = set(
        db.scalars(
            select(Mesa.numero).where(Mesa.numero.in_([m["numero"] for m in DEFAULT_MESAS]))
        ).all()
    )

    for row in DEFAULT_MESAS:
        if row["numero"] in existing_numbers:
            continue

        db.add(
            Mesa(
                numero=row["numero"],
                capacidad=row["capacidad"],
                ubicacion=row["ubicacion"],
                estado="LIBRE",
                activo=True,
            )
        )

    db.flush()


def seed_layout(db):
    mesas = list(
        db.scalars(
            select(Mesa).where(
                Mesa.activo.is_(True),
                Mesa.numero.in_(DEFAULT_LAYOUT_BY_NUMBER.keys()),
            )
        ).all()
    )

    for mesa in mesas:
        if db.get(MesaLayout, mesa.id) is not None:
            continue

        zona, pos_x, pos_y, forma = DEFAULT_LAYOUT_BY_NUMBER[mesa.numero]

        db.add(
            MesaLayout(
                mesa_id=mesa.id,
                zona=zona,
                pos_x=pos_x,
                pos_y=pos_y,
                forma=forma,
            )
        )


def seed_products(db):
    existing_names = set(
        db.scalars(
            select(Producto.nombre).where(
                Producto.nombre.in_([p["nombre"] for p in DEFAULT_PRODUCTS])
            )
        ).all()
    )

    for row in DEFAULT_PRODUCTS:
        if row["nombre"] in existing_names:
            continue

        db.add(
            Producto(
                nombre=row["nombre"],
                descripcion=row["descripcion"],
                precio=row["precio"],
                categoria=row["categoria"],
                disponible=True,
            )
        )


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        seed_config(db)
        seed_mesas(db)
        seed_layout(db)
        seed_products(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("DATABASE_SCHEMA_OK")
    print("DATABASE_SEED_OK")