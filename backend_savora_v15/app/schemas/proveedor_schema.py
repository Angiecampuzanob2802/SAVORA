from typing import Optional

from pydantic import BaseModel


class ProveedorBase(BaseModel):
    nombre: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    pagina_web: Optional[str] = None
    ciudad: Optional[str] = None


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    pagina_web: Optional[str] = None
    ciudad: Optional[str] = None


class ProveedorResponse(ProveedorBase):
    id_proveedor: int

    class Config:
        from_attributes = True
