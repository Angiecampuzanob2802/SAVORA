from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Time

from app.database import Base


class ProgramacionEntrega(Base):
    __tablename__ = "programacion_entregas"

    id_programacion_entregas = Column(Integer, primary_key=True, index=True)
    frecuencia = Column(String(50))
    horario = Column(Time)
    estado = Column(Boolean)
    fecha_inicio = Column(Date)
    id_adulto_mayor = Column(Integer, ForeignKey("adultos_mayores.id_adulto_mayor"))
