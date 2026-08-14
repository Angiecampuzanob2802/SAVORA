from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.usuario import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.security import hash_password, is_hashed_password

router = APIRouter(prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(get_current_user)])


@router.post("/", response_model=UsuarioResponse)
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    existing = db.query(Usuario).filter(Usuario.correo == payload.correo).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo")

    data = payload.model_dump()
    data["contrasena"] = hash_password(data["contrasena"])

    usuario = Usuario(**data)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("/", response_model=list[UsuarioResponse])
def list_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).order_by(Usuario.id_usuario).all()


@router.get("/{item_id}", response_model=UsuarioResponse)
def get_usuario(item_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == item_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return usuario


@router.put("/{item_id}", response_model=UsuarioResponse)
def update_usuario(item_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == item_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    data = payload.model_dump(exclude_unset=True)

    if "correo" in data:
        existing = db.query(Usuario).filter(Usuario.correo == data["correo"], Usuario.id_usuario != item_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro usuario con ese correo")

    if data.get("contrasena"):
        if not is_hashed_password(data["contrasena"]):
            data["contrasena"] = hash_password(data["contrasena"])
    else:
        data.pop("contrasena", None)

    for key, value in data.items():
        setattr(usuario, key, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{item_id}")
def delete_usuario(item_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == item_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    db.delete(usuario)
    db.commit()
    return {"mensaje": "Registro eliminado correctamente"}
