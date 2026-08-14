# Documentación del código

## Objetivo

La documentación debe explicar contratos, reglas de negocio y decisiones que
no resulten evidentes. Debe actualizarse en el mismo cambio que modifica el
comportamiento.

## Backend Python

- Añadir docstrings de módulo en seguridad, conexión, dependencias y rutas
  compartidas.
- Documentar funciones públicas con propósito, parámetros, retorno y errores
  relevantes.
- Evitar comentarios que repitan literalmente una instrucción.
- No incluir secretos ni datos reales en ejemplos.

FastAPI genera documentación OpenAPI/Swagger a partir de rutas, esquemas,
`summary`, `description`, `response_model` y códigos de estado. Swagger está
disponible localmente en <http://127.0.0.1:8000/docs>.

## Frontend y móvil TypeScript

- Usar TSDoc/JSDoc en servicios, guards y métodos con reglas importantes.
- Explicar entradas, salidas, efectos secundarios y condiciones de acceso.
- Preferir nombres expresivos y tipos estrictos antes que comentarios largos.
- Documentar las URLs y diferencias de ambiente sin registrar credenciales.

## Archivos mínimos que deben mantenerse

- `README.md`: visión general, requisitos y ejecución.
- `CHANGELOG.md`: cambios por versión.
- `DEPLOYMENT.md`: despliegue y reversión.
- `.env.example`: nombres de variables sin valores sensibles.
- Documentación Swagger/OpenAPI: contratos de la API.

## Revisión

Antes de una versión estable se debe comprobar que:

- Los comandos documentados funcionan.
- Las URLs coinciden con la configuración actual.
- Los nombres de carpetas y módulos son reales.
- Las versiones de código y documentación están actualizadas.
- No se publicaron contraseñas, tokens o respaldos sensibles.

