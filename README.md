# SAVORA

SAVORA es una plataforma para la recuperación y gestión de alimentos. El
proyecto integra una API REST en FastAPI, un frontend web en Angular y una base
móvil construida con Ionic y Capacitor.

## Versión

La versión académica estable documentada es `v1.0.0`. El número canónico se
encuentra en [`VERSION`](VERSION) y los cambios se registran en
[`CHANGELOG.md`](CHANGELOG.md).

El código usa versionamiento semántico `MAYOR.MENOR.PARCHE`:

- `MAYOR`: cambios incompatibles.
- `MENOR`: funcionalidades nuevas compatibles.
- `PARCHE`: correcciones compatibles y mantenimiento.

## Componentes

| Componente | Carpeta | Tecnología | Puerto local |
|---|---|---|---|
| Backend | `backend_savora_v15/` | FastAPI, SQLAlchemy y PostgreSQL | `8000` |
| Frontend | `frontend_savora_v15/` | Angular | `4200` |
| Móvil | `mobile_savora_ionic/` | Ionic, Angular y Capacitor | `8100` |

## Preparación

1. Instalar Python 3.11 o superior, PostgreSQL, Node.js 20 o superior y npm.
2. Copiar `backend_savora_v15/.env.example` como
   `backend_savora_v15/.env`.
3. Configurar `DATABASE_URL` y `SECRET_KEY` con valores locales seguros.
4. Restaurar o crear la base de datos `savora_db`.

Nunca se deben publicar archivos `.env`, contraseñas, tokens o respaldos con
datos sensibles.

## Ejecución local

Los tres componentes se ejecutan en terminales separadas.

### Backend

```powershell
cd backend_savora_v15
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

- API: <http://127.0.0.1:8000>
- Salud: <http://127.0.0.1:8000/health>
- Swagger: <http://127.0.0.1:8000/docs>

### Frontend

```powershell
cd frontend_savora_v15
npm ci
npm start
```

Abrir <http://localhost:4200/>.

### Aplicación móvil

```powershell
cd mobile_savora_ionic
npm ci
ionic.cmd serve
```

Abrir <http://localhost:8100/>.

## Documentación

- [`DEPLOYMENT.md`](DEPLOYMENT.md): ejecución, compilación, despliegue y
  reversión.
- [`CHANGELOG.md`](CHANGELOG.md): historial de versiones del código.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): ramas, commits y proceso de cambio.
- [`docs/CODE_DOCUMENTATION.md`](docs/CODE_DOCUMENTATION.md): criterios para
  documentar Python, TypeScript y la API.
- `backend_savora_v15/README.md`: configuración y endpoints del backend.
- `frontend_savora_v15/README-SAVORA.md`: funcionalidades del frontend.

## Nota sobre ejecución y despliegue

`--reload`, `npm start` e `ionic serve` son comandos de desarrollo local. No
constituyen por sí solos un despliegue de producción. Consulta
[`DEPLOYMENT.md`](DEPLOYMENT.md) para el procedimiento de liberación.

