/**
 * DebugManager - Gestiona todas las funcionalidades de debug del juego
 * - Visualización de física (Cannon Debugger)
 * - Flechas de velocidad
 * - Meshes de debug para planos y paredes
 * - Se activa/desactiva desde el menú
 */

import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';

export class DebugManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.enabled = false;
        
        // Elementos de debug
        this.cannonDebugger = null;
        this.velocityArrow = null;
        this.groundMesh = null;
        this.wallMeshes = [];
    }

    /**
     * Activa el modo debug
     */
    enable() {
        if (this.enabled) return;
        
        // Activar Cannon Debugger para visualizar física
        this.cannonDebugger = new CannonDebugger(this.scene, this.world, {
            color: 0x00ff00,
            scale: 1.0
        });
        
        // Crear flecha para visualizar velocidad de la primera pelota
        this.velocityArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            1,
            0xff00ff, // Magenta
            0.5,
            0.3
        );
        this.scene.add(this.velocityArrow);
        
        this.enabled = true;
        console.log('🐛 Modo DEBUG activado');
        console.log('   ✓ Cannon Debugger: Verde');
        console.log('   ✓ Flecha de velocidad: Magenta');
    }

    /**
     * Desactiva el modo debug
     */
    disable() {
        if (!this.enabled) return;
        
        // Remover flecha de velocidad
        if (this.velocityArrow) {
            this.scene.remove(this.velocityArrow);
            this.velocityArrow = null;
        }
        
        // Remover meshes de debug de paredes
        this.wallMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.wallMeshes = [];
        
        // Remover mesh de debug del piso
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh = null;
        }
        
        // Nota: CannonDebugger no tiene un método destroy limpio,
        // pero dejará de actualizarse
        this.cannonDebugger = null;
        
        this.enabled = false;
        console.log('🐛 Modo DEBUG desactivado');
    }

    /**
     * Alterna el estado del debug
     * @param {boolean} enabled - True para activar, false para desactivar
     */
    toggle(enabled) {
        if (enabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    /**
     * Actualiza las visualizaciones de debug en cada frame
     * @param {Array} balls - Array de pelotas del nivel actual
     */
    update(balls) {
        if (!this.enabled) return;
        
        // Actualizar Cannon Debugger
        if (this.cannonDebugger) {
            this.cannonDebugger.update();
        }
        
        // Actualizar flecha de velocidad (solo para la primera pelota)
        if (this.velocityArrow && balls && balls.length > 0) {
            const ball = balls[0];
            const velocity = ball.body.velocity;
            const speed = velocity.length();
            
            if (speed > 0.01) {
                // Posición de la flecha (desde el centro de la pelota)
                this.velocityArrow.position.copy(ball.mesh.position);
                
                // Dirección normalizada de la velocidad
                const direction = new THREE.Vector3(
                    velocity.x, 
                    velocity.y, 
                    velocity.z
                ).normalize();
                this.velocityArrow.setDirection(direction);
                
                // Longitud amplificada proporcional a la velocidad
                const arrowLength = Math.min(speed * 3, 30);
                this.velocityArrow.setLength(
                    arrowLength, 
                    arrowLength * 0.25, 
                    arrowLength * 0.2
                );
                
                this.velocityArrow.visible = true;
            } else {
                // Ocultar flecha cuando la velocidad es muy baja
                this.velocityArrow.visible = false;
            }
        }
    }

    /**
     * Visualiza el pivote (punto de rotación) del laberinto
     * Muestra ejes XYZ, una esfera en el centro, y el BoundingBox
     * NOTA: maze.mesh ahora es un THREE.Group, el modelo real es su hijo
     * @param {Object} maze - Objeto Maze con mesh (Group) y body
     */
    visualizeMazePivot(maze) {
        console.log('🎯 visualizeMazePivot llamado:', {
            enabled: this.enabled,
            maze: !!maze,
            mesh: maze ? !!maze.mesh : false
        });
        
        if (!this.enabled || !maze || !maze.mesh) {
            console.warn('⚠️ No se puede visualizar pivote:', {
                enabled: this.enabled,
                maze: !!maze,
                mesh: maze ? !!maze.mesh : false
            });
            return;
        }
        
        // El mesh es un Group, el modelo real es su primer hijo
        const pivotGroup = maze.mesh;
        const actualMesh = pivotGroup.children[0];
        
        // 1. AxesHelper en el pivote del Group (debe estar en el centro x/z, base y)
        const axesHelper = new THREE.AxesHelper(10);
        pivotGroup.add(axesHelper);
        
        // 2. Esfera MAGENTA en el pivote (punto de rotación = posición del Group)
        const pivotGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const pivotMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff,  // Magenta
            wireframe: true 
        });
        const pivotSphere = new THREE.Mesh(pivotGeometry, pivotMaterial);
        // Posición (0,0,0) local = pivote del Group
        pivotGroup.add(pivotSphere);
        
        // 3. BoundingBox del mesh hijo (modelo real)
        actualMesh.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(actualMesh);
        const boxHelper = new THREE.Box3Helper(box, 0xffff00); // Amarillo
        this.scene.add(boxHelper);
        
        // 4. Centro geométrico del mesh hijo
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // 5. Esfera CYAN en el centro geométrico del modelo (en espacio world)
        const centerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
        );
        centerSphere.position.copy(center);
        this.scene.add(centerSphere);
        
        // 6. Línea desde el pivote del Group hasta el centro geométrico
        const pivotWorldPos = new THREE.Vector3();
        pivotGroup.getWorldPosition(pivotWorldPos);
        
        const points = [pivotWorldPos, center];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,  // Cyan
            linewidth: 2 
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        
        console.log('🎯 Visualización de pivote activada:');
        console.log('   🔴 Ejes XYZ en el pivote (rojo=X, verde=Y, azul=Z)');
        console.log('   🟣 Esfera magenta = Pivote del Group (punto de rotación)');
        console.log('   🟡 Box amarillo = BoundingBox del modelo hijo');
        console.log('   🔵 Esfera cyan = Centro geométrico completo');
        console.log('   📏 Línea cyan = Diferencia entre pivote y centro');
        console.log('   � Pivote en mundo:', pivotWorldPos);
        console.log('   📍 Centro geométrico:', center);
        console.log('   📐 Distancia:', pivotWorldPos.distanceTo(center).toFixed(2), 'unidades');
    }

    /**
     * Crea visualización debug del piso de colisión
     * @param {CANNON.Body} groundBody - Cuerpo físico del piso
     * @param {number} size - Tamaño del plano (debe ser al menos 2 * wallDistance)
     */
    createGroundVisualization(groundBody, size = 200) {
        if (!this.enabled || this.groundMesh) return;
        
        const planeGeometry = new THREE.PlaneGeometry(size, size);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.groundMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.copy(groundBody.position);
        this.scene.add(this.groundMesh);
        
        console.log(`👁️ Plano visual de debug creado (verde transparente) - Tamaño: ${size}x${size}`);
    }

    /**
     * Crea visualizaciones debug de las paredes
     * @param {Array} walls - Array de cuerpos físicos de las paredes
     * @param {number} wallDistance - Distancia de las paredes desde el centro
     * @param {number} wallHeight - Altura de las paredes
     */
    createWallVisualizations(walls, wallDistance, wallHeight) {
        if (!this.enabled) return;
        
        // Limpiar visualizaciones anteriores
        this.wallMeshes.forEach(mesh => this.scene.remove(mesh));
        this.wallMeshes = [];
        
        const planeWidth = wallDistance * 2;
        const wallGeometry = new THREE.PlaneGeometry(planeWidth, wallHeight);
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        walls.forEach((wall, index) => {
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.copy(wall.position);
            wallMesh.quaternion.copy(wall.quaternion);
            this.scene.add(wallMesh);
            this.wallMeshes.push(wallMesh);
        });
        
        console.log(`👁️ ${walls.length} paredes visuales de debug creadas (rojo transparente) - Tamaño: ${planeWidth}x${wallHeight}`);
    }

    /**
     * Actualiza las visualizaciones de paredes (para sincronizar con rotación)
     * @param {Array} walls - Array de cuerpos físicos de las paredes
     */
    updateWallVisualizations(walls) {
        if (!this.enabled || this.wallMeshes.length === 0) return;
        
        walls.forEach((wall, index) => {
            if (this.wallMeshes[index]) {
                this.wallMeshes[index].position.copy(wall.position);
                this.wallMeshes[index].quaternion.copy(wall.quaternion);
            }
        });
    }

    /**
     * Limpia todas las visualizaciones de debug
     */
    clear() {
        if (this.velocityArrow) {
            this.scene.remove(this.velocityArrow);
            this.velocityArrow = null;
        }
        
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh = null;
        }
        
        this.wallMeshes.forEach(mesh => this.scene.remove(mesh));
        this.wallMeshes = [];
    }
}
