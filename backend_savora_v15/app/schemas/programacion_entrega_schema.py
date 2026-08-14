from datetime import date, time
from typing import Optional

from pydantic import BaseModel


class ProgramacionEntregaBase(BaseModel):
    frecuencia: Optional[str] = None
    horario: Optional[time] = None
    estado: Optional[bool] = None
    fecha_inicio: Optional[date] = None
    id_adulto_mayor: Optional[int] = None


class ProgramacionEntregaCreate(ProgramacionEntregaBase):
    pass


class ProgramacionEntregaUpdate(ProgramacionEntregaBase):
    pass


class ProgramacionEntregaResponse(ProgramacionEntregaBase):
    id_programacion_entregas: int

    class Config:
        from_attributes = True
