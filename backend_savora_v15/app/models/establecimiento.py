from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from app.database import Base

class Establecimiento(Base):
    __tablename__ = "establecimientos"

    id_establecimiento = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=False)

    direccion = Column(String(150))
    telefono = Column(String(20))

    email = Column(String(100))
    descripcion = Column(String(255))

    latitud = Column(Numeric(10, 7))
    longitud = Column(Numeric(10, 7))

    estado = Column(Boolean)

    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
