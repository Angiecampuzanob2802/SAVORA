from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String

from app.database import Base


class Promocion(Base):
    __tablename__ = "promociones"

    id_promocion = Column(Integer, primary_key=True, index=True)
    porcentaje_descuento = Column(Numeric(5, 2))
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    estado = Column(Boolean)
    tipo_promocion = Column(String(50))
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
