-- ========================================
-- LIMPIAR Y POBLAR CON DATOS DE PRUEBA
-- Borra todo y agrega jugadores/datos de ejemplo
-- ========================================

-- 1. LIMPIAR TODO
DELETE FROM level_completions;
DELETE FROM players;

-- 2. CREAR JUGADORES DE PRUEBA
INSERT INTO players (name) VALUES 
    ('SpeedRunner'),
    ('ProGamer'),
    ('CasualPlayer'),
    ('Principiante'),
    ('MazeExpert');

-- 3. AGREGAR COMPLETACIONES DE PRUEBA

-- SpeedRunner: Muy rápido en todos los niveles (5 niveles)
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 45.0, 964 FROM players p WHERE p.name = 'SpeedRunner';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 2, 120.0, 904 FROM players p WHERE p.name = 'SpeedRunner';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 3, 180.0, 856 FROM players p WHERE p.name = 'SpeedRunner';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 4, 240.0, 808 FROM players p WHERE p.name = 'SpeedRunner';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 5, 300.0, 760 FROM players p WHERE p.name = 'SpeedRunner';

-- ProGamer: Tiempo promedio (3 niveles)
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 300.0, 760 FROM players p WHERE p.name = 'ProGamer';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 2, 450.0, 640 FROM players p WHERE p.name = 'ProGamer';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 3, 600.0, 520 FROM players p WHERE p.name = 'ProGamer';

-- CasualPlayer: Tiempo normal (2 niveles)
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 500.0, 600 FROM players p WHERE p.name = 'CasualPlayer';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 2, 700.0, 440 FROM players p WHERE p.name = 'CasualPlayer';

-- Principiante: Lento pero completa (1 nivel)
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 1200.0, 100 FROM players p WHERE p.name = 'Principiante';

-- MazeExpert: Excelente en niveles específicos (2 niveles, muy rápido)
INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 1, 30.0, 976 FROM players p WHERE p.name = 'MazeExpert';

INSERT INTO level_completions (player_id, level_id, completion_time, points) 
SELECT p.id, 3, 90.0, 928 FROM players p WHERE p.name = 'MazeExpert';

-- 4. VERIFICAR DATOS INSERTADOS
SELECT 
    'TOTAL JUGADORES' as info, 
    COUNT(*) as cantidad 
FROM players

UNION ALL

SELECT 
    'TOTAL COMPLETACIONES' as info, 
    COUNT(*) as cantidad 
FROM level_completions

UNION ALL

SELECT 
    'RANKING GLOBAL TOP 3' as info, 
    NULL as cantidad
    
UNION ALL

SELECT 
    CONCAT(rank, '. ', name, ' - ', total_points, ' pts') as info,
    NULL as cantidad
FROM (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
        name,
        total_points
    FROM ranking_global
    LIMIT 3
) top3;

-- Resultado esperado:
-- info                                          | cantidad
-- ----------------------------------------------|----------
-- TOTAL JUGADORES                               | 5
-- TOTAL COMPLETACIONES                          | 14
-- RANKING GLOBAL TOP 3                          | NULL
-- 1. SpeedRunner - 4292 pts                     | NULL
-- 2. ProGamer - 1920 pts                        | NULL
-- 3. MazeExpert - 1904 pts                      | NULL
