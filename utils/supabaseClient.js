/**
 * Supabase Client - Configuración y conexión a la base de datos
 * Gestiona la comunicación con Supabase para el sistema de ranking
 */

import { createClient } from '@supabase/supabase-js';

// 🔑 CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://wdqyzfvhyclcspysuulo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcXl6ZnZoeWNsY3NweXN1dWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODYyMDksImV4cCI6MjA3ODM2MjIwOX0.MCROYrzNKzbDDr5oEpvInmdznpgvmf1t7062K0oIhNM';

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verifica la conexión con Supabase
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
export async function testConnection() {
    try {
        console.log('🔍 Probando conexión con Supabase...');
        
        // Intentar hacer una query simple
        const { data, error } = await supabase
            .from('players')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión exitosa con Supabase!');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con Supabase:', error);
        return false;
    }
}

/**
 * Prueba completa del sistema de ranking
 * Crea un jugador de prueba y verifica las tablas
 */
export async function testRankingSystem() {
    try {
        console.log('🧪 Iniciando prueba completa del sistema...');
        
        // 1. Crear jugador de prueba
        const testPlayerName = `Test_${Date.now()}`;
        const { data: player, error: playerError } = await supabase
            .from('players')
            .insert({ name: testPlayerName })
            .select()
            .single();
        
        if (playerError) {
            console.error('❌ Error al crear jugador:', playerError.message);
            return false;
        }
        
        console.log('✅ Jugador de prueba creado:', player);
        
        // 2. Guardar completaciones de prueba con puntos (fórmula: 1000 - tiempo*0.8)
        const testCompletions = [
            { player_id: player.id, level_id: 1, completion_time: 60.0, points: 952 },   // Rápido
            { player_id: player.id, level_id: 2, completion_time: 300.0, points: 760 },  // Normal
            { player_id: player.id, level_id: 3, completion_time: 600.0, points: 520 }   // Promedio
        ];
        
        const { data: completions, error: completionError } = await supabase
            .from('level_completions')
            .insert(testCompletions)
            .select();
        
        if (completionError) {
            console.error('❌ Error al guardar completaciones:', completionError.message);
            return false;
        }
        
        console.log('✅ Completaciones guardadas:', completions);
        
        // 3. Probar vista de ranking global
        const { data: globalRanking, error: globalError } = await supabase
            .from('ranking_global')
            .select('*')
            .limit(5);
        
        if (globalError) {
            console.error('❌ Error al leer ranking global:', globalError.message);
            return false;
        }
        
        console.log('✅ Ranking Global (Top 5):');
        globalRanking.forEach((p, i) => {
            console.log(`   ${i+1}. ${p.name} - ${p.total_points} pts (${p.levels_completed} niveles)`);
        });
        
        // 4. Probar vista de ranking por nivel
        const { data: levelRanking, error: levelError } = await supabase
            .from('ranking_by_level_time')
            .select('*')
            .eq('level_id', 1)
            .limit(5);
        
        if (levelError) {
            console.error('❌ Error al leer ranking por nivel:', levelError.message);
            return false;
        }
        
        console.log('✅ Ranking Nivel 1 (Top 5 mejores tiempos):');
        levelRanking.forEach((p, i) => {
            console.log(`   ${i+1}. ${p.player_name} - ${p.best_time.toFixed(2)}s (${p.best_points} pts)`);
        });
        
        console.log('🎉 ¡Sistema de ranking funcionando correctamente!');
        
        return true;
    } catch (error) {
        console.error('❌ Error en prueba del sistema:', error);
        return false;
    }
}
