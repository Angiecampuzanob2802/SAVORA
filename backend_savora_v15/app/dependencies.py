"""Dependencias compartidas de autenticación para las rutas protegidas."""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.security import decode_access_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el encabezado Bearer y devuelve el usuario autenticado."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o vencido")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == payload.get("sub")).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return usuario
