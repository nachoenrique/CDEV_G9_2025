/**
 * RankingDisplay - Gestiona la visualización de rankings
 * - Muestra ranking global por puntos
 * - Muestra ranking por nivel (mejores tiempos)
 * - Maneja tabs y actualización de datos
 */

export class RankingDisplay {
    constructor(rankingManager) {
        this.rankingManager = rankingManager;
        
        // Referencias a elementos del DOM
        this.container = document.getElementById('rankings-container');
        this.globalList = document.getElementById('global-ranking-list');
        this.levelList = document.getElementById('level-ranking-list');
        this.closeBtn = document.getElementById('close-rankings-btn');
        this.refreshGlobalBtn = document.getElementById('refresh-global-btn');
        this.refreshLevelBtn = document.getElementById('refresh-level-btn');
        
        // Estado
        this.currentTab = 'global';
        this.selectedLevel = 1;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tabs principales
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Tabs de niveles
        const levelTabBtns = document.querySelectorAll('.level-tab-btn');
        levelTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                this.selectLevel(level);
            });
        });

        // Botones de refresh
        if (this.refreshGlobalBtn) {
            this.refreshGlobalBtn.addEventListener('click', () => {
                this.loadGlobalRanking();
            });
        }

        if (this.refreshLevelBtn) {
            this.refreshLevelBtn.addEventListener('click', () => {
                this.loadLevelRanking(this.selectedLevel);
            });
        }

        // Botón cerrar
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    /**
     * Muestra la pantalla de rankings
     */
    async show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
        
        // Cargar datos según el tab activo
        if (this.currentTab === 'global') {
            await this.loadGlobalRanking();
        } else {
            await this.loadLevelRanking(this.selectedLevel);
        }
    }

    /**
     * Oculta la pantalla de rankings
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }

    /**
     * Cambia entre tabs (global/levels)
     */
    switchTab(tab) {
        this.currentTab = tab;
        
        // Actualizar botones de tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });
        
        // Cargar datos
        if (tab === 'global') {
            this.loadGlobalRanking();
        } else {
            this.loadLevelRanking(this.selectedLevel);
        }
    }

    /**
     * Selecciona un nivel específico
     */
    selectLevel(level) {
        this.selectedLevel = level;
        
        // Actualizar botones de nivel
        document.querySelectorAll('.level-tab-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
        });
        
        // Cargar datos del nivel
        this.loadLevelRanking(level);
    }

    /**
     * Carga y muestra el ranking global
     */
    async loadGlobalRanking() {
        if (!this.globalList) return;
        
        this.globalList.innerHTML = '<div class="loading">Cargando...</div>';
        
        try {
            const rankings = await this.rankingManager.getRankingGlobal(20);
            
            if (rankings.length === 0) {
                this.globalList.innerHTML = '<div class="loading">No hay datos aún. ¡Sé el primero!</div>';
                return;
            }
            
            const currentPlayerId = this.rankingManager.currentPlayer?.id;
            
            const html = rankings.map((player, index) => {
                const rank = index + 1;
                const isCurrentPlayer = player.id === currentPlayerId;
                const topClass = rank <= 3 ? `top-${rank}` : '';
                const currentClass = isCurrentPlayer ? 'current-player' : '';
                
                return `
                    <div class="ranking-item ${topClass} ${currentClass}">
                        <div class="rank-number ${topClass}">#${rank}</div>
                        <div class="player-info">
                            <div class="player-name">
                                ${player.name} ${isCurrentPlayer ? '👤 (Tú)' : ''}
                            </div>
                            <div class="player-stats">
                                ${player.levels_completed} nivel${player.levels_completed !== 1 ? 'es' : ''} completado${player.levels_completed !== 1 ? 's' : ''}
                                • ${player.total_completions} jugada${player.total_completions !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div class="player-score">${player.total_points} pts</div>
                    </div>
                `;
            }).join('');
            
            this.globalList.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Error al cargar ranking global:', error);
            this.globalList.innerHTML = '<div class="loading">Error al cargar rankings</div>';
        }
    }

    /**
     * Carga y muestra el ranking de un nivel específico
     */
    async loadLevelRanking(levelId) {
        if (!this.levelList) return;
        
        this.levelList.innerHTML = '<div class="loading">Cargando...</div>';
        
        try {
            const rankings = await this.rankingManager.getRankingByLevel(levelId, 20);
            
            if (rankings.length === 0) {
                this.levelList.innerHTML = `<div class="loading">No hay datos para el nivel ${levelId} aún</div>`;
                return;
            }
            
            const currentPlayerId = this.rankingManager.currentPlayer?.id;
            
            const html = rankings.map((player, index) => {
                const rank = index + 1;
                const isCurrentPlayer = player.player_id === currentPlayerId;
                const topClass = rank <= 3 ? `top-${rank}` : '';
                const currentClass = isCurrentPlayer ? 'current-player' : '';
                
                return `
                    <div class="ranking-item ${topClass} ${currentClass}">
                        <div class="rank-number ${topClass}">#${rank}</div>
                        <div class="player-info">
                            <div class="player-name">
                                ${player.player_name} ${isCurrentPlayer ? '👤 (Tú)' : ''}
                            </div>
                            <div class="player-stats">
                                ⏱️ ${this.formatTime(player.best_time)} • ${player.best_points} puntos
                            </div>
                        </div>
                        <div class="player-score">${this.formatTime(player.best_time)}</div>
                    </div>
                `;
            }).join('');
            
            this.levelList.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Error al cargar ranking por nivel:', error);
            this.levelList.innerHTML = '<div class="loading">Error al cargar rankings</div>';
        }
    }

    /**
     * Formatea tiempo en formato MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
