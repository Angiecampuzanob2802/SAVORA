INSERT INTO usuarios (
    nombre, correo, contrasena, telefono, direccion, fecha_registro, estado, id_rol
) VALUES
('Admin Savora', 'admin@savora.com', '123456', '3000000001', 'SAVORA', CURRENT_DATE, true, 1),
('Aliado Savora', 'aliado@savora.com', '123456', '3000000002', 'SAVORA', CURRENT_DATE, true, 2),
('Cliente Savora', 'cliente@savora.com', '123456', '3000000003', 'SAVORA', CURRENT_DATE, true, 3),
('Logistica Savora', 'logistica@savora.com', '123456', '3000000004', 'SAVORA', CURRENT_DATE, true, 4)
ON CONFLICT (correo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    direccion = EXCLUDED.direccion,
    estado = true,
    id_rol = EXCLUDED.id_rol;
