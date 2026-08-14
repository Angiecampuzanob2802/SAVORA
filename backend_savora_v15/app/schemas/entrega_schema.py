from datetime import date, time
from typing import Optional

from pydantic import BaseModel


class EntregaBase(BaseModel):
    fecha_entrega: Optional[date] = None
    hora_entrega: Optional[time] = None
    fecha_programada: Optional[date] = None
    estado_entrega: Optional[str] = None
    direccion_entrega: Optional[str] = None
    observaciones: Optional[str] = None
    id_pedido: Optional[int] = None


class EntregaCreate(EntregaBase):
    pass


class EntregaUpdate(EntregaBase):
    pass


class EntregaResponse(EntregaBase):
    id_entrega: int

    class Config:
        from_attributes = True
