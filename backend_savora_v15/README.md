# SAVORA Backend

Backend construido con FastAPI, SQLAlchemy y PostgreSQL.

## Requisitos

- Python 3.11 o superior
- PostgreSQL
- Base de datos `savora_db` creada con el script de `BASE DE DATOS(PostgreSQL)/savora_db.sql`

## Configuracion

1. Copia `.env.example` como `.env`.
2. Ajusta la conexion:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/savora_db
SECRET_KEY=cambia-esta-clave-en-tu-equipo
```

## Instalar dependencias

Desde esta carpeta:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Ejecutar API

```bash
uvicorn app.main:app --reload
```

Luego abre:

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`
- Login con token: `POST http://127.0.0.1:8000/auth/login`
- Usuario actual: `GET http://127.0.0.1:8000/auth/me`
- Checkout/carrito: `POST http://127.0.0.1:8000/checkout/`
- Notificaciones: `GET http://127.0.0.1:8000/notificaciones/`

Las entregas sincronizan el estado del pedido asociado:

- `Programada` -> `Listo para entregar`
- `En camino` -> `En camino`
- `Entregada` -> `Entregado`
- `Cancelada` -> `Cancelado`

## Notificaciones automaticas

El backend genera notificaciones con estado `No leida` en estos eventos:

- Cuando un cliente crea un pedido desde `/checkout/`.
- Cuando se crea un pedido desde `/pedidos/`.
- Cuando cambia el estado de un pedido desde `/pedidos/{id}`.
- El usuario que aplica el cambio de estado tambien recibe una notificacion de confirmacion.
- Cuando un pedido queda `Listo para entregar`, se avisa a los usuarios con rol logistico.
- Cuando se crea o cambia el estado de una entrega desde `/entregas/`.

El frontend puede marcar una notificacion como leida actualizando el campo:

```json
{ "estado": "Leida" }
```

## Seguridad

El login devuelve `access_token`. Los modulos CRUD y el checkout requieren el
header:

```text
Authorization: Bearer TU_TOKEN
```

Si tienes usuarios antiguos con contrasena en texto plano, el primer login
correcto convierte esa contrasena a hash `pbkdf2_sha256` automaticamente.
Los usuarios creados desde `/usuarios` ya guardan la contrasena con hash desde
el inicio.

## Usuarios demo

Puedes ejecutar `scripts/demo_users.sql` en pgAdmin para crear usuarios de
prueba. Todos usan la contrasena `123456`:

- `admin@savora.com`
- `aliado@savora.com`
- `cliente@savora.com`
- `logistica@savora.com`

## Modulos disponibles

- `/roles`
- `/usuarios`
- `/adultos-mayores`
- `/establecimientos`
- `/categorias`
- `/productos`
- `/proveedores`
- `/productos-proveedores`
- `/movimientos`
- `/pedidos`
- `/detalle-pedido`
- `/entregas`
- `/preferencias-alimentarias`
- `/programacion-entregas`
- `/promociones`
- `/notificaciones`
