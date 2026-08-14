from app.models.programacion_entrega import ProgramacionEntrega
from app.routes.crud_router import create_crud_router
from app.schemas.programacion_entrega_schema import (
    ProgramacionEntregaCreate,
    ProgramacionEntregaResponse,
    ProgramacionEntregaUpdate,
)

router = create_crud_router(
    ProgramacionEntrega,
    ProgramacionEntregaCreate,
    ProgramacionEntregaUpdate,
    ProgramacionEntregaResponse,
    "/programacion-entregas",
    ["Programacion Entregas"],
    "id_programacion_entregas",
)
