from app.models.adulto_mayor import AdultoMayor
from app.routes.crud_router import create_crud_router
from app.schemas.adulto_mayor_schema import (
    AdultoMayorCreate,
    AdultoMayorResponse,
    AdultoMayorUpdate,
)

router = create_crud_router(
    AdultoMayor,
    AdultoMayorCreate,
    AdultoMayorUpdate,
    AdultoMayorResponse,
    "/adultos-mayores",
    ["Adultos Mayores"],
    "id_adulto_mayor",
)
