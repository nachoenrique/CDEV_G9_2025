/**
 * Main.js - Punto de entrada de la aplicación
 * Orquesta todos los módulos del juego
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Game } from './core/Game.js';
import { RankingManager } from './core/RankingManager.js';
import { MenuManager } from './ui/MenuManager.js';
import { RankingDisplay } from './ui/RankingDisplay.js';
import { DebugManager } from './utils/DebugManager.js';
import { CameraZoom } from './utils/cameraZoom.js';
import { LEVELS_CONFIG, GAME_CONFIG } from './config/levels.config.js';
import { isMobile, isIOS, requiresMotionPermission } from './utils/deviceDetection.js';

// Variables globales mínimas
let scene, camera, renderer, world;
let game, menuManager, debugManager, cameraZoom, rankingManager, rankingDisplay;
let lightingSystem = {
    ambient: null,
    directional: null,
    pointLights: []
};

/**
 * Inicializa la aplicación
 */
function init() {
    console.log('🚀 Iniciando Maze Game...');
    
    // Setup básico de Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 0);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Habilitar sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Iluminación base (se actualizará con cada nivel)
    setupLighting();
    
    // Setup de Cannon.js
    world = new CANNON.World();
    world.gravity.set(
        GAME_CONFIG.physics.gravity.x,
        GAME_CONFIG.physics.gravity.y,
        GAME_CONFIG.physics.gravity.z
    );
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = GAME_CONFIG.physics.solverIterations;
    world.allowSleep = false;
    
    // Managers
    debugManager = new DebugManager(scene, world);
    rankingManager = new RankingManager();
    menuManager = new MenuManager(onLevelSelect, onDebugToggle, onGyroscopeToggle);
    rankingDisplay = new RankingDisplay(rankingManager);
    
    // Sistema de zoom de cámara
    cameraZoom = new CameraZoom(camera, 30, 80, 2, 0.15);
    
    // Game con referencia a la configuración de niveles, debugManager y rankingManager
    game = new Game(scene, world, camera, GAME_CONFIG, menuManager, debugManager);
    game.config.levelsConfig = LEVELS_CONFIG; // Añadir referencia para desbloqueo
    game.rankingManager = rankingManager; // Añadir referencia al rankingManager
    
    // Aplicar progreso guardado a los niveles
    game.progressManager.applyToLevelsConfig(LEVELS_CONFIG);
    console.log('📊 Progreso cargado:', game.progressManager.getStats());
    
    // Event listener para botón de rankings
    const showRankingsBtn = document.getElementById('show-rankings-btn');
    if (showRankingsBtn) {
        showRankingsBtn.addEventListener('click', () => {
            rankingDisplay.show();
        });
    }
    
    // Event listener para botón de resetear progreso
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            game.progressManager.resetProgress();
        });
    }
    
    // Configurar callback de calibración del giroscopio
    menuManager.setCalibrationCallback(() => {
        game.controller.calibrateGyroscope();
    });
    
    // Crear botones de niveles en el menú
    menuManager.createLevelButtons(LEVELS_CONFIG);
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Keyboard shortcut: Esc para pausar y abrir/ocultar el menú
    function _onEscapeKey(e) {
        const key = e.key || e.code || e.keyCode;
        if (key === 'Escape' || key === 'Esc' || key === 'Escape') {
            // Determinar si el menú está visible
            const menuEl = menuManager && menuManager.menuContainer ? menuManager.menuContainer : document.getElementById('menu-container');
            const menuVisible = menuEl ? !menuEl.classList.contains('hidden') : false;

            if (menuVisible) {
                // Si el menú está abierto, cerrarlo y reanudar el juego
                if (menuManager && typeof menuManager.hideMenu === 'function') menuManager.hideMenu();
                if (game && typeof game.resume === 'function') game.resume();
            } else {
                // Si el menú está cerrado, abrirlo y pausar el juego
                if (menuManager && typeof menuManager.showMenu === 'function') menuManager.showMenu();
                if (game && typeof game.pause === 'function') game.pause();
            }
        }
    }

    window.addEventListener('keydown', _onEscapeKey);
    
    // Manejo de giroscopio según el dispositivo
    if (isMobile()) {
        console.log('📱 Dispositivo móvil detectado');
        
        if (isIOS() && requiresMotionPermission()) {
            // iOS 13+ requiere interacción del usuario para solicitar permisos
            console.log('🍎 iOS 13+ detectado - El giroscopio debe activarse manualmente desde el menú');
            console.log('ℹ️ Usa el botón de giroscopio en el menú para activar los sensores de movimiento');
            
            // Mostrar un aviso temporal al usuario
            setTimeout(() => {
                const iosNotice = document.createElement('div');
                iosNotice.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 122, 255, 0.95);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    max-width: 90%;
                    text-align: center;
                `;
                iosNotice.innerHTML = '📱 Para usar el giroscopio, actívalo desde el menú ⚙️';
                document.body.appendChild(iosNotice);
                
                // Remover el aviso después de 5 segundos
                setTimeout(() => {
                    iosNotice.style.transition = 'opacity 0.5s';
                    iosNotice.style.opacity = '0';
                    setTimeout(() => iosNotice.remove(), 500);
                }, 5000);
            }, 1000);
        } else {
            // Android u otros dispositivos - intentar activar automáticamente
            console.log('🤖 Dispositivo móvil no-iOS detectado - Intentando activar giroscopio automáticamente');
            setTimeout(async () => {
                const success = await game.controller.enableGyroscope();
                if (success) {
                    console.log('✅ Giroscopio activado automáticamente');
                    menuManager.updateGyroscopeToggle(true);
                } else {
                    console.warn('⚠️ No se pudo activar el giroscopio automáticamente - usa el botón del menú');
                }
            }, 500);
        }
    } else {
        console.log('🖥️ Desktop detectado - Usando control por mouse');
    }
    
    console.log('✅ Aplicación iniciada correctamente');
    
    // Iniciar loop de animación
    animate();
}

/**
 * Configura la iluminación base de la escena
 */
function setupLighting() {
    // Luz ambiental suave
    lightingSystem.ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(lightingSystem.ambient);
    
    // Luz direccional principal con sombras
    lightingSystem.directional = new THREE.DirectionalLight(0xffffff, 0.8);
    lightingSystem.directional.position.set(10, 30, 10);
    lightingSystem.directional.castShadow = true;
    lightingSystem.directional.shadow.camera.near = 0.1;
    lightingSystem.directional.shadow.camera.far = 100;
    lightingSystem.directional.shadow.camera.left = -50;
    lightingSystem.directional.shadow.camera.right = 50;
    lightingSystem.directional.shadow.camera.top = 50;
    lightingSystem.directional.shadow.camera.bottom = -50;
    lightingSystem.directional.shadow.mapSize.width = 2048;
    lightingSystem.directional.shadow.mapSize.height = 2048;
    scene.add(lightingSystem.directional);
    
    console.log('💡 Sistema de iluminación base configurado');
}

/**
 * Actualiza las luces según el nivel de dificultad
 * @param {number} levelId - ID del nivel (1, 2 o 3)
 */
function updateLevelLighting(levelId) {
    // Remover luces anteriores de punto
    lightingSystem.pointLights.forEach(light => {
        scene.remove(light);
    });
    lightingSystem.pointLights = [];
    
    // Obtener la configuración de iluminación del nivel actual
    const config = LEVELS_CONFIG[levelId].lighting;
    
    // Actualizar luz ambiental con tinte de color
    lightingSystem.ambient.color.setHex(config.ambient);
    lightingSystem.ambient.intensity = 0.4;
    
    // Crear luces puntuales en las esquinas del laberinto
    // const positions = [
    //     { x: 15, y: 15, z: 15 },   // Esquina noreste superior
    //     { x: -15, y: 15, z: 15 },  // Esquina noroeste superior
    //     { x: 15, y: 15, z: -15 },  // Esquina sureste superior
    //     { x: -15, y: 15, z: -15 }, // Esquina suroeste superior
    // ];
    
    // positions.forEach((pos, index) => {
    //     const colorIndex = index % config.colors.length;
    //     const pointLight = new THREE.PointLight(
    //         config.colors[colorIndex],
    //         config.intensity,
    //         50  // Distancia de alcance
    //     );
    //     pointLight.position.set(pos.x, pos.y, pos.z);
    //     pointLight.castShadow = true;
    //     pointLight.shadow.mapSize.width = 512;
    //     pointLight.shadow.mapSize.height = 512;
        
    //     // Guardar intensidad base para animación
    //     pointLight.userData.baseIntensity = config.intensity;
        
    //     scene.add(pointLight);
    //     lightingSystem.pointLights.push(pointLight);
        
    //     // Añadir esfera visual pequeña para ver donde está la luz (opcional)
    //     const sphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    //     const sphereMaterial = new THREE.MeshBasicMaterial({ 
    //         color: config.colors[colorIndex],
    //         transparent: true,
    //         opacity: 0.8
    //     });
    //     const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    //     sphere.position.copy(pointLight.position);
    //     scene.add(sphere);
    //     lightingSystem.pointLights.push(sphere); // Para eliminarlas después
    // });
    
    console.log(`💡 Iluminación de nivel ${levelId} configurada:`, config.description);
}

/**
 * Callback cuando se selecciona un nivel
 * @param {number} levelId - ID del nivel seleccionado
 */
function onLevelSelect(levelId) {
    console.log(`📍 Nivel ${levelId} seleccionado`);
    
    // Si es nivel 1 y no hay nombre guardado, mostrar modal
    if (levelId === 1 && !menuManager.getPlayerName()) {
        console.log('📝 No hay nombre guardado, mostrando modal...');
        menuManager.showPlayerNameModal(async (playerName) => {
            console.log('✅ Nombre confirmado:', playerName);
            // Obtener o crear el jugador en la base de datos
            await rankingManager.getOrCreatePlayer(playerName);
            // Iniciar el nivel
            startLevel(levelId);
        });
    } else {
        // Si ya hay nombre o no es nivel 1, cargar directo
        if (menuManager.getPlayerName() && !rankingManager.currentPlayer) {
            // Asegurarse de que el jugador esté cargado en rankingManager
            rankingManager.getOrCreatePlayer(menuManager.getPlayerName());
        }
        startLevel(levelId);
    }
}

/**
 * Inicia un nivel (función auxiliar)
 * @param {number} levelId - ID del nivel a iniciar
 */
function startLevel(levelId) {
    updateLevelLighting(levelId);
    game.startLevel(levelId, LEVELS_CONFIG[levelId]);
}

/**
 * Callback cuando se activa/desactiva el debug
 * @param {boolean} enabled - True si está activado
 */
function onDebugToggle(enabled) {
    console.log('🔧 Debug toggle:', enabled);
    debugManager.toggle(enabled);
    
    // Si se activa el debug Y hay un laberinto cargado, crear visualizaciones
    if (enabled && game.levelManager.currentLevel) {
        console.log('🔍 Creando visualizaciones de debug...');
        
        // Visualizar pivote del laberinto
        if (game.levelManager.maze && game.levelManager.maze.mesh) {
            console.log('✅ Visualizando pivote del laberinto...');
            debugManager.visualizeMazePivot(game.levelManager.maze);
        }
        
        // Visualizar planos de colisión (piso y paredes)
        if (game.levelManager.ground && game.levelManager.walls.length > 0) {
            const bounds = game.levelManager.currentLevel.bounds;
            const planeSize = bounds.wallDistance * 2.5;
            
            console.log('✅ Visualizando planos de colisión...');
            debugManager.createGroundVisualization(game.levelManager.ground, planeSize);
            debugManager.createWallVisualizations(
                game.levelManager.walls,
                bounds.wallDistance,
                bounds.wallHeight
            );
        }
    }
}

/**
 * Callback cuando se activa/desactiva el giroscopio
 * @param {boolean} shouldEnable - True si se debe activar
 * @returns {Promise<boolean>} True si quedó activado
 */
async function onGyroscopeToggle(shouldEnable) {
    console.log('📱 Giroscopio toggle:', shouldEnable);
    
    if (shouldEnable) {
        const isActive = await game.controller.enableGyroscope();
        menuManager.updateGyroscopeToggle(isActive);
        
        if (isActive) {
            console.log('✅ Giroscopio activado exitosamente');
        } else {
            console.warn('⚠️ No se pudo activar el giroscopio');
        }
        
        return isActive;
    } else {
        game.controller.disableGyroscope();
        menuManager.updateGyroscopeToggle(false);
        return false;
    }
}

/**
 * Maneja el redimensionamiento de la ventana
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Bucle de animación principal
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Animación sutil de luces (pulsación)
    const time = Date.now() * 0.001; // Tiempo en segundos
    lightingSystem.pointLights.forEach((light, index) => {
        if (light.isPointLight) {
            // Cada luz pulsa a diferente velocidad
            const offset = index * Math.PI / 2;
            const pulse = Math.sin(time * 2 + offset) * 0.3 + 1; // Entre 0.7 y 1.3
            light.intensity = light.userData.baseIntensity * pulse;
        }
    });
    
    // 1. Simulación de física
    world.step(
        GAME_CONFIG.physics.timeStep, 
        GAME_CONFIG.physics.timeStep, 
        GAME_CONFIG.physics.maxSubSteps
    );
    
    // 2. Actualizar juego (controles, verificación de zonas, etc.)
    game.update();
    
    // 3. Actualizar zoom de cámara
    cameraZoom.update();
    
    // 4. Actualizar debug (si está activado)
    debugManager.update(game.levelManager.balls);
    
    // 5. Renderizar escena
    renderer.render(scene, camera);
}

// Iniciar aplicación cuando el DOM esté listo
init();
