from app.models.establecimiento import Establecimiento
from app.routes.crud_router import create_crud_router
from app.schemas.establecimiento_schema import (
    EstablecimientoCreate,
    EstablecimientoResponse,
    EstablecimientoUpdate,
)

router = create_crud_router(
    Establecimiento,
    EstablecimientoCreate,
    EstablecimientoUpdate,
    EstablecimientoResponse,
    "/establecimientos",
    ["Establecimientos"],
    "id_establecimiento",
)
