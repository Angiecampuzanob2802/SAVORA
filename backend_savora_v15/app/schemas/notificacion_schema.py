from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificacionBase(BaseModel):
    titulo: Optional[str] = None
    mensaje: str
    fecha_notificacion: Optional[datetime] = None
    estado: Optional[str] = None
    id_usuario: Optional[int] = None


class NotificacionCreate(NotificacionBase):
    pass


class NotificacionUpdate(BaseModel):
    titulo: Optional[str] = None
    mensaje: Optional[str] = None
    fecha_notificacion: Optional[datetime] = None
    estado: Optional[str] = None
    id_usuario: Optional[int] = None


class NotificacionResponse(NotificacionBase):
    id_notificacion: int

    class Config:
        from_attributes = True
