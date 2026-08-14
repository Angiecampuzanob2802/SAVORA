from pydantic import BaseModel
from typing import Optional
from datetime import date, time


class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

    precio_costo: float
    precio_venta: float

    stock: int
    estado_producto: bool

    fecha_vencimiento: Optional[date] = None
    fecha_preparacion: Optional[date] = None
    hora_limite_consumo: Optional[time] = None

    id_categoria: int
    id_establecimiento: int


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_costo: Optional[float] = None
    precio_venta: Optional[float] = None
    stock: Optional[int] = None
    estado_producto: Optional[bool] = None
    fecha_vencimiento: Optional[date] = None
    fecha_preparacion: Optional[date] = None
    hora_limite_consumo: Optional[time] = None
    id_categoria: Optional[int] = None
    id_establecimiento: Optional[int] = None


class ProductoResponse(ProductoBase):
    id_producto: int

    class Config:
        from_attributes = True