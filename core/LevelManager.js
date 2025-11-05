/**
 * LevelManager - Gestiona la carga, descarga y elementos de cada nivel
 * - Carga el laberinto específico del nivel
 * - Crea elementos físicos (piso, paredes, pelotas, zonas)
 * - Limpia recursos al cambiar de nivel
 */

import { Maze } from '../utils/maze.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class LevelManager {
    constructor(scene, world, materials, debugManager = null) {
        this.scene = scene;
        this.world = world;
        this.materials = materials;
        this.debugManager = debugManager;
        
        // Estado actual del nivel
        this.currentLevel = null;
        this.maze = null;
        this.balls = [];
        this.zones = [];
        this.walls = [];
        this.ground = null;
        
        // Referencias y posiciones originales para sincronización
        this.wallMeshes = [];
        this.groundMesh = null;
        this.zoneOriginalPositions = [];
        this.wallOriginalQuaternions = [];
    }

    /**
     * Carga un nivel completo con todos sus elementos
     * @param {Object} levelConfig - Configuración del nivel a cargar
     */
    async loadLevel(levelConfig) {
        // Limpiar nivel anterior si existe
        await this.unloadLevel();
        
        this.currentLevel = levelConfig;
        console.log(`🎮 Cargando ${levelConfig.name}...`);
        
        // 1. Cargar laberinto
        await this.loadMaze(levelConfig.maze);
        
        // 2. Crear elementos de física
        this.createGround(levelConfig.bounds);
        this.createWalls(levelConfig.bounds);
        
        // 3. Crear pelotas
        this.createBalls(levelConfig.balls);
        
        // 4. Crear zonas de objetivo
        this.createZones(levelConfig.zones);
        
        // 5. Crear visualizaciones de debug si está activado
        if (this.debugManager && this.debugManager.enabled) {
            const planeSize = levelConfig.bounds.wallDistance * 2.5; // Un poco más grande que las paredes
            this.debugManager.createGroundVisualization(this.ground, planeSize);
            this.debugManager.createWallVisualizations(
                this.walls, 
                levelConfig.bounds.wallDistance, 
                levelConfig.bounds.wallHeight
            );
        }
        
        console.log(`✅ ${levelConfig.name} cargado completamente`);
        console.log(`   📦 Pelotas: ${this.balls.length}`);
        console.log(`   🎯 Zonas: ${this.zones.length}`);
    }

    /**
     * Carga el modelo 3D del laberinto
     * @param {Object} mazeConfig - Configuración del laberinto
     */
    async loadMaze(mazeConfig) {
        this.maze = new Maze(this.scene, this.world);
        await this.maze.load(mazeConfig.model, mazeConfig);
        
        // Asignar material de física al laberinto
        this.maze.body.material = this.materials.maze;
        if (this.maze.ceilingBody) {
            this.maze.ceilingBody.material = this.materials.maze;
        }
        
        console.log('🏗️ Laberinto cargado con física');
    }

    /**
     * Crea el piso de colisión infinito
     * @param {Object} bounds - Configuración de límites del nivel
     */
    createGround(bounds) {
        const groundShape = new CANNON.Plane();
        this.ground = new CANNON.Body({ 
            mass: 0,
            material: this.materials.maze
        });
        this.ground.addShape(groundShape);
        this.ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.ground.position.set(0, 0, 0);
        this.world.addBody(this.ground);
        
        console.log('🟢 Piso de colisión creado');
    }

    /**
     * Crea las 4 paredes de contención (Norte, Sur, Este, Oeste)
     * @param {Object} bounds - Configuración de límites del nivel
     */
    createWalls(bounds) {
        const wallConfigs = [
            { name: 'Norte', position: { x: 0, y: 0, z: -bounds.wallDistance }, rotation: { x: 0, y: 0, z: 0 } },
            { name: 'Sur', position: { x: 0, y: 0, z: bounds.wallDistance }, rotation: { x: 0, y: Math.PI, z: 0 } },
            { name: 'Este', position: { x: bounds.wallDistance, y: 0, z: 0 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
            { name: 'Oeste', position: { x: -bounds.wallDistance, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } }
        ];

        wallConfigs.forEach(config => {
            const wallShape = new CANNON.Plane();
            const wallBody = new CANNON.Body({ 
                mass: 0, 
                material: this.materials.maze 
            });
            wallBody.addShape(wallShape);
            wallBody.position.set(config.position.x, config.position.y, config.position.z);
            wallBody.quaternion.setFromEuler(config.rotation.x, config.rotation.y, config.rotation.z);
            
            this.world.addBody(wallBody);
            this.walls.push(wallBody);
            
            // Guardar quaternion original para mantener orientación relativa
            const originalQuat = new CANNON.Quaternion();
            originalQuat.copy(wallBody.quaternion);
            this.wallOriginalQuaternions.push(originalQuat);
            
            console.log(`🧱 Pared ${config.name} creada`);
        });
    }

    /**
     * Crea las pelotas según la configuración del nivel
     * @param {Array} ballsConfig - Array de configuración de pelotas
     */
    createBalls(ballsConfig) {
        ballsConfig.forEach((config, index) => {
            // Crear mesh visual
            const sphereGeometry = new THREE.SphereGeometry(config.radius, 32, 32);
            const sphereMaterial = new THREE.MeshStandardMaterial({ color: config.color });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphereMesh.position.set(config.position.x, config.position.y, config.position.z);
            this.scene.add(sphereMesh);

            // Crear cuerpo físico
            const sphereShape = new CANNON.Sphere(config.radius);
            const sphereBody = new CANNON.Body({ 
                mass: 0.5,
                material: this.materials.ball,
                linearDamping: 0.0,
                angularDamping: 0.0
            });
            sphereBody.addShape(sphereShape);
            sphereBody.position.set(config.position.x, config.position.y, config.position.z);
            
            // CCD (Continuous Collision Detection) para evitar atravesamientos
            sphereBody.ccdSpeedThreshold = 0.001;
            sphereBody.ccdIterations = 30;

            this.world.addBody(sphereBody);
            
            this.balls.push({ 
                mesh: sphereMesh, 
                body: sphereBody, 
                color: config.color 
            });
            
            console.log(`⚽ Pelota ${index + 1} creada - Color: 0x${config.color.toString(16).padStart(6, '0')}`);
        });
    }

    /**
     * Crea las zonas de objetivo según la configuración del nivel
     * @param {Array} zonesConfig - Array de configuración de zonas
     */
    createZones(zonesConfig) {
        zonesConfig.forEach((config, index) => {
            // Crear mesh visual (rojo inicialmente)
            const zoneGeometry = new THREE.BoxGeometry(
                config.size.width,
                config.size.height,
                config.size.depth
            );
            const zoneMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, 
                transparent: true, 
                opacity: 0.6 
            });
            const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zoneMesh.position.set(config.position.x, config.position.y, config.position.z);
            this.scene.add(zoneMesh);

            // Crear cuerpo físico como sensor (trigger)
            const zoneShape = new CANNON.Box(new CANNON.Vec3(
                config.size.width / 2,
                config.size.height / 2,
                config.size.depth / 2
            ));
            const zoneBody = new CANNON.Body({ 
                mass: 0, 
                isTrigger: true, 
                collisionResponse: false 
            });
            zoneBody.addShape(zoneShape);
            zoneBody.position.set(config.position.x, config.position.y, config.position.z);
            this.world.addBody(zoneBody);

            this.zones.push({ 
                mesh: zoneMesh, 
                body: zoneBody, 
                isGreen: false, 
                material: zoneMaterial 
            });

            // Guardar posición original para sincronización con el laberinto
            this.zoneOriginalPositions.push({ 
                x: config.position.x, 
                y: config.position.y, 
                z: config.position.z 
            });
            
            console.log(`🎯 Zona ${index + 1} creada en (${config.position.x}, ${config.position.y}, ${config.position.z})`);
        });
    }

    /**
     * Limpia todos los recursos del nivel actual
     */
    async unloadLevel() {
        // Limpiar pelotas
        this.balls.forEach(ball => {
            this.scene.remove(ball.mesh);
            this.world.removeBody(ball.body);
        });
        
        // Limpiar zonas
        this.zones.forEach(zone => {
            this.scene.remove(zone.mesh);
            this.world.removeBody(zone.body);
        });
        
        // Limpiar paredes
        this.walls.forEach(wall => this.world.removeBody(wall));
        
        // Limpiar piso
        if (this.ground) {
            this.world.removeBody(this.ground);
        }
        
        // Limpiar laberinto
        if (this.maze && this.maze.mesh) {
            this.scene.remove(this.maze.mesh);
        }
        if (this.maze && this.maze.body) {
            this.world.removeBody(this.maze.body);
        }
        
        // Resetear arrays
        this.balls = [];
        this.zones = [];
        this.walls = [];
        this.wallOriginalQuaternions = [];
        this.zoneOriginalPositions = [];
        this.ground = null;
        this.maze = null;
        this.currentLevel = null;
        
        console.log('🧹 Nivel anterior limpiado');
    }
}
