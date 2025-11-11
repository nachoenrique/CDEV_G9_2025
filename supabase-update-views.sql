-- ========================================
-- ACTUALIZAR VISTAS - Solo ejecutar este script
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
