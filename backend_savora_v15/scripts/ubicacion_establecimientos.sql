ALTER TABLE establecimientos
ADD COLUMN IF NOT EXISTS latitud NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitud NUMERIC(10, 7);

UPDATE establecimientos
SET latitud = 5.0689000, longitud = -75.5144000
WHERE id_establecimiento = 1;

UPDATE establecimientos
SET latitud = 5.0718000, longitud = -75.5158000
WHERE id_establecimiento = 2;

UPDATE establecimientos
SET latitud = 5.0667000, longitud = -75.5121000
WHERE id_establecimiento = 3;

UPDATE establecimientos
SET latitud = 5.0709000, longitud = -75.5162000
WHERE id_establecimiento = 4;

UPDATE establecimientos
SET latitud = 5.0628000, longitud = -75.5019000
WHERE id_establecimiento = 5;

UPDATE establecimientos
SET latitud = 5.0697000, longitud = -75.5096000
WHERE id_establecimiento = 6;
