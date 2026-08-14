# SAVORA Frontend

Frontend web construido con Angular para la aplicacion SAVORA, una plataforma
de recuperacion de alimentos proximos a vencer.

## Ejecutar en desarrollo

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

El backend FastAPI debe estar corriendo en `http://127.0.0.1:8000`.

## Rutas principales

- `/`: landing UX/UI.
- `/login`: acceso por rol.
- `/cliente`: tienda y checkout.
- `/establecimiento`: productos y pedidos recibidos.
- `/logistica`: programacion y seguimiento de entregas.
- `/admin`: panel administrativo.
- `/perfil`: datos de usuario.
- `/notificaciones`: centro de notificaciones.
