from datetime import date
from typing import Optional

from pydantic import BaseModel


class PedidoBase(BaseModel):

    fecha_pedido: date

    estado_pedido: str

    total: float

    direccion_entrega: str

    metodo_pago: str

    id_usuario: int
    id_establecimiento: int


class PedidoCreate(PedidoBase):
    pass


class PedidoUpdate(BaseModel):
    fecha_pedido: Optional[date] = None
    estado_pedido: Optional[str] = None
    total: Optional[float] = None
    direccion_entrega: Optional[str] = None
    metodo_pago: Optional[str] = None
    id_usuario: Optional[int] = None
    id_establecimiento: Optional[int] = None


class PedidoResponse(PedidoBase):

    id_pedido: int

    class Config:
        from_attributes = True
