from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.detalle_pedido import DetallePedido
from app.models.movimiento import Movimiento
from app.models.pedido import Pedido
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.checkout_schema import CheckoutRequest, CheckoutResponse
from app.services.notificacion_service import crear_notificacion

router = APIRouter(prefix="/checkout", tags=["Checkout"])


@router.post("/", response_model=CheckoutResponse)
def crear_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El carrito esta vacio")

    product_ids = [item.id_producto for item in payload.items]
    productos = db.query(Producto).filter(Producto.id_producto.in_(product_ids)).all()
    productos_por_id = {producto.id_producto: producto for producto in productos}

    total = Decimal("0")
    id_establecimiento = None

    for item in payload.items:
        producto = productos_por_id.get(item.id_producto)

        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {item.id_producto} no encontrado",
            )

        if item.cantidad <= 0:
            raise HTTPException(
                status_code=400,
                detail="La cantidad debe ser mayor a cero",
            )

        if producto.estado_producto is False:
            raise HTTPException(
                status_code=400,
                detail=f"{producto.nombre} no esta disponible",
            )

        stock_actual = producto.stock or 0
        if stock_actual < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}",
            )

        precio = Decimal(producto.precio_venta or 0)
        total += precio * item.cantidad

        if id_establecimiento is None:
            id_establecimiento = producto.id_establecimiento
        elif id_establecimiento != producto.id_establecimiento:
            raise HTTPException(
                status_code=400,
                detail="El pedido solo puede incluir productos de un mismo establecimiento",
            )

    nuevo_pedido = Pedido(
        fecha_pedido=date.today(),
        estado_pedido="Pendiente",
        total=total,
        direccion_entrega=payload.direccion_entrega,
        metodo_pago=payload.metodo_pago,
        id_usuario=current_user.id_usuario,
        id_establecimiento=id_establecimiento,
    )

    db.add(nuevo_pedido)
    db.flush()

    for item in payload.items:
        producto = productos_por_id[item.id_producto]
        precio = Decimal(producto.precio_venta or 0)
        subtotal = precio * item.cantidad

        db.add(
            DetallePedido(
                id_pedido=nuevo_pedido.id_pedido,
                id_producto=producto.id_producto,
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=subtotal,
            )
        )

        producto.stock = (producto.stock or 0) - item.cantidad

        db.add(
            Movimiento(
                tipo_movimiento="SALIDA",
                motivo="Reserva cliente",
                cantidad=item.cantidad,
                fecha=date.today(),
                descripcion=f"Salida por pedido #{nuevo_pedido.id_pedido}",
                id_producto=producto.id_producto,
                id_usuario=current_user.id_usuario,
            )
        )

    crear_notificacion(
        db,
        "Pedido creado",
        f"Tu pedido #{nuevo_pedido.id_pedido} fue creado correctamente y quedo en estado Pendiente.",
        nuevo_pedido.id_usuario,
    )

    db.commit()
    db.refresh(nuevo_pedido)

    return CheckoutResponse(
        id_pedido=nuevo_pedido.id_pedido,
        total=float(nuevo_pedido.total),
        estado_pedido=nuevo_pedido.estado_pedido,
        mensaje="Pedido creado correctamente",
    )