from sqlalchemy import Column, Date, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class SolicitudNegocio(Base):
    __tablename__ = "solicitudes_negocio"

    id_solicitud = Column(Integer, primary_key=True, index=True)
    nombre_propietario = Column(String(120), nullable=False)
    correo = Column(String(120), nullable=False)
    celular = Column(String(30))
    nombre_establecimiento = Column(String(120), nullable=False)
    tipo_negocio = Column(String(80))
    ciudad = Column(String(80))
    direccion = Column(String(180))
    mensaje = Column(Text)
    estado_solicitud = Column(String(30), nullable=False, default="Pendiente")
    fecha_solicitud = Column(Date, server_default=func.current_date())