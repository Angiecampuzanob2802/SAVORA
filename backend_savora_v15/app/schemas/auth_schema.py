from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    correo: str
    contrasena: str


class PasswordResetRequest(BaseModel):
    correo: str
    nueva_contrasena: str


class GoogleCheckRequest(BaseModel):
    correo: str


class AuthMessageResponse(BaseModel):
    mensaje: str


class LoginResponse(BaseModel):
    id_usuario: int
    nombre: str
    correo: str
    id_rol: Optional[int] = None
    nombre_rol: Optional[str] = None
    access_token: str
    token_type: str = "bearer"
