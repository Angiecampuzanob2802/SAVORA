"""Punto de entrada de la API REST de SAVORA."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.solicitud_negocio import SolicitudNegocio
from app.models.adulto_mayor import AdultoMayor
from app.models.categoria import Categoria
from app.models.detalle_pedido import DetallePedido
from app.models.entrega import Entrega
from app.models.establecimiento import Establecimiento
from app.models.movimiento import Movimiento
from app.models.notificacion import Notificacion
from app.models.pedido import Pedido
from app.models.preferencia_alimentaria import PreferenciaAlimentaria
from app.models.producto import Producto
from app.models.producto_proveedor import ProductoProveedor
from app.models.programacion_entrega import ProgramacionEntrega
from app.models.promocion import Promocion
from app.models.proveedor import Proveedor
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.routes.adulto_mayor_route import router as adulto_mayor_router
from app.routes.auth_route import router as auth_router
from app.routes.categoria_route import router as categoria_router
from app.routes.checkout_route import router as checkout_router
from app.routes.detalle_pedido_route import router as detalle_pedido_router
from app.routes.entrega_route import router as entrega_router
from app.routes.establecimiento_route import router as establecimiento_router
from app.routes.movimiento_route import router as movimiento_router
from app.routes.notificacion_route import router as notificacion_router
from app.routes.pedido_route import router as pedido_router
from app.routes.preferencia_alimentaria_route import router as preferencia_alimentaria_router
from app.routes.producto_proveedor_route import router as producto_proveedor_router
from app.routes.producto_route import router as producto_router
from app.routes.programacion_entrega_route import router as programacion_entrega_router
from app.routes.promocion_route import router as promocion_router
from app.routes.proveedor_route import router as proveedor_router
from app.routes.rol_route import router as rol_router
from app.routes.usuario_route import router as usuario_router
from app.routes.mapa_publico_route import router as mapa_publico_router
from app.routes.solicitud_negocio_route import router as solicitud_negocio_router

app = FastAPI(
    title="SAVORA API",
    description="API para la plataforma de recuperacion y gestion de alimentos.",
    version="1.1.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:8100",
        "http://127.0.0.1:8100",
        "http://localhost:4300",
        "http://127.0.0.1:4300",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rol_router)
app.include_router(auth_router)
app.include_router(usuario_router)
app.include_router(adulto_mayor_router)
app.include_router(establecimiento_router)
app.include_router(categoria_router)
app.include_router(producto_router)
app.include_router(checkout_router)
app.include_router(proveedor_router)
app.include_router(producto_proveedor_router)
app.include_router(movimiento_router)
app.include_router(pedido_router)
app.include_router(detalle_pedido_router)
app.include_router(entrega_router)
app.include_router(preferencia_alimentaria_router)
app.include_router(programacion_entrega_router)
app.include_router(promocion_router)
app.include_router(notificacion_router)
app.include_router(mapa_publico_router)
app.include_router(solicitud_negocio_router)



@app.get("/")
def home():
    """Confirma que la API está disponible y devuelve un mensaje de bienvenida."""
    return {"mensaje": "Bienvenida a SAVORA API"}


@app.get("/health")
def health_check():
    """Expone una comprobación liviana para monitoreo y despliegues."""
    return {"status": "ok"}
