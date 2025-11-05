/**
 * Main.js - Punto de entrada de la aplicación
 * Orquesta todos los módulos del juego
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Game } from './core/Game.js';
import { MenuManager } from './ui/MenuManager.js';
import { DebugManager } from './utils/DebugManager.js';
import { LEVELS_CONFIG, GAME_CONFIG } from './config/levels.config.js';

// Variables globales mínimas
let scene, camera, renderer, world;
let game, menuManager, debugManager;

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
    document.body.appendChild(renderer.domElement);
    
    // Luces
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));
    
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
    menuManager = new MenuManager(onLevelSelect, onDebugToggle);
    
    // Game con referencia a la configuración de niveles y debugManager
    game = new Game(scene, world, camera, GAME_CONFIG, menuManager, debugManager);
    game.config.levelsConfig = LEVELS_CONFIG; // Añadir referencia para desbloqueo
    
    // Crear botones de niveles en el menú
    menuManager.createLevelButtons(LEVELS_CONFIG);
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    
    console.log('✅ Aplicación iniciada correctamente');
    
    // Iniciar loop de animación
    animate();
}

/**
 * Callback cuando se selecciona un nivel
 * @param {number} levelId - ID del nivel seleccionado
 */
function onLevelSelect(levelId) {
    console.log(`📍 Nivel ${levelId} seleccionado`);
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
    
    // 1. Simulación de física
    world.step(
        GAME_CONFIG.physics.timeStep, 
        GAME_CONFIG.physics.timeStep, 
        GAME_CONFIG.physics.maxSubSteps
    );
    
    // 2. Actualizar juego (controles, verificación de zonas, etc.)
    game.update();
    
    // 3. Actualizar debug (si está activado)
    debugManager.update(game.levelManager.balls);
    
    // 4. Renderizar escena
    renderer.render(scene, camera);
}

// Iniciar aplicación cuando el DOM esté listo
init();
