# SAVORA Frontend

Frontend web construido con Angular.

## Requisitos

- Node.js 20 o superior
- npm
- Backend FastAPI corriendo en `http://127.0.0.1:8000`

## Instalar dependencias

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Luego abre:

```text
http://localhost:4200
```

Rutas principales:

- Landing UX/UI: `http://localhost:4200`
- Login por rol: `http://localhost:4200/login`
- Panel administrativo: `http://localhost:4200/admin`
- Vista cliente: `http://localhost:4200/cliente`
- Vista establecimiento: `http://localhost:4200/establecimiento`
- Vista logistica: `http://localhost:4200/logistica`
- Mi perfil: `http://localhost:4200/perfil`
- Centro de notificaciones: `http://localhost:4200/notificaciones`

Las rutas internas estan protegidas por rol:

- `Administrador`: puede entrar al panel administrativo.
- `Cliente`: puede entrar a la tienda.
- `Establecimiento`: puede entrar a la vista de establecimiento.
- `Usuario Logistico`: puede entrar a la vista de logistica.

Si alguien escribe una ruta sin iniciar sesion, Angular lo envia al login.
Si el token vence o la API responde 401, se limpia la sesion local y se redirige
al login con un mensaje de sesion expirada.

Todas las vistas internas incluyen acceso a `Mi perfil` y boton para cerrar
sesion. Tambien incluyen boton `Volver` para regresar a la pagina anterior.

Las vistas internas tambien muestran acceso a `Notificaciones` con un contador
de avisos no leidos. La pantalla de notificaciones permite filtrar todas, no
leidas y leidas, actualizar la lista y marcar una o todas como leidas.

La vista cliente incluye carrito, cantidades, direccion de entrega, metodo de
pago, confirmacion de reserva contra el endpoint `/checkout/` e historial de
pedidos con productos, cantidades, subtotales, estado, filtros por estado y
modal de detalle. La vista se identifica como `Tienda cliente` para que el flujo
sea mas claro durante la prueba.

La vista establecimiento incluye creacion de productos, alertas de stock bajo,
catalogo publicado, pedidos recibidos con detalle de productos y cambio de
estado de pedidos. Los filtros permiten revisar pedidos activos, pendientes,
preparando, listos para entregar, en camino, entregados o cancelados. El detalle
se abre en modal y permite cambiar el estado del pedido con confirmacion previa.
Al guardar se muestra mensaje de exito y se refrescan las notificaciones.

La vista logistica incluye programacion de entregas y cambio de estado:
`Programada`, `En camino`, `Entregada` o `Cancelada`, mostrando el detalle de
productos del pedido asociado. Solo muestra como disponibles los pedidos en
estado `Listo para entregar`. Al cambiar una entrega se confirma la accion y se
muestra el estado en que queda el pedido asociado.

El panel administrativo incluye metricas operativas generales: pedidos del dia,
productos con stock bajo, entregas pendientes y total de pedidos.

Tambien incluye reportes administrativos con filtro por fecha:

- Hoy
- Semana
- Mes
- Todo

Reportes disponibles:

- Pedidos por estado
- Entregas por estado
- Productos mas vendidos
- Productos criticos por stock bajo

Desde el panel puedes exportar CSV de pedidos, productos, entregas y del modulo
actual. Los CSV se exportan con separador `;` y BOM UTF-8 para abrirse mejor en
Excel en configuraciones en espanol.

## Modulos iniciales

El panel administrativo ya tiene configurados los modulos principales de la API:

- Roles
- Usuarios
- Productos
- Categorias
- Establecimientos
- Pedidos
- Entregas
- Adultos mayores
- Proveedores
- Productos proveedores
- Movimientos
- Detalle pedido
- Preferencias alimentarias
- Programacion entregas
- Promociones
- Notificaciones

Desde el modulo `Usuarios` puedes crear cuentas nuevas con rol. La contrasena
se envia al backend y se guarda con hash, no en texto plano.

La pantalla `Mi perfil` permite actualizar nombre, telefono, direccion y cambiar
la contrasena dejando el campo vacio si no se quiere modificar.

## Notificaciones

El frontend consume `/notificaciones/` y muestra:

- Avisos del usuario actual.
- Todas las notificaciones cuando el usuario tiene rol `Administrador`.
- Contador de no leidas en los menus principales.
- Accion para marcar notificaciones como `Leida`.

## Nota

Si la pantalla muestra un mensaje de error de conexion, primero revisa que el
backend este activo con:

```bash
uvicorn app.main:app --reload
```

desde la carpeta `BACKEND(FastApi)`.
