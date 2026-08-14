from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.auth_schema import (
    AuthMessageResponse,
    GoogleCheckRequest,
    LoginRequest,
    LoginResponse,
    PasswordResetRequest,
)
from app.security import create_access_token, decode_access_token, hash_password, is_hashed_password, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    correo = payload.correo.strip().lower()
    usuario = db.query(Usuario).filter(func.lower(func.trim(Usuario.correo)) == correo).first()

    if not usuario or not verify_password(payload.contrasena, usuario.contrasena):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not is_hashed_password(usuario.contrasena):
        usuario.contrasena = hash_password(payload.contrasena)
        db.commit()
        db.refresh(usuario)

    rol = db.query(Rol).filter(Rol.id_rol == usuario.id_rol).first()
    nombre_rol = rol.nombre_rol if rol else None
    access_token = create_access_token(
        {
            "sub": usuario.id_usuario,
            "correo": usuario.correo,
            "nombre": usuario.nombre,
            "id_rol": usuario.id_rol,
            "nombre_rol": nombre_rol,
        }
    )

    return LoginResponse(
        id_usuario=usuario.id_usuario,
        nombre=usuario.nombre,
        correo=usuario.correo,
        id_rol=usuario.id_rol,
        nombre_rol=nombre_rol,
        access_token=access_token,
    )


@router.post("/reset-password", response_model=AuthMessageResponse)
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    correo = payload.correo.strip().lower()
    nueva_contrasena = payload.nueva_contrasena.strip()

    if len(nueva_contrasena) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener minimo 6 caracteres")

    usuario = db.query(Usuario).filter(func.lower(func.trim(Usuario.correo)) == correo).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="No existe un usuario con ese correo")

    usuario.contrasena = hash_password(nueva_contrasena)
    db.commit()

    return AuthMessageResponse(mensaje="Contraseña actualizada correctamente")


@router.post("/google-check", response_model=AuthMessageResponse)
def google_check(payload: GoogleCheckRequest, db: Session = Depends(get_db)):
    correo = payload.correo.strip().lower()
    usuario = db.query(Usuario).filter(func.lower(func.trim(Usuario.correo)) == correo).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="No existe un usuario con ese correo")

    return AuthMessageResponse(
        mensaje="Correo verificado. Completa tu contraseña para ingresar de forma segura."
    )


@router.get("/me", response_model=LoginResponse)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o vencido")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == payload.get("sub")).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    rol = db.query(Rol).filter(Rol.id_rol == usuario.id_rol).first()

    return LoginResponse(
        id_usuario=usuario.id_usuario,
        nombre=usuario.nombre,
        correo=usuario.correo,
        id_rol=usuario.id_rol,
        nombre_rol=rol.nombre_rol if rol else None,
        access_token=token,
    )
