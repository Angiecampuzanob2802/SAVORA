from datetime import date
from typing import Optional

from pydantic import BaseModel


class SolicitudNegocioBase(BaseModel):
    nombre_propietario: str
    correo: str
    celular: Optional[str] = None
    nombre_establecimiento: str
    tipo_negocio: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    mensaje: Optional[str] = None


class SolicitudNegocioCreate(SolicitudNegocioBase):
    pass


class SolicitudNegocioUpdate(BaseModel):
    estado_solicitud: Optional[str] = None


class SolicitudNegocioResponse(SolicitudNegocioBase):
    id_solicitud: int
    estado_solicitud: str
    fecha_solicitud: Optional[date] = None

    class Config:
        from_attributes = True