/**
 * Game - Clase principal que gestiona la lógica del juego
 * - Coordina LevelManager y MazeController
 * - Verifica condiciones de victoria
 * - Gestiona el estado del juego
 * - Detecta colisiones entre pelotas y zonas
 */

import { LevelManager } from './LevelManager.js';
import { MazeController } from './MazeController.js';
import { ProgressManager } from '../utils/ProgressManager.js';
import * as CANNON from 'cannon-es';

export class Game {
    constructor(scene, world, camera, config, menuManager, debugManager = null) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.config = config;
        this.menuManager = menuManager;
        this.debugManager = debugManager; // Referencia al debugManager
        this.rankingManager = null; // Se asignará desde main.js
        this.progressManager = new ProgressManager(); // Gestor de progreso
        
        // Materiales de física
        this.materials = this.createMaterials();
        
        // Managers
        this.levelManager = new LevelManager(scene, world, this.materials, this.debugManager);
        this.controller = new MazeController(
            config.controls.maxTilt,
            config.controls.mouseSensitivity
        );
        
        // Estado del juego
        this.currentLevelId = null;
        this.isPlaying = false;
        this.hasWon = false;
        
        // Tracking de tiempo
        this.levelStartTime = null;
        this.levelCompletionTime = null;
    }

    /**
     * Crea y configura los materiales de física
     * @returns {Object} Objeto con materiales de laberinto y pelota
     */
    createMaterials() {
        const mazeMaterial = new CANNON.Material('maze');
        const ballMaterial = new CANNON.Material('ball');
        
        const contactMaterial = new CANNON.ContactMaterial(mazeMaterial, ballMaterial, {
            friction: this.config.materials.maze.friction,
            restitution: this.config.materials.maze.restitution
        });
        this.world.addContactMaterial(contactMaterial);
        
        console.log('🔧 Materiales de física configurados');
        return { maze: mazeMaterial, ball: ballMaterial };
    }

    /**
     * Inicia un nivel específico
     * @param {number} levelId - ID del nivel a iniciar
     * @param {Object} levelConfig - Configuración del nivel
     */
    async startLevel(levelId, levelConfig) {
        this.currentLevelId = levelId;
        this.isPlaying = false;
        this.hasWon = false;
        
        // Iniciar timer
        this.levelStartTime = Date.now();
        this.levelCompletionTime = null;
        console.log('⏱️ Timer iniciado');
        
        await this.levelManager.loadLevel(levelConfig);
        
        // Si el debug está activo, visualizar el pivote del laberinto
        if (this.debugManager && this.debugManager.enabled && this.levelManager.maze) {
            console.log('🎯 Visualizando pivote automáticamente (debug activo)');
            this.debugManager.visualizeMazePivot(this.levelManager.maze);
        }
        
        this.isPlaying = true;
        console.log(`🎮 Nivel ${levelId} iniciado - ¡A jugar!`);
    }

    /**
     * Actualiza el estado del juego en cada frame
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     */
    update(deltaTime) {
        if (!this.isPlaying) return;
        
        // 1. Actualizar controles y rotación del laberinto
        this.controller.update(this.levelManager);
        
        // 2. Sincronizar visuales con física
        this.syncBalls();
        
        // 3. Verificar estado de las zonas
        const { greenZones, totalZones, allGreen } = this.checkZones();
        
        // 4. Actualizar HUD
        this.menuManager.updateHUD(this.currentLevelId, greenZones, totalZones);
        
        // 5. Verificar condición de victoria
        if (allGreen && !this.hasWon) {
            this.onWin();
        }
    }

    /**
     * Sincroniza las posiciones visuales de las pelotas con la física
     */
    syncBalls() {
        this.levelManager.balls.forEach(ball => {
            ball.mesh.position.copy(ball.body.position);
            ball.mesh.quaternion.copy(ball.body.quaternion);
        });
    }

    /**
     * Verifica el estado de las zonas (rojas/verdes) y detecta colisiones
     * @returns {Object} Estado de las zonas (greenZones, totalZones, allGreen)
     */
    checkZones() {
        let greenCount = 0;
        
        this.levelManager.zones.forEach((zone, index) => {
            let hasCollision = false;
            
            // Verificar colisión con cada pelota
            this.levelManager.balls.forEach(ball => {
                if (this.checkAABBCollision(zone, ball)) {
                    hasCollision = true;
                }
            });
            
            // Actualizar estado de la zona
            if (hasCollision && !zone.isGreen) {
                zone.material.color.setHex(0x00ff00);
                zone.isGreen = true;
                console.log(`✅ Zona ${index + 1} activada (verde)`);
            } else if (!hasCollision && zone.isGreen) {
                zone.material.color.setHex(0xff0000);
                zone.isGreen = false;
                console.log(`🔴 Zona ${index + 1} desactivada (roja)`);
            }
            
            if (zone.isGreen) greenCount++;
        });
        
        return {
            greenZones: greenCount,
            totalZones: this.levelManager.zones.length,
            allGreen: greenCount === this.levelManager.zones.length && greenCount > 0
        };
    }

    /**
     * Detecta colisión entre una zona y una pelota usando AABB
     * @param {Object} zone - Zona de objetivo
     * @param {Object} ball - Pelota
     * @returns {boolean} True si hay colisión
     */
    checkAABBCollision(zone, ball) {
        // Calcular límites de la zona (AABB)
        const zoneMin = {
            x: zone.body.position.x - zone.body.shapes[0].halfExtents.x,
            y: zone.body.position.y - zone.body.shapes[0].halfExtents.y,
            z: zone.body.position.z - zone.body.shapes[0].halfExtents.z
        };
        const zoneMax = {
            x: zone.body.position.x + zone.body.shapes[0].halfExtents.x,
            y: zone.body.position.y + zone.body.shapes[0].halfExtents.y,
            z: zone.body.position.z + zone.body.shapes[0].halfExtents.z
        };

        // Calcular límites de la esfera
        const sphereRadius = ball.body.shapes[0].radius;
        const sphereMin = {
            x: ball.body.position.x - sphereRadius,
            y: ball.body.position.y - sphereRadius,
            z: ball.body.position.z - sphereRadius
        };
        const sphereMax = {
            x: ball.body.position.x + sphereRadius,
            y: ball.body.position.y + sphereRadius,
            z: ball.body.position.z + sphereRadius
        };

        // Verificar overlap en los 3 ejes
        const overlapX = sphereMax.x >= zoneMin.x && sphereMin.x <= zoneMax.x;
        const overlapY = sphereMax.y >= zoneMin.y && sphereMin.y <= zoneMax.y;
        const overlapZ = sphereMax.z >= zoneMin.z && sphereMin.z <= zoneMax.z;

        return overlapX && overlapY && overlapZ;
    }

    /**
     * Maneja la condición de victoria
     */
    async onWin() {
        this.hasWon = true;
        this.isPlaying = false;
        
        // Calcular tiempo de completación
        this.levelCompletionTime = (Date.now() - this.levelStartTime) / 1000; // en segundos
        console.log(`🎉 ¡NIVEL COMPLETADO en ${this.levelCompletionTime.toFixed(2)}s!`);
        
        // Guardar progreso: marcar nivel como completado y desbloquear el siguiente
        const totalLevels = Object.keys(this.config.levelsConfig).length;
        this.progressManager.completeLevel(this.currentLevelId, totalLevels);
        
        // Aplicar el progreso a la configuración de niveles
        this.progressManager.applyToLevelsConfig(this.config.levelsConfig);
        
        // Calcular puntos
        let points = 0;
        if (this.rankingManager) {
            points = this.rankingManager.calculatePoints(this.levelCompletionTime);
            console.log(`⭐ Puntos obtenidos: ${points}`);
            
            // Guardar en la base de datos si hay jugador
            if (this.rankingManager.currentPlayer) {
                await this.rankingManager.saveLevelCompletion(
                    this.rankingManager.currentPlayer.id,
                    this.currentLevelId,
                    this.levelCompletionTime
                );
            } else {
                console.warn('⚠️ No hay jugador registrado, no se guardará la completación');
            }
        }
        
        // Actualizar overlay de victoria con estadísticas
        this.menuManager.updateWinOverlay(this.levelCompletionTime, points);
        
        // Determinar si hay un siguiente nivel
        const nextLevelId = this.currentLevelId + 1;
        const hasNextLevel = this.config.levelsConfig && this.config.levelsConfig[nextLevelId];
        
        // Callback para cargar el siguiente nivel (si existe)
        const nextLevelCallback = hasNextLevel ? () => {
            // El nivel ya fue desbloqueado por progressManager.completeLevel()
            // Actualizar la UI del menú con los niveles desbloqueados
            this.menuManager.createLevelButtons(this.config.levelsConfig);
            
            // Cargar el siguiente nivel
            this.startLevel(nextLevelId, this.config.levelsConfig[nextLevelId]);
        } : null;
        
        // Mostrar overlay de victoria
        this.menuManager.showWinOverlay(nextLevelCallback);
    }

    /**
     * Pausa el juego
     */
    pause() {
        this.isPlaying = false;
        console.log('⏸️ Juego pausado');
    }

    /**
     * Reanuda el juego
     */
    resume() {
        if (!this.hasWon) {
            this.isPlaying = true;
            console.log('▶️ Juego reanudado');
        }
    }

    /**
     * Reinicia el nivel actual
     */
    async restartLevel() {
        if (this.currentLevelId && this.config.levelsConfig) {
            await this.startLevel(this.currentLevelId, this.config.levelsConfig[this.currentLevelId]);
        }
    }
}
