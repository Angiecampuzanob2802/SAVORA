"""Configuración de SQLAlchemy y ciclo de vida de las sesiones de SAVORA."""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no esta configurada en el archivo .env")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """Proporciona una sesión por solicitud y garantiza su cierre."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
