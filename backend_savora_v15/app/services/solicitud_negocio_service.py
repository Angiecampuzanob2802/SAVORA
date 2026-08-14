from datetime import date

from sqlalchemy.orm import Session

from app.models.establecimiento import Establecimiento
from app.models.rol import Rol
from app.models.solicitud_negocio import SolicitudNegocio
from app.models.usuario import Usuario
from app.security import hash_password


class SolicitudNegocioService:

    @staticmethod
    def aprobar_solicitud(db: Session, solicitud: SolicitudNegocio):

        # Si ya fue aprobada no volver a crear registros
        if solicitud.estado_solicitud == "Aprobada":
            return solicitud

        # Buscar el rol Establecimiento
        rol = (
            db.query(Rol)
            .filter(Rol.nombre_rol == "Establecimiento")
            .first()
        )

        if not rol:
            raise Exception("No existe el rol Establecimiento.")

        # Verificar si el correo ya existe
        usuario_existente = (
            db.query(Usuario)
            .filter(Usuario.correo == solicitud.correo)
            .first()
        )

        if usuario_existente:
            raise Exception("Ya existe un usuario con ese correo.")

        # Crear usuario
        nuevo_usuario = Usuario(
            nombre=solicitud.nombre_propietario,
            correo=solicitud.correo,
            contrasena=hash_password("123456"),
            telefono=solicitud.celular,
            direccion=solicitud.direccion,
            fecha_registro=date.today(),
            estado=True,
            id_rol=rol.id_rol,
        )

        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)

        # Crear establecimiento
        establecimiento = Establecimiento(
            nombre=solicitud.nombre_establecimiento,
            tipo=solicitud.tipo_negocio,
            direccion=solicitud.direccion,
            telefono=solicitud.celular,
            email=solicitud.correo,
            descripcion=solicitud.mensaje,
            estado=True,
            id_usuario=nuevo_usuario.id_usuario,
        )

        db.add(establecimiento)

        # Cambiar estado de la solicitud
        solicitud.estado_solicitud = "Aprobada"

        db.commit()

        db.refresh(establecimiento)
        db.refresh(solicitud)

        return solicitud