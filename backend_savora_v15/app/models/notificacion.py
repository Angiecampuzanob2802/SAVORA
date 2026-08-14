from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class Notificacion(Base):
    __tablename__ = "notificaciones"

    id_notificacion = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100))
    mensaje = Column(String(255), nullable=False)
    fecha_notificacion = Column(DateTime, server_default=func.now())
    estado = Column(String(50))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
