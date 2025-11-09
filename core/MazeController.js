/**
 * MazeController - Controla la rotación del laberinto y sincroniza todos los elementos
 * - Captura input del mouse y giroscopio
 * - Aplica rotación al laberinto
 * - Sincroniza piso, paredes y zonas con la rotación del laberinto
 * - Funciona de forma genérica con cualquier nivel
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DeviceOrientationController } from '../utils/deviceOrientation.js';

export class MazeController {
    constructor(maxTilt, mouseSensitivity) {
        this.maxTilt = maxTilt;
        this.mouseSensitivity = mouseSensitivity;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Control de orientación de dispositivo (giroscopio)
        this.deviceController = new DeviceOrientationController();
        this.useGyroscope = false; // Por defecto desactivado
        
        this.setupMouseControl();
    }

    /**
     * Configura el control del mouse para capturar movimientos
     */
    setupMouseControl() {
        window.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    /**
     * Actualiza la rotación del laberinto y sincroniza todos los elementos
     * @param {LevelManager} levelManager - Manager del nivel actual
     */
    update(levelManager) {
        if (!levelManager.maze || !levelManager.currentLevel) return;
        
        let tiltX, tiltZ;
        
        // Usar giroscopio o mouse según configuración
        if (this.useGyroscope && this.deviceController.enabled) {
            // Usar valores del giroscopio
            const gyroTilt = this.deviceController.getTilt();
            tiltX = gyroTilt.tiltX * this.maxTilt;
            tiltZ = -gyroTilt.tiltZ * this.maxTilt;
        } else {
            // Usar valores del mouse (comportamiento original)
            tiltX = -this.mouseY * this.maxTilt;
            tiltZ = -this.mouseX * this.maxTilt;
        }
        
        // Aplicar rotación al laberinto
        levelManager.maze.setRotation(tiltX, 0, tiltZ);
        
        // Sincronizar todos los elementos con la rotación del laberinto
        this.syncGround(levelManager);
        this.syncWalls(levelManager);
        this.syncZones(levelManager);
    }

    /**
     * Sincroniza el piso de colisión con la rotación del laberinto
     * El piso permanece FIJO en el mundo (0,0,0), solo rota con el laberinto
     * @param {LevelManager} levelManager - Manager del nivel actual
     */
    syncGround(levelManager) {
        if (!levelManager.ground || !levelManager.maze.mesh) return;
        
        const groundOffsetY = levelManager.currentLevel.bounds.groundOffsetY;
        
        // El piso permanece FIJO en (0,0,0) del mundo, NO sigue al laberinto
        levelManager.ground.position.set(0, groundOffsetY, 0);
        
        // Copiar solo la rotación del laberinto
        const mazeQuat = new CANNON.Quaternion();
        mazeQuat.copy(levelManager.maze.body.quaternion);
        
        const planeOffset = new CANNON.Quaternion();
        planeOffset.setFromEuler(-Math.PI / 2, 0, 0);
        
        levelManager.ground.quaternion.copy(mazeQuat.mult(planeOffset));
        
        // Actualizar visualización debug si existe
        if (levelManager.debugManager && levelManager.debugManager.groundMesh) {
            levelManager.debugManager.groundMesh.position.copy(levelManager.ground.position);
            levelManager.debugManager.groundMesh.quaternion.copy(levelManager.ground.quaternion);
        }
    }

    /**
     * Sincroniza las paredes de contención con la rotación del laberinto
     * @param {LevelManager} levelManager - Manager del nivel actual
     */
    syncWalls(levelManager) {
        if (levelManager.walls.length === 0 || !levelManager.maze.mesh) return;
        
        const wallDistance = levelManager.currentLevel.bounds.wallDistance;
        const groundOffsetY = levelManager.currentLevel.bounds.groundOffsetY;
        
        // Posiciones originales de las paredes (relativas al centro)
        const wallOriginalPositions = [
            { x: 0, y: 0, z: -wallDistance }, // Norte
            { x: 0, y: 0, z: wallDistance },  // Sur
            { x: wallDistance, y: 0, z: 0 },  // Este
            { x: -wallDistance, y: 0, z: 0 }  // Oeste
        ];
        
        levelManager.walls.forEach((wall, index) => {
            // Crear vector de posición original FIJO en el mundo
            const originalPos = new THREE.Vector3(
                wallOriginalPositions[index].x,
                wallOriginalPositions[index].y + groundOffsetY,
                wallOriginalPositions[index].z
            );
            
            // Aplicar solo la rotación del laberinto a la posición
            // Las paredes permanecen centradas en (0,0,0), NO siguen al laberinto
            originalPos.applyQuaternion(levelManager.maze.body.quaternion);
            
            // Actualizar posición de la pared (sin añadir posición del laberinto)
            wall.position.copy(originalPos);
            
            // Combinar la rotación del laberinto con la rotación original de la pared
            const mazeQuat = new CANNON.Quaternion();
            mazeQuat.copy(levelManager.maze.mesh.quaternion);
            
            wall.quaternion.copy(mazeQuat.mult(levelManager.wallOriginalQuaternions[index]));
            
            // Actualizar visualización debug si existe
            if (levelManager.debugManager && levelManager.debugManager.wallMeshes[index]) {
                levelManager.debugManager.wallMeshes[index].position.copy(wall.position);
                levelManager.debugManager.wallMeshes[index].quaternion.copy(wall.quaternion);
            }
        });
    }

    /**
     * Sincroniza las zonas de objetivo con la rotación del laberinto
     * @param {LevelManager} levelManager - Manager del nivel actual
     */
    syncZones(levelManager) {
        if (levelManager.zones.length === 0 || !levelManager.maze.mesh) return;
        
        levelManager.zones.forEach((zone, index) => {
            // Crear vector de posición original FIJO en el mundo
            const originalPos = new THREE.Vector3(
                levelManager.zoneOriginalPositions[index].x,
                levelManager.zoneOriginalPositions[index].y,
                levelManager.zoneOriginalPositions[index].z
            );
            
            // Aplicar solo la rotación del laberinto a la posición
            // Las zonas permanecen centradas en (0,0,0), NO siguen al laberinto
            originalPos.applyQuaternion(levelManager.maze.body.quaternion);
            
            // Actualizar posición de la zona (visual y física, sin añadir posición del laberinto)
            zone.mesh.position.copy(originalPos);
            zone.body.position.copy(originalPos);
            
            // Aplicar la rotación del laberinto a la zona
            zone.mesh.quaternion.copy(levelManager.maze.mesh.quaternion);
            zone.body.quaternion.copy(levelManager.maze.mesh.quaternion);
        });
    }

    /**
     * Resetea la posición del mouse (útil al cambiar de nivel o pausar)
     */
    resetMousePosition() {
        this.mouseX = 0;
        this.mouseY = 0;
    }

    /**
     * Activa el control por giroscopio
     * @returns {Promise<boolean>} True si se activó correctamente
     */
    async enableGyroscope() {
        if (!this.deviceController.supported) {
            console.warn('⚠️ Giroscopio no soportado en este dispositivo');
            return false;
        }

        // Solicitar permisos si es necesario
        if (!this.deviceController.permissionGranted) {
            const granted = await this.deviceController.requestPermission();
            if (!granted) {
                console.error('❌ Permiso de giroscopio denegado');
                return false;
            }
        }

        // Activar el controlador de dispositivo
        const success = this.deviceController.enable();
        if (success) {
            this.useGyroscope = true;
            console.log('🎮 Modo giroscopio ACTIVADO');
        }
        
        return success;
    }

    /**
     * Desactiva el control por giroscopio
     */
    disableGyroscope() {
        this.deviceController.disable();
        this.useGyroscope = false;
        console.log('🎮 Modo giroscopio DESACTIVADO - usando mouse');
    }

    /**
     * Alterna entre modo giroscopio y mouse
     * @returns {Promise<boolean>} True si el giroscopio está activo después del toggle
     */
    async toggleGyroscope() {
        if (this.useGyroscope) {
            this.disableGyroscope();
            return false;
        } else {
            const success = await this.enableGyroscope();
            return success;
        }
    }

    /**
     * Calibra la posición neutral del giroscopio
     */
    calibrateGyroscope() {
        this.deviceController.calibrate();
    }

    /**
     * Ajusta la sensibilidad del giroscopio
     * @param {number} value - Nuevo valor de sensibilidad
     */
    setGyroscopeSensitivity(value) {
        this.deviceController.setSensitivity(value);
    }

    /**
     * Verifica si el giroscopio está activo
     * @returns {boolean}
     */
    isGyroscopeActive() {
        return this.useGyroscope && this.deviceController.enabled;
    }

    /**
     * Obtiene el estado del controlador de giroscopio
     * @returns {Object}
     */
    getGyroscopeStatus() {
        return this.deviceController.getStatus();
    }
}
