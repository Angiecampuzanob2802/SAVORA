from datetime import time
from typing import Optional

from pydantic import BaseModel


class PreferenciaAlimentariaBase(BaseModel):
    restricciones: Optional[str] = None
    alergias: Optional[str] = None
    observaciones: Optional[str] = None
    horario_entrega: Optional[time] = None
    frecuencia: Optional[str] = None
    id_adulto_mayor: Optional[int] = None


class PreferenciaAlimentariaCreate(PreferenciaAlimentariaBase):
    pass


class PreferenciaAlimentariaUpdate(PreferenciaAlimentariaBase):
    pass


class PreferenciaAlimentariaResponse(PreferenciaAlimentariaBase):
    id_preferencia_alimentaria: int

    class Config:
        from_attributes = True
