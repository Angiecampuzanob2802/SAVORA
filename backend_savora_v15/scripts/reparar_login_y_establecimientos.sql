INSERT INTO roles (id_rol, nombre_rol) VALUES
(1, 'Administrador'),
(2, 'Establecimiento'),
(3, 'Cliente'),
(4, 'Usuario Logistico')
ON CONFLICT (id_rol) DO UPDATE SET
    nombre_rol = EXCLUDED.nombre_rol;

INSERT INTO usuarios (
    nombre,
    correo,
    contrasena,
    telefono,
    direccion,
    fecha_registro,
    estado,
    id_rol
) VALUES
('Admin Savora', 'admin@savora.com', '123456', '3000000001', 'SAVORA', CURRENT_DATE, true, 1),
('Aliado Savora', 'aliado@savora.com', '123456', '3000000002', 'SAVORA', CURRENT_DATE, true, 2),
('Cliente Savora', 'cliente@savora.com', '123456', '3000000003', 'SAVORA', CURRENT_DATE, true, 3),
('Logistica Savora', 'logistica@savora.com', '123456', '3000000004', 'SAVORA', CURRENT_DATE, true, 4)
ON CONFLICT (correo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    contrasena = EXCLUDED.contrasena,
    telefono = EXCLUDED.telefono,
    direccion = EXCLUDED.direccion,
    fecha_registro = EXCLUDED.fecha_registro,
    estado = true,
    id_rol = EXCLUDED.id_rol;

ALTER TABLE establecimientos
ADD COLUMN IF NOT EXISTS latitud NUMERIC(10, 7);

ALTER TABLE establecimientos
ADD COLUMN IF NOT EXISTS longitud NUMERIC(10, 7);

UPDATE establecimientos
SET
    latitud = COALESCE(latitud, 5.0703),
    longitud = COALESCE(longitud, -75.5138)
WHERE estado = true;
