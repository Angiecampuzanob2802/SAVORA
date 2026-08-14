CREATE TABLE IF NOT EXISTS solicitudes_negocio (
    id_solicitud SERIAL PRIMARY KEY,
    nombre_propietario VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL,
    celular VARCHAR(30),
    nombre_establecimiento VARCHAR(120) NOT NULL,
    tipo_negocio VARCHAR(80),
    ciudad VARCHAR(80),
    direccion VARCHAR(180),
    mensaje TEXT,
    estado_solicitud VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_negocio_estado
ON solicitudes_negocio (estado_solicitud);
