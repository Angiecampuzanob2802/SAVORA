# Ejecución y despliegue de SAVORA

## Alcance

Este documento distingue la ejecución local para desarrollo del despliegue de
una versión estable. Los valores de dominios, usuarios y secretos de producción
deben definirse para la infraestructura seleccionada.

## Ejecución local

### 1. Base de datos

1. Iniciar PostgreSQL.
2. Crear o restaurar `savora_db`.
3. Copiar `backend_savora_v15/.env.example` como `.env`.
4. Configurar `DATABASE_URL` y `SECRET_KEY`.

### 2. Backend

```powershell
cd backend_savora_v15
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Verificar:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```

### 3. Frontend

```powershell
cd frontend_savora_v15
npm ci
npm start
```

Verificar <http://localhost:4200/>.

### 4. Aplicación móvil

```powershell
cd mobile_savora_ionic
npm ci
ionic.cmd serve
```

Verificar <http://localhost:8100/>.

## Preparación de producción

### Base de datos

- Utilizar una instancia privada de PostgreSQL.
- Crear un usuario con los privilegios mínimos necesarios.
- Realizar un respaldo antes de cada cambio de esquema.
- Probar periódicamente el procedimiento de restauración.
- Aplicar migraciones versionadas cuando el proyecto incorpore Alembic.

### Backend

- Instalar dependencias en un entorno virtual aislado.
- Definir `DATABASE_URL`, `SECRET_KEY` y orígenes CORS fuera del código.
- No usar `--reload`.
- Ejecutar Uvicorn/Gunicorn mediante un servicio administrado.
- Publicar la API detrás de un proxy inverso con HTTPS.
- Supervisar `/health`, registros, memoria, CPU, disco y conexiones.

Ejemplo conceptual; debe adaptarse al servidor elegido:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend web

1. Configurar la URL HTTPS real de la API.
2. Compilar:

```powershell
cd frontend_savora_v15
npm ci
npm run build
```

3. Publicar el contenido generado en `dist/` mediante un servidor web o una
   plataforma de alojamiento.
4. Verificar rutas, refresco directo, HTTPS y CORS.

### Aplicación móvil

```powershell
cd mobile_savora_ionic
npm ci
npm run build
npx cap sync
```

Antes de distribuirla se deben definir un `appId`, nombre de aplicación y URL
de API propios, y comprobar permisos en un dispositivo.

## Lista de verificación posterior

- `/health` responde `200` con estado `ok`.
- El inicio de sesión funciona para cada rol.
- Las rutas protegidas rechazan accesos no autorizados.
- El catálogo, pedidos, entregas y notificaciones funcionan.
- El frontend consume el dominio correcto de la API.
- No hay errores de CORS ni contenido HTTP dentro de páginas HTTPS.
- El respaldo previo puede identificarse y restaurarse.
- La versión desplegada coincide con la etiqueta Git/GitHub.

## Registro del despliegue

Registrar en las notas de versión o acta correspondiente:

| Dato | Registro requerido |
|---|---|
| Versión | Etiqueta Git/GitHub, por ejemplo `v1.0.0`. |
| Ambiente | Desarrollo, pruebas o producción. |
| Fecha y responsable | Momento y persona que realizó el despliegue. |
| Cambios | Commits y notas de versión incluidas. |
| Base de datos | Respaldo, migraciones y resultado. |
| Pruebas | Resultado de las verificaciones posteriores. |
| Reversión | Versión anterior y respaldo asociado. |

## Reversión

1. Detener nuevas operaciones si existe riesgo de inconsistencia.
2. Conservar registros y evidencia del fallo.
3. Volver a la etiqueta estable anterior.
4. Restaurar la base de datos solo cuando el cambio lo requiera y el impacto
   haya sido evaluado.
5. Reiniciar los servicios y repetir las verificaciones.
6. Documentar la causa, la decisión y el resultado.

