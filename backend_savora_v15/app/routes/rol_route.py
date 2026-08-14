from app.models.rol import Rol
from app.routes.crud_router import create_crud_router
from app.schemas.rol_schema import RolCreate, RolResponse, RolUpdate

router = create_crud_router(
    Rol,
    RolCreate,
    RolUpdate,
    RolResponse,
    "/roles",
    ["Roles"],
    "id_rol",
)
