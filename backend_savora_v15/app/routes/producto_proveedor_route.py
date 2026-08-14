from app.models.producto_proveedor import ProductoProveedor
from app.routes.crud_router import create_crud_router
from app.schemas.producto_proveedor_schema import (
    ProductoProveedorCreate,
    ProductoProveedorResponse,
    ProductoProveedorUpdate,
)

router = create_crud_router(
    ProductoProveedor,
    ProductoProveedorCreate,
    ProductoProveedorUpdate,
    ProductoProveedorResponse,
    "/productos-proveedores",
    ["Productos Proveedores"],
    "id_producto_proveedor",
)
