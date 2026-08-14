from datetime import date
from typing import Optional

from pydantic import BaseModel


class AdultoMayorBase(BaseModel):
    nombre: str
    documento: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    observaciones_medicas: Optional[str] = None
    id_usuario: Optional[int] = None


class AdultoMayorCreate(AdultoMayorBase):
    pass


class AdultoMayorUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    observaciones_medicas: Optional[str] = None
    id_usuario: Optional[int] = None


class AdultoMayorResponse(AdultoMayorBase):
    id_adulto_mayor: int

    class Config:
        from_attributes = True
