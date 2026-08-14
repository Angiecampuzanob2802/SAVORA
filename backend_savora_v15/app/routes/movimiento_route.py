from app.models.movimiento import Movimiento
from app.routes.crud_router import create_crud_router
from app.schemas.movimiento_schema import (
    MovimientoCreate,
    MovimientoResponse,
    MovimientoUpdate,
)

router = create_crud_router(
    Movimiento,
    MovimientoCreate,
    MovimientoUpdate,
    MovimientoResponse,
    "/movimientos",
    ["Movimientos"],
    "id_movimiento",
)
