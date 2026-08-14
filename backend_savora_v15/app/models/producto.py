from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy import Numeric, Date, Time
from app.database import Base

class Producto(Base):

    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))

    precio_costo = Column(Numeric(10, 2))
    precio_venta = Column(Numeric(10, 2))

    stock = Column(Integer)

    estado_producto = Column(Boolean)

    fecha_vencimiento = Column(Date)
    fecha_preparacion = Column(Date)

    hora_limite_consumo = Column(Time)

    id_categoria = Column(
        Integer,
        ForeignKey("categorias.id_categoria")
    )

    id_establecimiento = Column(
        Integer,
        ForeignKey("establecimientos.id_establecimiento")
    )
