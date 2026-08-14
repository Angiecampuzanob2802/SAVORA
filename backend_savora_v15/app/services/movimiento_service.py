from app.models.movimiento import Movimiento
from app.models.producto import Producto


def crear_movimiento(db, movimiento):

    # 🔥 1. BUSCAR PRODUCTO
    producto = db.query(Producto).filter(
        Producto.id_producto == movimiento.id_producto
    ).first()

    if not producto:
        return {"mensaje": "Producto no encontrado"}

    # 🔥 2. VALIDAR TIPO
    if movimiento.tipo_movimiento.upper() not in ["ENTRADA", "SALIDA"]:
        return {"mensaje": "Tipo de movimiento inválido"}

    # 🔥 3. VALIDAR STOCK
    if movimiento.tipo_movimiento.upper() == "ENTRADA":
        producto.stock += movimiento.cantidad

    elif movimiento.tipo_movimiento.upper() == "SALIDA":
        if producto.stock < movimiento.cantidad:
            return {"mensaje": "Stock insuficiente"}
        producto.stock -= movimiento.cantidad

    # 🔥 4. CREAR MOVIMIENTO
    nuevo = Movimiento(
        tipo_movimiento=movimiento.tipo_movimiento,
        motivo=movimiento.motivo,
        cantidad=movimiento.cantidad,
        fecha=movimiento.fecha,
        descripcion=movimiento.descripcion,
        id_producto=movimiento.id_producto,
        id_usuario=movimiento.id_usuario
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "mensaje": "Movimiento registrado correctamente",
        "id_movimiento": nuevo.id_movimiento,
        "stock_actual": producto.stock
    }