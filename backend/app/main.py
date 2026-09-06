from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.clientes import router as clientes_router
from app.api.configuracion import router as configuracion_router
from app.api.health import router as health_router
from app.api.layout import router as layout_router
from app.api.mesa_pedidos import router as mesa_pedidos_router
from app.api.mesas import router as mesas_router
from app.api.pedidos import router as pedidos_router
from app.api.productos import router as productos_router
from app.api.reportes import router as reportes_router
from app.api.reservas import router as reservas_router
from app.config.settings import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API REST para la administracion de Trattoria Bellavista.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router)

app.include_router(mesas_router)
app.include_router(mesa_pedidos_router)
app.include_router(productos_router)
app.include_router(pedidos_router)

app.include_router(clientes_router)
app.include_router(reservas_router)
app.include_router(layout_router)
app.include_router(configuracion_router)
app.include_router(reportes_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "restaurant": "Trattoria Bellavista",
    }