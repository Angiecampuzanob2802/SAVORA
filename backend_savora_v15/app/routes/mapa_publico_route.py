from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.establecimiento import Establecimiento
from app.models.producto import Producto

router = APIRouter(prefix="/public", tags=["Mapa publico"])


def calcular_distancia_km(lat1, lng1, lat2, lng2):
    if lat1 is None or lng1 is None or lat2 is None or lng2 is None:
        return None

    radio_tierra_km = 6371
    d_lat = radians(float(lat2) - float(lat1))
    d_lng = radians(float(lng2) - float(lng1))
    origen_lat = radians(float(lat1))
    destino_lat = radians(float(lat2))

    a = sin(d_lat / 2) ** 2 + cos(origen_lat) * cos(destino_lat) * sin(d_lng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return round(radio_tierra_km * c, 2)


@router.get("/mapa/tiendas")
def listar_tiendas_cercanas(lat: float | None = None, lng: float | None = None, db: Session = Depends(get_db)):
    establecimientos = (
        db.query(Establecimiento)
        .filter(Establecimiento.estado == True)  # noqa: E712
        .all()
    )

    respuesta = []
    for establecimiento in establecimientos:
        productos = (
            db.query(Producto)
            .filter(Producto.id_establecimiento == establecimiento.id_establecimiento)
            .filter(Producto.estado_producto == True)  # noqa: E712
            .limit(4)
            .all()
        )

        distancia = calcular_distancia_km(
            lat,
            lng,
            establecimiento.latitud,
            establecimiento.longitud,
        )

        respuesta.append(
            {
                "id_establecimiento": establecimiento.id_establecimiento,
                "nombre": establecimiento.nombre,
                "tipo": establecimiento.tipo,
                "direccion": establecimiento.direccion,
                "telefono": establecimiento.telefono,
                "email": establecimiento.email,
                "descripcion": establecimiento.descripcion,
                "latitud": float(establecimiento.latitud) if establecimiento.latitud is not None else None,
                "longitud": float(establecimiento.longitud) if establecimiento.longitud is not None else None,
                "distancia_km": distancia,
                "productos": [
                    {
                        "id_producto": producto.id_producto,
                        "nombre": producto.nombre,
                        "descripcion": producto.descripcion,
                        "precio_venta": float(producto.precio_venta or 0),
                        "stock": producto.stock,
                    }
                    for producto in productos
                ],
            }
        )

    respuesta.sort(key=lambda tienda: tienda["distancia_km"] if tienda["distancia_km"] is not None else 999999)
    return respuesta
