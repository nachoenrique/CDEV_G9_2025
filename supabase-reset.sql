-- ========================================
-- SCRIPT DE ACTUALIZACIÓN - BORRAR Y RECREAR TODO
-- Ejecutar este script para actualizar la base de datos
-- ========================================

-- 1. Borrar vistas (deben ir primero)
DROP VIEW IF EXISTS ranking_global;
DROP VIEW IF EXISTS ranking_by_level_time;

-- 2. Borrar políticas existentes
DROP POLICY IF EXISTS "Allow public read access on players" ON players;
DROP POLICY IF EXISTS "Allow public insert on players" ON players;
DROP POLICY IF EXISTS "Allow public read access on level_completions" ON level_completions;
DROP POLICY IF EXISTS "Allow public insert on level_completions" ON level_completions;

-- 3. Borrar tablas (CASCADE elimina las foreign keys)
DROP TABLE IF EXISTS level_completions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- ========================================
-- AHORA EJECUTA EL ARCHIVO supabase-setup.sql COMPLETO
-- ========================================
