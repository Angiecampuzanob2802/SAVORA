from sqlalchemy import Column, Date, ForeignKey, Integer, String

from app.database import Base


class AdultoMayor(Base):
    __tablename__ = "adultos_mayores"

    id_adulto_mayor = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    documento = Column(String(20), unique=True)
    fecha_nacimiento = Column(Date)
    telefono = Column(String(20))
    direccion = Column(String(150))
    observaciones_medicas = Column(String(255))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
