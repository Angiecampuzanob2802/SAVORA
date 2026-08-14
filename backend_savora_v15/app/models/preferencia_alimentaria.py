from sqlalchemy import Column, ForeignKey, Integer, String, Time

from app.database import Base


class PreferenciaAlimentaria(Base):
    __tablename__ = "preferencias_alimentarias"

    id_preferencia_alimentaria = Column(Integer, primary_key=True, index=True)
    restricciones = Column(String(255))
    alergias = Column(String(255))
    observaciones = Column(String(255))
    horario_entrega = Column(Time)
    frecuencia = Column(String(50))
    id_adulto_mayor = Column(Integer, ForeignKey("adultos_mayores.id_adulto_mayor"))
