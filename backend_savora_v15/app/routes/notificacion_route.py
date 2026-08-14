from app.models.notificacion import Notificacion
from app.routes.crud_router import create_crud_router
from app.schemas.notificacion_schema import (
    NotificacionCreate,
    NotificacionResponse,
    NotificacionUpdate,
)

router = create_crud_router(
    Notificacion,
    NotificacionCreate,
    NotificacionUpdate,
    NotificacionResponse,
    "/notificaciones",
    ["Notificaciones"],
    "id_notificacion",
)
