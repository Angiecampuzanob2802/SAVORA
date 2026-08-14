from sqlalchemy.orm import Session

from app.models.notificacion import Notificacion
from app.models.usuario import Usuario


ESTADO_NO_LEIDA = "No leida"
ROL_LOGISTICA = 4


def crear_notificacion(
    db: Session,
    titulo: str,
    mensaje: str,
    id_usuario: int | None = None,
    estado: str = ESTADO_NO_LEIDA,
) -> Notificacion:
    notificacion = Notificacion(
        titulo=titulo,
        mensaje=mensaje,
        estado=estado,
        id_usuario=id_usuario,
    )
    db.add(notificacion)
    return notificacion


def notificar_logistica(db: Session, titulo: str, mensaje: str) -> None:
    usuarios = db.query(Usuario).filter(Usuario.id_rol == ROL_LOGISTICA).all()

    for usuario in usuarios:
        crear_notificacion(db, titulo, mensaje, usuario.id_usuario)
