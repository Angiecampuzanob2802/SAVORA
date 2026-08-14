"""Fábrica de routers CRUD protegidos para recursos simples de SAVORA."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user


def create_crud_router(model, create_schema, update_schema, response_schema, prefix, tags, id_field):
    """Construye endpoints crear, listar, consultar, actualizar y eliminar."""
    router = APIRouter(prefix=prefix, tags=tags, dependencies=[Depends(get_current_user)])

    @router.post("/", response_model=response_schema)
    def create_item(payload: create_schema, db: Session = Depends(get_db)):
        item = model(**payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @router.get("/", response_model=list[response_schema])
    def list_items(db: Session = Depends(get_db)):
        return db.query(model).all()

    @router.get("/{item_id}", response_model=response_schema)
    def get_item(item_id: int, db: Session = Depends(get_db)):
        item = db.query(model).filter(getattr(model, id_field) == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return item

    @router.put("/{item_id}", response_model=response_schema)
    def update_item(item_id: int, payload: update_schema, db: Session = Depends(get_db)):
        item = db.query(model).filter(getattr(model, id_field) == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Registro no encontrado")

        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)

        db.commit()
        db.refresh(item)
        return item

    @router.delete("/{item_id}")
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        item = db.query(model).filter(getattr(model, id_field) == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Registro no encontrado")

        db.delete(item)
        db.commit()
        return {"mensaje": "Registro eliminado correctamente"}

    return router
