from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.pedido_schema import PedidoCreate, PedidoResponse, PedidoUpdate
from app.services.notificacion_service import crear_notificacion, notificar_logistica

router = APIRouter(prefix="/pedidos", tags=["Pedidos"], dependencies=[Depends(get_current_user)])


def crear_aviso_cambio_estado(db: Session, pedido: Pedido, estado_anterior: str | None, current_user: Usuario | None = None) -> None:
    if estado_anterior == pedido.estado_pedido:
        return

    crear_notificacion(
        db,
        "Pedido actualizado",
        f"Tu pedido #{pedido.id_pedido} ahora esta en estado {pedido.estado_pedido}.",
        pedido.id_usuario,
    )

    if current_user and current_user.id_usuario != pedido.id_usuario:
        crear_notificacion(
            db,
            "Cambio aplicado",
            f"Cambiaste el pedido #{pedido.id_pedido} de {estado_anterior} a {pedido.estado_pedido}.",
            current_user.id_usuario,
        )

    if pedido.estado_pedido == "Listo para entregar":
        notificar_logistica(
            db,
            "Pedido listo para entrega",
            f"El pedido #{pedido.id_pedido} esta listo para programar entrega.",
        )


@router.post("/", response_model=PedidoResponse)
def create_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    pedido = Pedido(**payload.model_dump())
    db.add(pedido)
    db.flush()
    crear_notificacion(
        db,
        "Pedido creado",
        f"Tu pedido #{pedido.id_pedido} fue creado correctamente.",
        pedido.id_usuario,
    )
    db.commit()
    db.refresh(pedido)
    return pedido


@router.get("/", response_model=list[PedidoResponse])
def list_pedidos(db: Session = Depends(get_db)):
    return db.query(Pedido).order_by(Pedido.id_pedido.desc()).all()


@router.get("/{item_id}", response_model=PedidoResponse)
def get_pedido(item_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == item_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return pedido


@router.put("/{item_id}", response_model=PedidoResponse)
def update_pedido(
    item_id: int,
    payload: PedidoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == item_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    estado_anterior = pedido.estado_pedido

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(pedido, key, value)

    crear_aviso_cambio_estado(db, pedido, estado_anterior, current_user)
    db.commit()
    db.refresh(pedido)
    return pedido


@router.delete("/{item_id}")
def delete_pedido(item_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == item_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    db.delete(pedido)
    db.commit()
    return {"mensaje": "Registro eliminado correctamente"}
