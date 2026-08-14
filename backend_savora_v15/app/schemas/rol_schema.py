from typing import Optional

from pydantic import BaseModel


class RolBase(BaseModel):
    nombre_rol: str


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre_rol: Optional[str] = None


class RolResponse(RolBase):
    id_rol: int

    class Config:
        from_attributes = True
