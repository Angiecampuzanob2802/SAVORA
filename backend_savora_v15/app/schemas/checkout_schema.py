from pydantic import BaseModel


class CheckoutItem(BaseModel):
    id_producto: int
    cantidad: int


class CheckoutRequest(BaseModel):
    direccion_entrega: str
    metodo_pago: str
    items: list[CheckoutItem]


class CheckoutResponse(BaseModel):
    id_pedido: int
    total: float
    estado_pedido: str
    mensaje: str
