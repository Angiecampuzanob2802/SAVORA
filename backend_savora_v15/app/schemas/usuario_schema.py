from datetime import date
from typing import Optional

from pydantic import BaseModel

class UsuarioBase(BaseModel):
    nombre: str
    correo: str
    telefono: str
    direccion: str
    fecha_registro: date
    estado: bool
    id_rol: int


class UsuarioCreate(UsuarioBase):
    contrasena: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    contrasena: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_registro: Optional[date] = None
    estado: Optional[bool] = None
    id_rol: Optional[int] = None


class UsuarioResponse(UsuarioBase):
    id_usuario: int

    class Config:
        from_attributes = True
