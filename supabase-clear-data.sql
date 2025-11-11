-- ========================================
-- LIMPIAR TODOS LOS DATOS
-- Borra TODOS los registros pero mantiene las tablas
-- ========================================

-- ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos
-- Las tablas, vistas, índices y políticas permanecerán intactas
-- Solo se borrarán los registros

-- 1. Borrar todas las completaciones de niveles
DELETE FROM level_completions;

-- 2. Borrar todos los jugadores
DELETE FROM players;

-- 3. Reiniciar secuencias (si existieran)
-- No es necesario porque usamos UUIDs

-- Verificar que todo está vacío
SELECT 'players' as tabla, COUNT(*) as registros FROM players
UNION ALL
SELECT 'level_completions' as tabla, COUNT(*) as registros FROM level_completions;

-- Resultado esperado:
-- tabla               | registros
-- --------------------|-----------
-- players             | 0
-- level_completions   | 0
