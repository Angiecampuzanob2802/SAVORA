from app.models.preferencia_alimentaria import PreferenciaAlimentaria
from app.routes.crud_router import create_crud_router
from app.schemas.preferencia_alimentaria_schema import (
    PreferenciaAlimentariaCreate,
    PreferenciaAlimentariaResponse,
    PreferenciaAlimentariaUpdate,
)

router = create_crud_router(
    PreferenciaAlimentaria,
    PreferenciaAlimentariaCreate,
    PreferenciaAlimentariaUpdate,
    PreferenciaAlimentariaResponse,
    "/preferencias-alimentarias",
    ["Preferencias Alimentarias"],
    "id_preferencia_alimentaria",
)
