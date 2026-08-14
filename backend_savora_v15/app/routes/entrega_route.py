from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.entrega import Entrega
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.entrega_schema import EntregaCreate, EntregaResponse, EntregaUpdate
from app.services.notificacion_service import crear_notificacion

router = APIRouter(prefix="/entregas", tags=["Entregas"], dependencies=[Depends(get_current_user)])


def estado_pedido_desde_entrega(estado_entrega: str | None) -> str | None:
    if not estado_entrega:
        return None

    estado = estado_entrega.strip().lower()

    if estado == "programada":
        return "Listo para entregar"

    if estado == "en camino":
        return "En camino"

    if estado == "entregada":
        return "Entregado"

    if estado == "cancelada":
        return "Cancelado"

    return None


def sync_pedido_estado(db: Session, entrega: Entrega) -> Pedido | None:
    pedido_estado = estado_pedido_desde_entrega(entrega.estado_entrega)

    if not pedido_estado or not entrega.id_pedido:
        return None

    pedido = db.query(Pedido).filter(Pedido.id_pedido == entrega.id_pedido).first()

    if pedido:
        pedido.estado_pedido = pedido_estado

    return pedido


def notificar_entrega(
    db: Session,
    pedido: Pedido | None,
    estado_entrega: str | None,
    id_entrega: int,
    current_user: Usuario | None = None,
) -> None:
    if not pedido or not estado_entrega:
        return

    crear_notificacion(
        db,
        "Entrega actualizada",
        f"La entrega #{id_entrega} del pedido #{pedido.id_pedido} ahora esta en estado {estado_entrega}.",
        pedido.id_usuario,
    )

    if current_user and current_user.id_usuario != pedido.id_usuario:
        crear_notificacion(
            db,
            "Entrega actualizada",
            f"Actualizaste la entrega #{id_entrega} del pedido #{pedido.id_pedido} a {estado_entrega}.",
            current_user.id_usuario,
        )


@router.post("/", response_model=EntregaResponse)
def create_entrega(
    payload: EntregaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    entrega = Entrega(**payload.model_dump())

    if not entrega.estado_entrega:
        entrega.estado_entrega = "Programada"

    db.add(entrega)
    db.flush()
    pedido = sync_pedido_estado(db, entrega)
    notificar_entrega(db, pedido, entrega.estado_entrega, entrega.id_entrega, current_user)
    db.commit()
    db.refresh(entrega)
    return entrega


@router.get("/", response_model=list[EntregaResponse])
def list_entregas(db: Session = Depends(get_db)):
    return db.query(Entrega).order_by(Entrega.id_entrega.desc()).all()


@router.get("/{item_id}", response_model=EntregaResponse)
def get_entrega(item_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id_entrega == item_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return entrega


@router.put("/{item_id}", response_model=EntregaResponse)
def update_entrega(
    item_id: int,
    payload: EntregaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    entrega = db.query(Entrega).filter(Entrega.id_entrega == item_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    data = payload.model_dump(exclude_unset=True)
    estado_anterior = entrega.estado_entrega

    for key, value in data.items():
        setattr(entrega, key, value)

    if entrega.estado_entrega == "Entregada" and not entrega.fecha_entrega:
        entrega.fecha_entrega = date.today()

    pedido = sync_pedido_estado(db, entrega)

    if estado_anterior != entrega.estado_entrega:
        notificar_entrega(db, pedido, entrega.estado_entrega, entrega.id_entrega, current_user)

    db.commit()
    db.refresh(entrega)
    return entrega


@router.delete("/{item_id}")
def delete_entrega(item_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id_entrega == item_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    db.delete(entrega)
    db.commit()
    return {"mensaje": "Registro eliminado correctamente"}
