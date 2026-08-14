from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base


class Movimiento(Base):

    __tablename__ = "movimientos"

    id_movimiento = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tipo_movimiento = Column(
        String(50),
        nullable=False
    )

    motivo = Column(
        String(100),
        nullable=False
    )

    cantidad = Column(
        Integer,
        nullable=False
    )

    fecha = Column(
        Date,
        nullable=False
    )

    descripcion = Column(
        String(255)
    )

    id_producto = Column(
        Integer,
        ForeignKey("productos.id_producto")
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuarios.id_usuario")
    )