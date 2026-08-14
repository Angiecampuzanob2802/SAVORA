from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Date
from sqlalchemy import Numeric
from sqlalchemy import ForeignKey

from app.database import Base


class Pedido(Base):

    __tablename__ = "pedidos"

    id_pedido = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha_pedido = Column(
        Date,
        nullable=False
    )

    estado_pedido = Column(
        String(50),
        nullable=False
    )

    total = Column(
        Numeric(10, 2),
        nullable=False
    )

    direccion_entrega = Column(
        String(150),
        nullable=False
    )

    metodo_pago = Column(
        String(50),
        nullable=False
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuarios.id_usuario")
    )

    id_establecimiento = Column(
        Integer,
        ForeignKey("establecimientos.id_establecimiento")
    )