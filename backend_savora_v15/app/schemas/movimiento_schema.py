from datetime import date
from typing import Optional

from pydantic import BaseModel


class MovimientoBase(BaseModel):

    tipo_movimiento: str
    motivo: str

    cantidad: int

    fecha: date

    descripcion: str

    id_producto: int
    id_usuario: int


class MovimientoCreate(MovimientoBase):
    pass


class MovimientoUpdate(BaseModel):
    tipo_movimiento: Optional[str] = None
    motivo: Optional[str] = None
    cantidad: Optional[int] = None
    fecha: Optional[date] = None
    descripcion: Optional[str] = None
    id_producto: Optional[int] = None
    id_usuario: Optional[int] = None


class MovimientoResponse(MovimientoBase):

    id_movimiento: int

    class Config:
        from_attributes = True
