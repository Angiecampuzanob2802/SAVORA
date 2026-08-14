# Contribución y versionamiento

## Ramas

- `main`: versiones estables y verificadas.
- `develop`: integración previa a una liberación, cuando el equipo la utilice.
- `feature/<nombre>`: funcionalidades nuevas.
- `fix/<nombre>`: correcciones.
- `docs/<nombre>`: cambios exclusivamente documentales.

## Commits

Usar mensajes breves en modo imperativo:

- `feat: agrega historial de pedidos`
- `fix: corrige validación de entrega`
- `docs: documenta despliegue local`
- `refactor: separa reglas de notificación`
- `test: agrega pruebas de autenticación`
- `chore: actualiza dependencias`

## Versiones

1. Actualizar `VERSION`.
2. Registrar los cambios en `CHANGELOG.md`.
3. Ejecutar las pruebas y compilaciones aplicables.
4. Crear un commit de liberación.
5. Crear una etiqueta Git anotada, por ejemplo `v1.0.0`.
6. Publicar la etiqueta y las notas de versión en GitHub.

Las versiones reconstruidas anteriores a `v1.0.0` se conservan únicamente como
referencia documental. No se deben crear commits o etiquetas retroactivas que
aparenten un historial inexistente.

## Seguridad

No incluir en commits:

- `.env` o credenciales.
- Tokens o claves privadas.
- Respaldos de bases de datos con información real.
- `node_modules`, `.venv`, `dist`, `www` o cachés.

