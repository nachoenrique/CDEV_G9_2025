-- ========================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA SUPABASE
-- Sistema de Ranking para Juego de Laberinto
-- ========================================

-- 1. Tabla de jugadores
-- Almacena información básica de cada jugador
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de completaciones de niveles
-- Registra cada vez que un jugador completa un nivel
CREATE TABLE IF NOT EXISTS level_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    completion_time FLOAT NOT NULL,
    points INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_level_completions_player_id ON level_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_level_completions_level_id ON level_completions(level_id);
CREATE INDEX IF NOT EXISTS idx_level_completions_time ON level_completions(completion_time);

-- ========================================
-- CONFIGURACIÓN DE SEGURIDAD (RLS)
-- ========================================

-- Habilitar Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_completions ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla 'players'
-- Permitir lectura pública
CREATE POLICY "Allow public read access on players"
    ON players FOR SELECT
    USING (true);

-- Permitir inserción pública (para crear nuevos jugadores)
CREATE POLICY "Allow public insert on players"
    ON players FOR INSERT
    WITH CHECK (true);

-- Políticas para la tabla 'level_completions'
-- Permitir lectura pública
CREATE POLICY "Allow public read access on level_completions"
    ON level_completions FOR SELECT
    USING (true);

-- Permitir inserción pública (para guardar completaciones)
CREATE POLICY "Allow public insert on level_completions"
    ON level_completions FOR INSERT
    WITH CHECK (true);

-- ========================================
-- VISTAS ÚTILES PARA RANKINGS
-- ========================================

-- Vista: Ranking Global por Puntos
-- Suma SOLO los mejores puntos de cada nivel por jugador (una sola vez por nivel)
CREATE OR REPLACE VIEW ranking_global AS
SELECT 
    p.id,
    p.name,
    COALESCE(SUM(best_attempts.best_points), 0) as total_points,
    COUNT(DISTINCT best_attempts.level_id) as levels_completed,
    COUNT(best_attempts.level_id) as total_completions,
    MAX(best_attempts.completed_at) as last_completion
FROM players p
LEFT JOIN (
    -- Subconsulta: obtener el MEJOR intento de cada jugador por nivel
    SELECT 
        player_id,
        level_id,
        MAX(points) as best_points,
        MAX(completed_at) as completed_at
    FROM level_completions
    GROUP BY player_id, level_id
) best_attempts ON p.id = best_attempts.player_id
GROUP BY p.id, p.name
ORDER BY total_points DESC;

-- Vista: Mejores tiempos por nivel
-- Muestra el mejor tiempo de cada jugador por nivel (una sola entrada por jugador/nivel)
CREATE OR REPLACE VIEW ranking_by_level_time AS
SELECT 
    lc.level_id,
    p.id as player_id,
    p.name as player_name,
    MIN(lc.completion_time) as best_time,
    MAX(lc.points) as best_points,
    MAX(lc.completed_at) as last_completion,
    ROW_NUMBER() OVER (PARTITION BY lc.level_id ORDER BY MIN(lc.completion_time) ASC) as rank
FROM level_completions lc
JOIN players p ON lc.player_id = p.id
GROUP BY lc.level_id, p.id, p.name
ORDER BY lc.level_id, best_time ASC;

-- ========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ========================================

-- Descomentar si quieres insertar datos de prueba
/*
INSERT INTO players (name) VALUES 
    ('SpeedRunner'),
    ('ProGamer'),
    ('Principiante');

-- SpeedRunner: Muy rápido en todos los niveles
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 45.0, 964  -- 1000 - (45 × 0.8) = 964
FROM players p 
WHERE p.name = 'SpeedRunner';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 2, 120.0, 904  -- 1000 - (120 × 0.8) = 904
FROM players p 
WHERE p.name = 'SpeedRunner';

-- ProGamer: Tiempo promedio
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 600.0, 520  -- 1000 - (600 × 0.8) = 520
FROM players p 
WHERE p.name = 'ProGamer';

-- Principiante: Lento pero completa
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 1200.0, 100  -- 1000 - (1200 × 0.8) = -60 → MIN = 100
FROM players p 
WHERE p.name = 'Principiante';
*/
