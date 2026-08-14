from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.establecimiento import Establecimiento
from app.models.solicitud_negocio import SolicitudNegocio
from app.models.usuario import Usuario
from app.schemas.solicitud_negocio_schema import (
    SolicitudNegocioCreate,
    SolicitudNegocioResponse,
    SolicitudNegocioUpdate,
)
from app.security import hash_password

router = APIRouter(prefix="/solicitudes-negocio", tags=["Solicitudes Negocio"])

ROL_ESTABLECIMIENTO_ID = 2
CONTRASENA_TEMPORAL = "123456"


def normalizar_correo(correo: str) -> str:
    return correo.strip().lower()


def aprobar_y_crear_cuenta(solicitud: SolicitudNegocio, db: Session) -> tuple[Usuario, Establecimiento]:
    correo = normalizar_correo(solicitud.correo)

    usuario = (
        db.query(Usuario)
        .filter(func.lower(func.trim(Usuario.correo)) == correo)
        .first()
    )

    if usuario and usuario.id_rol != ROL_ESTABLECIMIENTO_ID:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con ese correo y no pertenece al rol Establecimiento.",
        )

    if not usuario:
        usuario = Usuario(
            nombre=solicitud.nombre_propietario,
            correo=correo,
            contrasena=hash_password(CONTRASENA_TEMPORAL),
            telefono=solicitud.celular or "",
            direccion=solicitud.direccion or solicitud.ciudad or "",
            fecha_registro=date.today(),
            estado=True,
            id_rol=ROL_ESTABLECIMIENTO_ID,
        )
        db.add(usuario)
        db.flush()

    establecimiento = (
        db.query(Establecimiento)
        .filter(Establecimiento.id_usuario == usuario.id_usuario)
        .first()
    )

    if not establecimiento:
        establecimiento = Establecimiento(
            nombre=solicitud.nombre_establecimiento,
            tipo=solicitud.tipo_negocio or "Establecimiento",
            direccion=solicitud.direccion or "",
            telefono=solicitud.celular or "",
            email=correo,
            descripcion=solicitud.mensaje or "Negocio registrado desde SAVORA.",
            estado=True,
            id_usuario=usuario.id_usuario,
        )
        db.add(establecimiento)
        db.flush()
    else:
        establecimiento.nombre = solicitud.nombre_establecimiento
        establecimiento.tipo = solicitud.tipo_negocio or establecimiento.tipo
        establecimiento.direccion = solicitud.direccion or establecimiento.direccion
        establecimiento.telefono = solicitud.celular or establecimiento.telefono
        establecimiento.email = correo
        establecimiento.descripcion = solicitud.mensaje or establecimiento.descripcion
        establecimiento.estado = True

    solicitud.estado_solicitud = "Aprobada"

    return usuario, establecimiento


@router.post("/", response_model=SolicitudNegocioResponse)
def crear_solicitud(payload: SolicitudNegocioCreate, db: Session = Depends(get_db)):
    solicitud = SolicitudNegocio(
        nombre_propietario=payload.nombre_propietario,
        correo=normalizar_correo(payload.correo),
        celular=payload.celular,
        nombre_establecimiento=payload.nombre_establecimiento,
        tipo_negocio=payload.tipo_negocio,
        ciudad=payload.ciudad,
        direccion=payload.direccion,
        mensaje=payload.mensaje,
        estado_solicitud="Pendiente",
        fecha_solicitud=date.today(),
    )

    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)

    return solicitud


@router.get("/", response_model=list[SolicitudNegocioResponse])
def listar_solicitudes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return (
        db.query(SolicitudNegocio)
        .order_by(SolicitudNegocio.id_solicitud.desc())
        .all()
    )


@router.put("/{id_solicitud}", response_model=SolicitudNegocioResponse)
def actualizar_solicitud(
    id_solicitud: int,
    payload: SolicitudNegocioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    solicitud = (
        db.query(SolicitudNegocio)
        .filter(SolicitudNegocio.id_solicitud == id_solicitud)
        .first()
    )

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    datos = payload.model_dump(exclude_unset=True)

    for campo, valor in datos.items():
        setattr(solicitud, campo, valor)

    if solicitud.estado_solicitud == "Aprobada":
        aprobar_y_crear_cuenta(solicitud, db)

    db.commit()
    db.refresh(solicitud)

    return solicitud


@router.delete("/{id_solicitud}")
def eliminar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    solicitud = (
        db.query(SolicitudNegocio)
        .filter(SolicitudNegocio.id_solicitud == id_solicitud)
        .first()
    )

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    db.delete(solicitud)
    db.commit()

    return {"mensaje": "Solicitud eliminada correctamente"}


@router.put("/{id_solicitud}/aprobar")
def aprobar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    solicitud = (
        db.query(SolicitudNegocio)
        .filter(SolicitudNegocio.id_solicitud == id_solicitud)
        .first()
    )

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    usuario, establecimiento = aprobar_y_crear_cuenta(solicitud, db)

    db.commit()
    db.refresh(solicitud)
    db.refresh(usuario)
    db.refresh(establecimiento)

    return {
        "mensaje": "Solicitud aprobada correctamente",
        "correo": usuario.correo,
        "contrasena_temporal": CONTRASENA_TEMPORAL,
        "id_usuario": usuario.id_usuario,
        "id_establecimiento": establecimiento.id_establecimiento,
    }


@router.put("/{id_solicitud}/rechazar")
def rechazar_solicitud(
    id_solicitud: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    solicitud = (
        db.query(SolicitudNegocio)
        .filter(SolicitudNegocio.id_solicitud == id_solicitud)
        .first()
    )

    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    solicitud.estado_solicitud = "Rechazada"

    db.commit()

    return {"mensaje": "Solicitud rechazada correctamente"}
