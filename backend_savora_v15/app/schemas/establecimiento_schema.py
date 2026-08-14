from typing import Optional

from pydantic import BaseModel

class EstablecimientoBase(BaseModel):

    nombre: str
    tipo: str

    direccion: str
    telefono: str

    email: str
    descripcion: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None

    estado: bool

    id_usuario: int


class EstablecimientoCreate(EstablecimientoBase):
    pass


class EstablecimientoUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    descripcion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    estado: Optional[bool] = None
    id_usuario: Optional[int] = None


class EstablecimientoResponse(EstablecimientoBase):

    id_establecimiento: int

    class Config:
        from_attributes = True
