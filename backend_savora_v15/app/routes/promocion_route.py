from app.models.promocion import Promocion
from app.routes.crud_router import create_crud_router
from app.schemas.promocion_schema import PromocionCreate, PromocionResponse, PromocionUpdate

router = create_crud_router(
    Promocion,
    PromocionCreate,
    PromocionUpdate,
    PromocionResponse,
    "/promociones",
    ["Promociones"],
    "id_promocion",
)
