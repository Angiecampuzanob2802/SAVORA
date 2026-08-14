from sqlalchemy import Column, Date, ForeignKey, Integer, String, Time

from app.database import Base


class Entrega(Base):
    __tablename__ = "entregas"

    id_entrega = Column(Integer, primary_key=True, index=True)
    fecha_entrega = Column(Date)
    hora_entrega = Column(Time)
    fecha_programada = Column(Date)
    estado_entrega = Column(String(50))
    direccion_entrega = Column(String(150))
    observaciones = Column(String(255))
    id_pedido = Column(Integer, ForeignKey("pedidos.id_pedido"))
