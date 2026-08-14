from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.categoria import Categoria
from app.schemas.categoria_schema import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse
)

router = APIRouter(prefix="/categorias", tags=["Categorias"])


# 🔹 Crear categoría
@router.post("/", response_model=CategoriaResponse)
def crear_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):

    nueva_categoria = Categoria(
        nombre=categoria.nombre,
        descripcion=categoria.descripcion
    )

    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)

    return nueva_categoria


# 🔹 Listar categorías
@router.get("/", response_model=list[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):

    return db.query(Categoria).all()


# 🔹 Obtener una categoría por ID
@router.get("/{id_categoria}", response_model=CategoriaResponse)
def obtener_categoria(id_categoria: int, db: Session = Depends(get_db)):

    categoria = db.query(Categoria).filter(
        Categoria.id_categoria == id_categoria
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return categoria


# 🔹 Actualizar categoría
@router.put("/{id_categoria}", response_model=CategoriaResponse)
def actualizar_categoria(
    id_categoria: int,
    datos: CategoriaUpdate,
    db: Session = Depends(get_db)
):

    categoria = db.query(Categoria).filter(
        Categoria.id_categoria == id_categoria
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if datos.nombre is not None:
        categoria.nombre = datos.nombre

    if datos.descripcion is not None:
        categoria.descripcion = datos.descripcion

    db.commit()
    db.refresh(categoria)

    return categoria


# 🔹 Eliminar categoría
@router.delete("/{id_categoria}")
def eliminar_categoria(id_categoria: int, db: Session = Depends(get_db)):

    categoria = db.query(Categoria).filter(
        Categoria.id_categoria == id_categoria
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    db.delete(categoria)
    db.commit()

    return {"mensaje": "Categoría eliminada correctamente"}