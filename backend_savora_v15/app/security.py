"""Funciones criptográficas para contraseñas y tokens de acceso de SAVORA."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

TOKEN_TTL_SECONDS = 60 * 60 * 8
PASSWORD_PREFIX = "pbkdf2_sha256"


def get_secret_key() -> str:
    """Obtiene la clave usada para firmar tokens en el ambiente actual."""
    return os.getenv("SECRET_KEY", "savora-dev-secret-change-me")


def hash_password(password: str) -> str:
    """Genera un hash PBKDF2-SHA256 con una sal aleatoria."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{PASSWORD_PREFIX}${salt}${digest.hex()}"


def verify_password(password: str, stored_password: str) -> bool:
    """Compara una contraseña con un hash o con un valor heredado temporal."""
    if not stored_password:
        return False

    if not stored_password.startswith(f"{PASSWORD_PREFIX}$"):
        return hmac.compare_digest(password, stored_password)

    try:
        _, salt, digest = stored_password.split("$", 2)
    except ValueError:
        return False

    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return hmac.compare_digest(candidate.hex(), digest)


def is_hashed_password(stored_password: str) -> bool:
    return stored_password.startswith(f"{PASSWORD_PREFIX}$")


def _b64encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")


def _b64decode(payload: str) -> bytes:
    padding = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(payload + padding)


def create_access_token(payload: dict[str, Any]) -> str:
    """Crea un token firmado con expiración de ocho horas."""
    body = payload.copy()
    body["exp"] = int(time.time()) + TOKEN_TTL_SECONDS
    encoded_body = _b64encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(get_secret_key().encode("utf-8"), encoded_body.encode("utf-8"), hashlib.sha256).digest()
    return f"{encoded_body}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Valida firma y expiración; devuelve el contenido o ``None``."""
    try:
        encoded_body, encoded_signature = token.split(".", 1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        get_secret_key().encode("utf-8"),
        encoded_body.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    try:
        received_signature = _b64decode(encoded_signature)
    except ValueError:
        return None

    if not hmac.compare_digest(expected_signature, received_signature):
        return None

    try:
        body = json.loads(_b64decode(encoded_body))
    except (ValueError, json.JSONDecodeError):
        return None

    if int(body.get("exp", 0)) < int(time.time()):
        return None

    return body
