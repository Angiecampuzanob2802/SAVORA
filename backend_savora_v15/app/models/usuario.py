from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(100), nullable=False)
    correo = Column(String(100), nullable=False, unique=True)
    contrasena = Column(String(255), nullable=False)

    telefono = Column(String(20))
    direccion = Column(String(150))

    fecha_registro = Column(Date)

    estado = Column(Boolean)

    id_rol = Column(Integer, ForeignKey("roles.id_rol"))