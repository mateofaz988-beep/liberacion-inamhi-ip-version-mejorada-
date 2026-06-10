-- =============================================================================
--  INAMHI Liberación Web — Restricciones UNIQUE para evitar duplicados
--  Ejecutar una sola vez en la base de datos inamhi_liberacion_web
--  Comando: mysql -u root -p inamhi_liberacion_web < unique_constraints.sql
-- =============================================================================

-- Eliminar constraints previos si existen (para re-ejecución segura)
ALTER TABLE direcciones
    DROP INDEX IF EXISTS uq_direcciones_nombre;

ALTER TABLE areas
    DROP INDEX IF EXISTS uq_areas_nombre_direccion;

ALTER TABLE cargos
    DROP INDEX IF EXISTS uq_cargos_nombre_area;

-- -----------------------------------------------------------------------------
-- DIRECCIONES: nombre único a nivel global
-- -----------------------------------------------------------------------------
ALTER TABLE direcciones
    ADD CONSTRAINT uq_direcciones_nombre
    UNIQUE (nombre);

-- -----------------------------------------------------------------------------
-- AREAS: nombre único dentro de cada dirección
-- -----------------------------------------------------------------------------
ALTER TABLE areas
    ADD CONSTRAINT uq_areas_nombre_direccion
    UNIQUE (nombre, direccion_id);

-- -----------------------------------------------------------------------------
-- CARGOS: nombre único dentro de cada área
-- -----------------------------------------------------------------------------
ALTER TABLE cargos
    ADD CONSTRAINT uq_cargos_nombre_area
    UNIQUE (nombre, area_id);

-- Verificar
SELECT 'Constraints aplicados correctamente' AS resultado;
