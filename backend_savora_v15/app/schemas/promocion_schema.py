from datetime import date
from typing import Optional

from pydantic import BaseModel


class PromocionBase(BaseModel):
    porcentaje_descuento: Optional[float] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[bool] = None
    tipo_promocion: Optional[str] = None
    id_producto: Optional[int] = None


class PromocionCreate(PromocionBase):
    pass


class PromocionUpdate(PromocionBase):
    pass


class PromocionResponse(PromocionBase):
    id_promocion: int

    class Config:
        from_attributes = True
