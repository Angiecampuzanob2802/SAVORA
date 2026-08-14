from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.producto import Producto
from app.schemas.producto_schema import (
    ProductoCreate,
    ProductoUpdate,
    ProductoResponse
)

router = APIRouter(prefix="/productos", tags=["Productos"])


# 🔹 CREAR PRODUCTO
@router.post("/", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):

    nuevo_producto = Producto(
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_costo=producto.precio_costo,
        precio_venta=producto.precio_venta,
        stock=producto.stock,
        estado_producto=producto.estado_producto,
        fecha_vencimiento=producto.fecha_vencimiento,
        fecha_preparacion=producto.fecha_preparacion,
        hora_limite_consumo=producto.hora_limite_consumo,
        id_categoria=producto.id_categoria,
        id_establecimiento=producto.id_establecimiento
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto


# 🔹 LISTAR PRODUCTOS
@router.get("/", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):

    return db.query(Producto).all()


# 🔹 OBTENER PRODUCTO POR ID
@router.get("/{id_producto}", response_model=ProductoResponse)
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):

    producto = db.query(Producto).filter(
        Producto.id_producto == id_producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto


# 🔹 ACTUALIZAR PRODUCTO
@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar_producto(
    id_producto: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db)
):

    producto = db.query(Producto).filter(
        Producto.id_producto == id_producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for key, value in datos.model_dump(exclude_unset=True).items():
        setattr(producto, key, value)

    db.commit()
    db.refresh(producto)

    return producto


# 🔹 ELIMINAR PRODUCTO
@router.delete("/{id_producto}")
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):

    producto = db.query(Producto).filter(
        Producto.id_producto == id_producto
    ).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(producto)
    db.commit()

    return {"mensaje": "Producto eliminado correctamente"}
