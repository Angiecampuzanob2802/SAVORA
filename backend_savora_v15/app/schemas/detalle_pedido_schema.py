from typing import Optional

from pydantic import BaseModel


class DetallePedidoBase(BaseModel):
    id_pedido: Optional[int] = None
    id_producto: Optional[int] = None
    cantidad: int
    precio_unitario: float
    subtotal: float


class DetallePedidoCreate(DetallePedidoBase):
    pass


class DetallePedidoUpdate(BaseModel):
    id_pedido: Optional[int] = None
    id_producto: Optional[int] = None
    cantidad: Optional[int] = None
    precio_unitario: Optional[float] = None
    subtotal: Optional[float] = None


class DetallePedidoResponse(DetallePedidoBase):
    id_detalle_pedido: int

    class Config:
        from_attributes = True
