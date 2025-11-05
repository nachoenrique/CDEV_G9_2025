/**
 * MenuManager - Gestiona la interfaz de usuario del juego
 * - Menú principal con selección de niveles
 * - HUD durante el juego
 * - Overlay de victoria
 */

export class MenuManager {
    constructor(onLevelSelect, onDebugToggle) {
        this.onLevelSelect = onLevelSelect;
        this.onDebugToggle = onDebugToggle;
        
        // Referencias a elementos del DOM
        this.menuContainer = document.getElementById('menu-container');
        this.levelSelector = document.getElementById('level-selector');
        this.debugToggle = document.getElementById('debug-toggle');
        this.gameHud = document.getElementById('game-hud');
        this.winOverlay = document.getElementById('win-overlay');
        
        this.currentLevelId = null;
        this.nextLevelCallback = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Debug toggle
        if (this.debugToggle) {
            this.debugToggle.addEventListener('change', (e) => {
                this.onDebugToggle(e.target.checked);
            });
        }

        // Botón de pausa
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }

        // Botones del overlay de victoria
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                this.hideWinOverlay();
                if (this.nextLevelCallback) {
                    this.nextLevelCallback();
                }
            });
        }

        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.hideWinOverlay();
                this.showMenu();
            });
        }
    }

    /**
     * Crea los botones de selección de niveles dinámicamente
     * @param {Object} levelsConfig - Configuración de todos los niveles
     */
    createLevelButtons(levelsConfig) {
        if (!this.levelSelector) return;
        
        this.levelSelector.innerHTML = '';
        
        Object.values(levelsConfig).forEach(level => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerHTML = `
                <div class="level-btn-content">
                    <h3>Nivel ${level.id}</h3>
                    <p>${level.name}</p>
                </div>
            `;
            btn.disabled = !level.unlocked;
            
            if (!level.unlocked) {
                btn.classList.add('locked');
                btn.innerHTML += '<span class="lock-icon">🔒</span>';
            }
            
            btn.addEventListener('click', () => {
                if (level.unlocked) {
                    this.currentLevelId = level.id;
                    this.hideMenu();
                    this.onLevelSelect(level.id);
                }
            });
            
            this.levelSelector.appendChild(btn);
        });
    }

    /**
     * Muestra el menú principal y oculta el HUD
     */
    showMenu() {
        if (this.menuContainer) {
            this.menuContainer.classList.remove('hidden');
        }
        if (this.gameHud) {
            this.gameHud.classList.add('hidden');
        }
    }

    /**
     * Oculta el menú principal y muestra el HUD
     */
    hideMenu() {
        if (this.menuContainer) {
            this.menuContainer.classList.add('hidden');
        }
        if (this.gameHud) {
            this.gameHud.classList.remove('hidden');
        }
    }

    /**
     * Muestra el overlay de victoria
     * @param {Function} nextLevelCallback - Callback para cargar el siguiente nivel
     */
    showWinOverlay(nextLevelCallback = null) {
        if (this.winOverlay) {
            this.winOverlay.classList.remove('hidden');
        }
        this.nextLevelCallback = nextLevelCallback;
        
        // Mostrar u ocultar el botón de siguiente nivel según si hay más niveles
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.style.display = nextLevelCallback ? 'inline-block' : 'none';
        }
    }

    /**
     * Oculta el overlay de victoria
     */
    hideWinOverlay() {
        if (this.winOverlay) {
            this.winOverlay.classList.add('hidden');
        }
    }

    /**
     * Actualiza la información del HUD durante el juego
     * @param {number} levelId - ID del nivel actual
     * @param {number} greenZones - Número de zonas verdes
     * @param {number} totalZones - Número total de zonas
     */
    updateHUD(levelId, greenZones, totalZones) {
        const currentLevelEl = document.getElementById('current-level');
        if (currentLevelEl) {
            currentLevelEl.textContent = `Nivel: ${levelId}`;
        }
        
        const zonesStatusEl = document.getElementById('zones-status');
        if (zonesStatusEl) {
            zonesStatusEl.textContent = `Zonas: ${greenZones}/${totalZones}`;
            
            // Añadir clase de éxito cuando todas las zonas estén verdes
            if (greenZones === totalZones) {
                zonesStatusEl.classList.add('success');
            } else {
                zonesStatusEl.classList.remove('success');
            }
        }
    }

    /**
     * Desbloquea un nivel
     * @param {number} levelId - ID del nivel a desbloquear
     * @param {Object} levelsConfig - Configuración de niveles actualizada
     */
    unlockLevel(levelId, levelsConfig) {
        if (levelsConfig[levelId]) {
            levelsConfig[levelId].unlocked = true;
            this.createLevelButtons(levelsConfig);
        }
    }
}
