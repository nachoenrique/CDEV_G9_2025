/**
 * ProgressManager - Gestiona el progreso del jugador en localStorage
 * - Guarda niveles desbloqueados
 * - Persiste el progreso entre sesiones
 * - Desbloquea niveles cuando se completan
 */

export class ProgressManager {
    constructor() {
        this.STORAGE_KEY = 'mazeGameProgress';
        this.progress = this.loadProgress();
    }

    /**
     * Carga el progreso desde localStorage
     * @returns {Object} Objeto con el progreso del jugador
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const progress = JSON.parse(saved);
                console.log('💾 Progreso cargado:', progress);
                return progress;
            }
        } catch (error) {
            console.error('❌ Error al cargar progreso:', error);
        }

        // Progreso por defecto: solo nivel 1 desbloqueado
        const defaultProgress = {
            unlockedLevels: [1],
            completedLevels: [],
            lastPlayedLevel: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('🆕 Creando progreso nuevo');
        this.saveProgress(defaultProgress);
        return defaultProgress;
    }

    /**
     * Guarda el progreso en localStorage
     * @param {Object} progress - Objeto de progreso a guardar
     */
    saveProgress(progress = null) {
        try {
            const dataToSave = progress || this.progress;
            dataToSave.updatedAt = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
            console.log('✅ Progreso guardado');
        } catch (error) {
            console.error('❌ Error al guardar progreso:', error);
        }
    }

    /**
     * Verifica si un nivel está desbloqueado
     * @param {number} levelId - ID del nivel a verificar
     * @returns {boolean} True si el nivel está desbloqueado
     */
    isLevelUnlocked(levelId) {
        return this.progress.unlockedLevels.includes(levelId);
    }

    /**
     * Desbloquea un nivel
     * @param {number} levelId - ID del nivel a desbloquear
     */
    unlockLevel(levelId) {
        if (!this.progress.unlockedLevels.includes(levelId)) {
            this.progress.unlockedLevels.push(levelId);
            this.progress.unlockedLevels.sort((a, b) => a - b);
            this.saveProgress();
            console.log(`🔓 Nivel ${levelId} desbloqueado`);
        }
    }

    /**
     * Marca un nivel como completado y desbloquea el siguiente
     * @param {number} levelId - ID del nivel completado
     * @param {number} totalLevels - Número total de niveles en el juego
     */
    completeLevel(levelId, totalLevels) {
        // Marcar como completado
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
            this.progress.completedLevels.sort((a, b) => a - b);
            console.log(`✅ Nivel ${levelId} completado`);
        }

        // Desbloquear el siguiente nivel
        const nextLevelId = levelId + 1;
        if (nextLevelId <= totalLevels) {
            this.unlockLevel(nextLevelId);
        }

        // Actualizar último nivel jugado
        this.progress.lastPlayedLevel = levelId;
        
        this.saveProgress();
    }

    /**
     * Verifica si un nivel está completado
     * @param {number} levelId - ID del nivel a verificar
     * @returns {boolean} True si el nivel está completado
     */
    isLevelCompleted(levelId) {
        return this.progress.completedLevels.includes(levelId);
    }

    /**
     * Aplica el progreso guardado a la configuración de niveles
     * @param {Object} levelsConfig - Configuración de niveles del juego
     */
    applyToLevelsConfig(levelsConfig) {
        Object.keys(levelsConfig).forEach(levelId => {
            const id = parseInt(levelId);
            levelsConfig[id].unlocked = this.isLevelUnlocked(id);
        });
        console.log('🔄 Progreso aplicado a configuración de niveles');
    }

    /**
     * Resetea todo el progreso (útil para debugging o empezar de nuevo)
     */
    resetProgress() {
        const confirmReset = confirm('¿Estás seguro de que quieres reiniciar todo el progreso? Esta acción no se puede deshacer.');
        if (confirmReset) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.progress = this.loadProgress();
            console.log('🔄 Progreso reseteado');
            // Recargar la página para aplicar cambios
            window.location.reload();
        }
    }

    /**
     * Obtiene estadísticas del progreso
     * @returns {Object} Estadísticas del progreso
     */
    getStats() {
        return {
            unlockedLevels: this.progress.unlockedLevels.length,
            completedLevels: this.progress.completedLevels.length,
            lastPlayed: this.progress.lastPlayedLevel,
            progress: this.progress
        };
    }

    /**
     * Exporta el progreso como JSON (para backup)
     * @returns {string} JSON del progreso
     */
    exportProgress() {
        return JSON.stringify(this.progress, null, 2);
    }

    /**
     * Importa progreso desde JSON (para restaurar backup)
     * @param {string} jsonString - JSON del progreso a importar
     */
    importProgress(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.unlockedLevels && imported.completedLevels) {
                this.progress = imported;
                this.saveProgress();
                console.log('✅ Progreso importado exitosamente');
                window.location.reload();
            } else {
                throw new Error('Formato de progreso inválido');
            }
        } catch (error) {
            console.error('❌ Error al importar progreso:', error);
            alert('Error al importar progreso. Verifica el formato del archivo.');
        }
    }
}
