from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric

from app.database import Base


class ProductoProveedor(Base):
    __tablename__ = "productos_proveedores"

    id_producto_proveedor = Column(Integer, primary_key=True, index=True)
    precio_compra = Column(Numeric(10, 2))
    fecha_compra = Column(Date)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
    id_proveedor = Column(Integer, ForeignKey("proveedores.id_proveedor"))
