/**
 * MenuManager - Gestiona la interfaz de usuario del juego
 * - Menú principal con selección de niveles
 * - HUD durante el juego
 * - Overlay de victoria
 * - Controles de giroscopio
 */

import { isMobile, isIOS, requiresMotionPermission } from '../utils/deviceDetection.js';

export class MenuManager {
    constructor(onLevelSelect, onDebugToggle, onGyroscopeToggle = null) {
        this.onLevelSelect = onLevelSelect;
        this.onDebugToggle = onDebugToggle;
        this.onGyroscopeToggle = onGyroscopeToggle;
        
        // Referencias a elementos del DOM
        this.menuContainer = document.getElementById('menu-container');
        this.levelSelector = document.getElementById('level-selector');
        this.debugToggle = document.getElementById('debug-toggle');
        this.gyroscopeToggle = document.getElementById('gyroscope-toggle');
        this.calibrateBtn = document.getElementById('calibrate-btn');
        this.gameHud = document.getElementById('game-hud');
        this.winOverlay = document.getElementById('win-overlay');
        this.playerNameModal = document.getElementById('player-name-modal');
        this.playerNameForm = document.getElementById('player-name-form');
        this.playerNameInput = document.getElementById('player-name-input');
        this.nameError = document.getElementById('name-error');
        
        this.currentLevelId = null;
        this.nextLevelCallback = null;
        this.isMobileDevice = isMobile();
        this.isIOSDevice = isIOS();
        this.needsMotionPermission = requiresMotionPermission();
        this.levelsConfig = null; // Guardar referencia a la config de niveles
        
        // Callback cuando se confirma el nombre
        this.onPlayerNameConfirmed = null;
        
        this.setupEventListeners();
        this.setupDeviceSpecificUI();
    }

    setupEventListeners() {
        // Debug toggle
        if (this.debugToggle) {
            this.debugToggle.addEventListener('change', (e) => {
                this.onDebugToggle(e.target.checked);
            });
        }

        // Gyroscope toggle - En iOS 13+ siempre debe estar disponible para que el usuario active manualmente
        // En otros móviles también mostrarlo como opción
        if (this.gyroscopeToggle && this.onGyroscopeToggle) {
            this.gyroscopeToggle.addEventListener('change', async (e) => {
                const isActive = await this.onGyroscopeToggle(e.target.checked);
                // Si falló la activación, desmarcar el checkbox
                if (!isActive && e.target.checked) {
                    e.target.checked = false;
                    this.showGyroscopeError();
                }
            });
        }

        // Calibrate button
        if (this.calibrateBtn) {
            this.calibrateBtn.addEventListener('click', () => {
                if (this.onCalibrate) {
                    this.onCalibrate();
                    this.showCalibrationMessage();
                }
            });
        }

        // Formulario de nombre del jugador
        if (this.playerNameForm) {
            this.playerNameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePlayerNameSubmit();
            });
        }

        // Validación en tiempo real del input
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('input', () => {
                this.hideNameError();
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
                // Refrescar los botones de niveles para mostrar los recién desbloqueados
                if (this.levelsConfig) {
                    this.createLevelButtons(this.levelsConfig);
                }
            });
        }
    }

    /**
     * Configura la UI según el tipo de dispositivo
     */
    setupDeviceSpecificUI() {
        if (this.isMobileDevice) {
            // En móvil: MOSTRAR el toggle del giroscopio para que el usuario lo active manualmente
            // Esto es especialmente importante en iOS 13+ donde se requiere interacción del usuario
            if (this.gyroscopeToggle) {
                this.gyroscopeToggle.parentElement.style.display = 'flex';
                // Añadir texto explicativo para iOS
                if (this.isIOSDevice && this.needsMotionPermission) {
                    const toggleLabel = this.gyroscopeToggle.parentElement.querySelector('label');
                    if (toggleLabel) {
                        toggleLabel.title = 'Activa el giroscopio para controlar con el movimiento del dispositivo';
                    }
                }
            }
            if (this.calibrateBtn) {
                this.calibrateBtn.style.display = 'inline-block';
            }
            console.log('📱 Interfaz configurada para MÓVIL - Toggle de giroscopio visible');
            if (this.isIOSDevice && this.needsMotionPermission) {
                console.log('🍎 iOS 13+ detectado - El usuario debe activar el giroscopio manualmente');
            }
        } else {
            // En desktop: ocultar controles de giroscopio completamente
            if (this.gyroscopeToggle) {
                this.gyroscopeToggle.parentElement.style.display = 'none';
            }
            if (this.calibrateBtn) {
                this.calibrateBtn.style.display = 'none';
            }
            console.log('🖥️ Interfaz configurada para DESKTOP - Control por mouse');
        }
    }

    /**
     * Crea los botones de selección de niveles dinámicamente
     * @param {Object} levelsConfig - Configuración de todos los niveles
     */
    createLevelButtons(levelsConfig) {
        if (!this.levelSelector) return;
        
        // Guardar referencia para poder refrescar después
        this.levelsConfig = levelsConfig;
        
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
            console.log(`🔓 Nivel ${levelId} desbloqueado en UI`);
        }
    }

    /**
     * Establece el callback para calibración del giroscopio
     * @param {Function} callback - Función a ejecutar al calibrar
     */
    setCalibrationCallback(callback) {
        this.onCalibrate = callback;
    }

    /**
     * Muestra mensaje de error al activar giroscopio
     */
    showGyroscopeError() {
        const message = document.createElement('div');
        message.className = 'gyroscope-message error';
        
        // Mensaje más específico para iOS
        if (this.isIOSDevice && this.needsMotionPermission) {
            message.innerHTML = `
                ❌ No se pudo activar el giroscopio.<br>
                <small>Asegúrate de estar en HTTPS y permitir el acceso a sensores de movimiento.</small>
            `;
        } else {
            message.textContent = '❌ No se pudo activar el giroscopio. Verifica permisos.';
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.transition = 'opacity 0.3s';
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }

    /**
     * Muestra mensaje de calibración exitosa
     */
    showCalibrationMessage() {
        const message = document.createElement('div');
        message.className = 'gyroscope-message success';
        message.textContent = '✅ Giroscopio calibrado';
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 2000);
    }

    /**
     * Actualiza el estado visual del toggle de giroscopio
     * @param {boolean} isActive - Si el giroscopio está activo
     */
    updateGyroscopeToggle(isActive) {
        if (this.gyroscopeToggle) {
            this.gyroscopeToggle.checked = isActive;
        }
        
        // Mostrar/ocultar botón de calibración
        if (this.calibrateBtn) {
            this.calibrateBtn.style.display = isActive ? 'inline-block' : 'none';
        }
    }

    /**
     * Muestra el modal para ingresar el nombre del jugador
     * @param {Function} callback - Función a ejecutar cuando se confirme el nombre
     */
    showPlayerNameModal(callback) {
        this.onPlayerNameConfirmed = callback;
        if (this.playerNameModal) {
            this.playerNameModal.classList.remove('hidden');
            // Focus en el input
            setTimeout(() => {
                if (this.playerNameInput) {
                    this.playerNameInput.focus();
                }
            }, 100);
        }
    }

    /**
     * Oculta el modal de nombre del jugador
     */
    hidePlayerNameModal() {
        if (this.playerNameModal) {
            this.playerNameModal.classList.add('hidden');
        }
        if (this.playerNameInput) {
            this.playerNameInput.value = '';
        }
        this.hideNameError();
    }

    /**
     * Maneja el envío del formulario de nombre
     */
    handlePlayerNameSubmit() {
        const name = this.playerNameInput.value.trim();
        
        // Validar nombre
        if (name.length < 2) {
            this.showNameError();
            return;
        }

        // Guardar en localStorage
        localStorage.setItem('playerName', name);
        console.log('👤 Nombre del jugador guardado:', name);

        // Ocultar modal
        this.hidePlayerNameModal();

        // Ejecutar callback
        if (this.onPlayerNameConfirmed) {
            this.onPlayerNameConfirmed(name);
        }
    }

    /**
     * Muestra el mensaje de error del nombre
     */
    showNameError() {
        if (this.nameError) {
            this.nameError.classList.remove('hidden');
        }
        if (this.playerNameInput) {
            this.playerNameInput.style.borderColor = '#ff4444';
        }
    }

    /**
     * Oculta el mensaje de error del nombre
     */
    hideNameError() {
        if (this.nameError) {
            this.nameError.classList.add('hidden');
        }
        if (this.playerNameInput) {
            this.playerNameInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
    }

    /**
     * Obtiene el nombre del jugador desde localStorage
     * @returns {string|null} Nombre del jugador o null
     */
    getPlayerName() {
        return localStorage.getItem('playerName');
    }

    /**
     * Actualiza el overlay de victoria con tiempo y puntos
     * @param {number} timeInSeconds - Tiempo en segundos
     * @param {number} points - Puntos obtenidos
     */
    updateWinOverlay(timeInSeconds, points) {
        const timeEl = document.getElementById('completion-time');
        const pointsEl = document.getElementById('completion-points');

        if (timeEl) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (pointsEl) {
            pointsEl.textContent = points;
        }
    }
}
