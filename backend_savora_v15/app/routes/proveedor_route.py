from app.models.proveedor import Proveedor
from app.routes.crud_router import create_crud_router
from app.schemas.proveedor_schema import ProveedorCreate, ProveedorResponse, ProveedorUpdate

router = create_crud_router(
    Proveedor,
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorResponse,
    "/proveedores",
    ["Proveedores"],
    "id_proveedor",
)
