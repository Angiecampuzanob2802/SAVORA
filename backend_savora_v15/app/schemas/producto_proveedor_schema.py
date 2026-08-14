from datetime import date
from typing import Optional

from pydantic import BaseModel


class ProductoProveedorBase(BaseModel):
    precio_compra: Optional[float] = None
    fecha_compra: Optional[date] = None
    id_producto: Optional[int] = None
    id_proveedor: Optional[int] = None


class ProductoProveedorCreate(ProductoProveedorBase):
    pass


class ProductoProveedorUpdate(ProductoProveedorBase):
    pass


class ProductoProveedorResponse(ProductoProveedorBase):
    id_producto_proveedor: int

    class Config:
        from_attributes = True
