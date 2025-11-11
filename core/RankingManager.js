/**
 * RankingManager - Gestiona el sistema de puntos y rankings
 * - Calcula puntos basados en tiempo de completación
 * - Guarda completaciones en Supabase
 * - Obtiene rankings globales y por nivel
 */

import { supabase } from '../utils/supabaseClient.js';

// ⚙️ CONFIGURACIÓN DEL SISTEMA DE PUNTOS
const POINTS_CONFIG = {
    BASE: 1000,              // Puntos base por completar un nivel
    TIME_PENALTY: 0.8,       // Penalización por segundo
    MIN_POINTS: 100          // Puntos mínimos garantizados
};

export class RankingManager {
    constructor() {
        this.currentPlayer = null;
        console.log('🏆 RankingManager inicializado');
    }

    /**
     * Calcula los puntos obtenidos según el tiempo
     * Fórmula: max(BASE - (tiempo × PENALTY), MIN)
     * 
     * @param {number} timeInSeconds - Tiempo en segundos
     * @returns {number} Puntos obtenidos (100-1000)
     */
    calculatePoints(timeInSeconds) {
        const rawPoints = POINTS_CONFIG.BASE - Math.floor(timeInSeconds * POINTS_CONFIG.TIME_PENALTY);
        const points = Math.max(rawPoints, POINTS_CONFIG.MIN_POINTS);
        
        console.log(`📊 Tiempo: ${timeInSeconds.toFixed(2)}s → Puntos: ${points}`);
        return points;
    }

    /**
     * Obtiene o crea un jugador por nombre
     * Primero busca si existe, si no lo crea
     * 
     * @param {string} playerName - Nombre del jugador
     * @returns {Promise<Object|null>} Datos del jugador {id, name, created_at}
     */
    async getOrCreatePlayer(playerName) {
        try {
            // 1. Buscar si el jugador ya existe
            const { data: existingPlayers, error: searchError } = await supabase
                .from('players')
                .select('*')
                .eq('name', playerName)
                .limit(1);

            if (searchError) {
                console.error('❌ Error al buscar jugador:', searchError);
                return null;
            }

            // 2. Si existe, devolverlo
            if (existingPlayers && existingPlayers.length > 0) {
                this.currentPlayer = existingPlayers[0];
                console.log('✅ Jugador encontrado:', this.currentPlayer.name);
                return this.currentPlayer;
            }

            // 3. Si no existe, crearlo
            const { data: newPlayer, error: createError } = await supabase
                .from('players')
                .insert({ name: playerName })
                .select()
                .single();

            if (createError) {
                console.error('❌ Error al crear jugador:', createError);
                return null;
            }

            this.currentPlayer = newPlayer;
            console.log('✅ Jugador creado:', this.currentPlayer.name);
            return this.currentPlayer;

        } catch (error) {
            console.error('❌ Error en getOrCreatePlayer:', error);
            return null;
        }
    }

    /**
     * Guarda una completación de nivel
     * Calcula automáticamente los puntos según el tiempo
     * 
     * @param {string} playerId - ID del jugador
     * @param {number} levelId - ID del nivel (1-5)
     * @param {number} timeInSeconds - Tiempo en segundos
     * @returns {Promise<Object|null>} Datos de la completación guardada
     */
    async saveLevelCompletion(playerId, levelId, timeInSeconds) {
        try {
            const points = this.calculatePoints(timeInSeconds);

            const { data, error } = await supabase
                .from('level_completions')
                .insert({
                    player_id: playerId,
                    level_id: levelId,
                    completion_time: timeInSeconds,
                    points: points
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error al guardar completación:', error);
                return null;
            }

            console.log(`✅ Nivel ${levelId} completado: ${timeInSeconds.toFixed(2)}s = ${points} pts`);
            return data;

        } catch (error) {
            console.error('❌ Error en saveLevelCompletion:', error);
            return null;
        }
    }

    /**
     * Obtiene el ranking global ordenado por puntos totales
     * 
     * @param {number} limit - Cantidad de jugadores a retornar (default: 10)
     * @returns {Promise<Array>} Array de jugadores ordenados por puntos
     */
    async getRankingGlobal(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('ranking_global')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error al obtener ranking global:', error);
                return [];
            }

            console.log(`🏆 Ranking Global (Top ${limit}):`, data);
            return data;

        } catch (error) {
            console.error('❌ Error en getRankingGlobal:', error);
            return [];
        }
    }

    /**
     * Obtiene el ranking de mejores tiempos para un nivel específico
     * 
     * @param {number} levelId - ID del nivel (1-5)
     * @param {number} limit - Cantidad de jugadores a retornar (default: 10)
     * @returns {Promise<Array>} Array de jugadores ordenados por tiempo
     */
    async getRankingByLevel(levelId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('ranking_by_level_time')
                .select('*')
                .eq('level_id', levelId)
                .order('best_time', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('❌ Error al obtener ranking por nivel:', error);
                return [];
            }

            console.log(`🏆 Ranking Nivel ${levelId} (Top ${limit}):`, data);
            return data;

        } catch (error) {
            console.error('❌ Error en getRankingByLevel:', error);
            return [];
        }
    }

    /**
     * Obtiene las estadísticas de un jugador específico
     * 
     * @param {string} playerId - ID del jugador
     * @returns {Promise<Object|null>} Estadísticas del jugador
     */
    async getPlayerStats(playerId) {
        try {
            // Obtener datos del jugador desde la vista global
            const { data: globalData, error: globalError } = await supabase
                .from('ranking_global')
                .select('*')
                .eq('id', playerId)
                .single();

            if (globalError) {
                console.error('❌ Error al obtener estadísticas:', globalError);
                return null;
            }

            // Obtener mejores tiempos por nivel
            const { data: levelTimes, error: timesError } = await supabase
                .from('ranking_by_level_time')
                .select('*')
                .eq('player_id', playerId)
                .order('level_id', { ascending: true });

            if (timesError) {
                console.error('❌ Error al obtener tiempos por nivel:', timesError);
                return globalData;
            }

            const stats = {
                ...globalData,
                level_times: levelTimes
            };

            console.log('📊 Estadísticas del jugador:', stats);
            return stats;

        } catch (error) {
            console.error('❌ Error en getPlayerStats:', error);
            return null;
        }
    }

    /**
     * Formatea el tiempo en formato MM:SS
     * 
     * @param {number} seconds - Tiempo en segundos
     * @returns {string} Tiempo formateado (ej: "05:23")
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Obtiene la posición del jugador actual en el ranking global
     * 
     * @returns {Promise<number>} Posición en el ranking (1-based)
     */
    async getCurrentPlayerRank() {
        if (!this.currentPlayer) return null;

        try {
            const { data, error } = await supabase
                .from('ranking_global')
                .select('id, total_points')
                .order('total_points', { ascending: false });

            if (error) {
                console.error('❌ Error al obtener posición:', error);
                return null;
            }

            const position = data.findIndex(p => p.id === this.currentPlayer.id);
            return position >= 0 ? position + 1 : null;

        } catch (error) {
            console.error('❌ Error en getCurrentPlayerRank:', error);
            return null;
        }
    }
}
