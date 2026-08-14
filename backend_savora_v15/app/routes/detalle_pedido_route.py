from app.models.detalle_pedido import DetallePedido
from app.routes.crud_router import create_crud_router
from app.schemas.detalle_pedido_schema import (
    DetallePedidoCreate,
    DetallePedidoResponse,
    DetallePedidoUpdate,
)

router = create_crud_router(
    DetallePedido,
    DetallePedidoCreate,
    DetallePedidoUpdate,
    DetallePedidoResponse,
    "/detalle-pedido",
    ["Detalle Pedido"],
    "id_detalle_pedido",
)
