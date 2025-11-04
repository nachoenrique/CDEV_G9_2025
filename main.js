import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Maze } from './maze.js';

// Objeto para almacenar todas las variables globales
const App = {
    // Configuración inicial
    scene: null,
    camera: null,
    renderer: null,
    world: null,
    mazeMaterial: null,
    sphereMaterial: null,
    DEBUG_PHYSICS: false, 
    cannonDebugger: null,
    velocityArrow: null,

    // Laberinto
    maze: null,

    // Piso de colisión
    groundBody: null,
    groundMesh: null, // Para visualización en debug
    groundOffsetY:3, // Offset en Y para ajustar la altura del plano sobre la base del laberinto

    // Paredes de contención
    walls: [], // Array para almacenar los cuerpos físicos de las paredes
    wallMeshes: [], // Array para las visualizaciones debug
    wallOriginalQuaternions: [], // Quaternions originales de cada pared
    wallDistance: 19, // Distancia desde el centro hasta cada pared
    wallHeight: 10, // Altura de las paredes
    wallThickness: 1, // Grosor de las paredes

    // Esferas (array para múltiples pelotas)
    spheres: [], // Array de objetos { mesh, body, color }
    
    // Configuración de pelotas
    ballsConfig: [
        { position: { x: 5, y: 20, z: 5 }, color: 0xff0000, radius: 0.5 },      // Roja
        { position: { x: -5, y: 20, z: 5 }, color: 0x00ff00, radius: 0.5 },     // Verde
        { position: { x: 5, y: 20, z: -5 }, color: 0x0000ff, radius: 0.5 },     // Azul
        { position: { x: -5, y: 20, z: -5 }, color: 0xffff00, radius: 0.5 }       // Amarilla
    ],

    // Zonas de objetivo (rojas que cambian a verde)
    zonesConfig: [
        { position: { x: 12, y: 3.5, z: 12 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 1: Noreste
        { position: { x: 12, y: 3.5, z: -12 }, size: { width: 3, height: 1, depth: 3 } },  // Zona 2: Sureste
        { position: { x: -12, y: 3.5, z: -12 }, size: { width: 3, height: 1, depth: 3 } }, // Zona 3: Suroeste
        { position: { x: -12, y: 3.5, z: 12 }, size: { width: 3, height: 1, depth: 3 } }   // Zona 4: Noroeste
    ],
    zones: [], // Array de objetos { mesh, body, isGreen }
    zoneOriginalPositions: [], // Posiciones originales de las zonas (para sincronización con laberinto)
    allZonesGreen: false, // Variable para condición de victoria

    // Control de Mouse
    mouseX: 0,
    mouseY: 0,
    maxTilt: Math.PI / 12,

    // Loop de animación
    timeStep: 1 / 60,
    maxSubSteps: 20
};

function setupConfiguracionInicial() {
    // Escena, cámara y renderizador
    App.scene = new THREE.Scene();
    App.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    App.renderer = new THREE.WebGLRenderer({ antialias: true });
    App.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(App.renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    App.scene.add(light);
    App.scene.add(new THREE.AmbientLight(0x404040));

    // Mundo de física con configuración para Trimesh
    App.world = new CANNON.World();
    App.world.gravity.set(0, -30, 0); 
    App.world.broadphase = new CANNON.NaiveBroadphase(); 
    App.world.solver.iterations = 20; 
    App.world.allowSleep = false; 

    // Materiales de contacto SIN fricción ni restitución
    App.mazeMaterial = new CANNON.Material('maze');
    App.sphereMaterial = new CANNON.Material('sphere');
    const contactMaterial = new CANNON.ContactMaterial(App.mazeMaterial, App.sphereMaterial, {
        friction: 0.0, 
        restitution: 0.0 
    }); 
    App.world.addContactMaterial(contactMaterial); 
}

function setupLaberinto() {
    // Cargar el laberinto con física automática
    App.maze = new Maze(App.scene, App.world);
    App.maze.load('/models/maze.glb', {
        scale: 0.5,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
    }).then(() => {
        // Asignar material al laberinto una vez cargado
        App.maze.body.material = App.mazeMaterial;
        if (App.maze.ceilingBody) {
            App.maze.ceilingBody.material = App.mazeMaterial;
            console.log('🏗️ Techo invisible recibió el material del laberinto');
        }
        console.log('🎯 Laberinto listo con', App.maze.body.shapes.length, 'formas físicas');
    });
}

function setupPisoColision() {
    // Crear un plano de colisión infinito para evitar que la esfera atraviese el piso
    const groundShape = new CANNON.Plane();
    App.groundBody = new CANNON.Body({ 
        mass: 0, // Masa 0 = objeto estático
        material: App.mazeMaterial
    });
    App.groundBody.addShape(groundShape);
    
    // Rotar el plano para que mire hacia arriba (por defecto mira en Z)
    App.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    
    // Posicionar ligeramente por debajo del nivel 0 del laberinto
    App.groundBody.position.set(0, 0, 0);
    
    App.world.addBody(App.groundBody);
    console.log('🟢 Piso de colisión creado en Y =', App.groundBody.position.y);
    
    // Opcional: Crear visualización del plano para debug
    if (App.DEBUG_PHYSICS) {
        const planeSize = 100; // Tamaño grande para cubrir toda el área
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        App.groundMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        App.groundMesh.rotation.x = -Math.PI / 2;
        App.groundMesh.position.copy(App.groundBody.position);
        App.scene.add(App.groundMesh);
        console.log('👁️ Plano visual de debug agregado (verde transparente)');
    }
}

function setupParedes() {
    // Configuración de las 4 paredes usando planos (Norte, Sur, Este, Oeste)
    // Los planos de Cannon.js por defecto miran en el eje Z negativo
    const wallConfigs = [
        { name: 'Norte', position: { x: 0, y: 0, z: -App.wallDistance }, rotation: { x: 0, y: 0, z: 0 } },           // Mira hacia +Z
        { name: 'Sur', position: { x: 0, y: 0, z: App.wallDistance }, rotation: { x: 0, y: Math.PI, z: 0 } },       // Mira hacia -Z (paralelo a Norte)
        { name: 'Este', position: { x: App.wallDistance, y: 0, z: 0 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } }, // Mira hacia -X (perpendicular)
        { name: 'Oeste', position: { x: -App.wallDistance, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } } // Mira hacia +X (paralelo a Este)
    ];

    wallConfigs.forEach(config => {
        // Crear plano físico (infinito)
        const wallShape = new CANNON.Plane();
        
        const wallBody = new CANNON.Body({
            mass: 0, // Estático
            material: App.mazeMaterial
        });
        wallBody.addShape(wallShape);
        wallBody.position.set(config.position.x, config.position.y, config.position.z);
        wallBody.quaternion.setFromEuler(config.rotation.x, config.rotation.y, config.rotation.z);
        
        App.world.addBody(wallBody);
        App.walls.push(wallBody);
        
        // Guardar el quaternion original de la pared para mantener su orientación relativa
        const originalQuat = new CANNON.Quaternion();
        originalQuat.copy(wallBody.quaternion);
        App.wallOriginalQuaternions.push(originalQuat);
        
        // Crear visualización debug con planos de Three.js
        if (App.DEBUG_PHYSICS) {
            const planeSize = App.wallDistance * 2; // Tamaño del plano visual
            const wallGeometry = new THREE.PlaneGeometry(planeSize, App.wallHeight);
            const wallMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.copy(wallBody.position);
            wallMesh.quaternion.copy(wallBody.quaternion);
            App.scene.add(wallMesh);
            App.wallMeshes.push(wallMesh);
        }
        
        console.log(`🧱 Pared ${config.name} creada en posición:`, config.position);
    });
    
    console.log(`✅ ${App.walls.length} paredes de contención creadas (planos infinitos)`);
}

function setupEsfera() {
    // Crear múltiples esferas según la configuración
    App.ballsConfig.forEach((config, index) => {
        // Esfera (visual)
        const sphereGeometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const sphereMesh3Material = new THREE.MeshStandardMaterial({ color: config.color });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMesh3Material);
        sphereMesh.position.set(config.position.x, config.position.y, config.position.z);
        App.scene.add(sphereMesh);

        // Esfera (física)
        const sphereShape = new CANNON.Sphere(config.radius);
        const sphereBody = new CANNON.Body({ 
            mass: 0.5, 
            material: App.sphereMaterial,
            linearDamping: 0.0, 
            angularDamping: 0.0 
        });
        sphereBody.addShape(sphereShape);
        sphereBody.position.set(config.position.x, config.position.y, config.position.z);

        // CCD (Continuous Collision Detection) CRÍTICO
        sphereBody.ccdSpeedThreshold = 0.001; 
        sphereBody.ccdIterations = 30; 

        App.world.addBody(sphereBody);
        
        // Guardar en el array de esferas
        App.spheres.push({
            mesh: sphereMesh,
            body: sphereBody,
            color: config.color
        });
        
        console.log(`⚽ Pelota ${index + 1} creada - Color: 0x${config.color.toString(16).padStart(6, '0')}, Posición: (${config.position.x}, ${config.position.y}, ${config.position.z})`);
    });
    
    console.log(`✅ ${App.spheres.length} pelotas creadas`);
}

function setupZonasObjetivo() {
    // Crear las 4 zonas de objetivo según la configuración
    App.zonesConfig.forEach((config, index) => {
        // Crear caja visual (roja inicialmente)
        const zoneGeometry = new THREE.BoxGeometry(
            config.size.width,
            config.size.height,
            config.size.depth
        );
        const zoneMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Rojo inicial
            transparent: true,
            opacity: 0.6
        });
        const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
        zoneMesh.position.set(config.position.x, config.position.y, config.position.z);
        App.scene.add(zoneMesh);

        // Crear body físico como sensor (sin colisión física)
        const zoneShape = new CANNON.Box(new CANNON.Vec3(
            config.size.width / 2,
            config.size.height / 2,
            config.size.depth / 2
        ));
        const zoneBody = new CANNON.Body({
            mass: 0, // Estático
            isTrigger: true, // Sensor
            collisionResponse: false // No afecta físicamente a otros objetos
        });
        zoneBody.addShape(zoneShape);
        zoneBody.position.set(config.position.x, config.position.y, config.position.z);
        App.world.addBody(zoneBody);

        // Guardar zona con su estado
        App.zones.push({
            mesh: zoneMesh,
            body: zoneBody,
            isGreen: false,
            material: zoneMaterial
        });

        // Guardar la posición original para sincronización con el laberinto
        App.zoneOriginalPositions.push({
            x: config.position.x,
            y: config.position.y,
            z: config.position.z
        });

        console.log(`🎯 Zona ${index + 1} creada en posición: (${config.position.x}, ${config.position.y}, ${config.position.z})`);
    });

    console.log(`✅ ${App.zones.length} zonas de objetivo creadas`);
}

function setupCamaraYControl() {
    // Posición de la cámara
    App.camera.position.set(0, 50, 0);
    App.camera.lookAt(0, 0, 0);

    // Seguimiento del mouse
    window.addEventListener('mousemove', (event) => {
        App.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        App.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Redimensionar ventana
    window.addEventListener('resize', () => {
        App.camera.aspect = window.innerWidth / window.innerHeight;
        App.camera.updateProjectionMatrix();
        App.renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function setupDebug() {
    if (App.DEBUG_PHYSICS) {
        App.cannonDebugger = new CannonDebugger(App.scene, App.world, {
            color: 0x00ff00,
            scale: 1.0
        });
        
        // Crear flecha para visualizar el vector de velocidad
        App.velocityArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 0), 
            new THREE.Vector3(0, 0, 0), 
            1, 
            0xff00ff, 
            0.5, 
            0.3 
        );
        App.scene.add(App.velocityArrow);
        
        console.log('🐛 Debug de física activado');
        console.log('➡️ Flecha de velocidad: Magenta');
    }
}

/**
 * Actualiza la rotación del laberinto en base al mouse.
 */
function updateInclinacionLaberinto() {
    const tiltX = -App.mouseY * App.maxTilt;
    const tiltZ = -App.mouseX * App.maxTilt;
    App.maze.setRotation(tiltX, 0, tiltZ);
    
    // Sincronizar el piso de colisión con el laberinto (posición y rotación)
    if (App.groundBody && App.maze.mesh) {
        // Copiar la posición del laberinto y aplicar offset en Y
        App.groundBody.position.copy(App.maze.mesh.position);
        App.groundBody.position.y += App.groundOffsetY; // Ajuste vertical
        
        // Copiar el quaternion del laberinto y aplicar el offset del plano
        const mazeQuat = new CANNON.Quaternion();
        mazeQuat.copy(App.maze.mesh.quaternion);
        
        // Quaternion para rotar -90° en X (plano horizontal)
        const planeOffset = new CANNON.Quaternion();
        planeOffset.setFromEuler(-Math.PI / 2, 0, 0);
        
        // Combinar ambas rotaciones
        App.groundBody.quaternion.copy(mazeQuat.mult(planeOffset));
        
        // Actualizar visualización debug si existe
        if (App.groundMesh) {
            App.groundMesh.position.copy(App.groundBody.position);
            App.groundMesh.quaternion.copy(App.groundBody.quaternion);
        }
    }
    
    // Sincronizar las paredes con el laberinto
    if (App.walls.length > 0 && App.maze.mesh) {
        // Configuración de las posiciones originales de las paredes
        const wallOriginalPositions = [
            { x: 0, y: 0, z: -App.wallDistance }, // Norte
            { x: 0, y: 0, z: App.wallDistance },  // Sur
            { x: App.wallDistance, y: 0, z: 0 },  // Este
            { x: -App.wallDistance, y: 0, z: 0 }  // Oeste
        ];
        
        App.walls.forEach((wall, index) => {
            // Crear vector de posición original
            const originalPos = new THREE.Vector3(
                wallOriginalPositions[index].x,
                wallOriginalPositions[index].y + App.groundOffsetY,
                wallOriginalPositions[index].z
            );
            
            // Aplicar la rotación del laberinto a la posición
            originalPos.applyQuaternion(App.maze.mesh.quaternion);
            
            // Aplicar la posición del laberinto
            originalPos.add(App.maze.mesh.position);
            
            // Actualizar posición de la pared
            wall.position.copy(originalPos);
            
            // Combinar la rotación del laberinto con la rotación original de la pared
            const mazeQuat = new CANNON.Quaternion();
            mazeQuat.copy(App.maze.mesh.quaternion);
            
            // Multiplicar el quaternion del laberinto con el quaternion original de la pared
            wall.quaternion.copy(mazeQuat.mult(App.wallOriginalQuaternions[index]));
            
            // Actualizar visualización debug si existe
            if (App.wallMeshes[index]) {
                App.wallMeshes[index].position.copy(wall.position);
                App.wallMeshes[index].quaternion.copy(wall.quaternion);
            }
        });
    }

    // Sincronizar las zonas de objetivo con el laberinto
    if (App.zones.length > 0 && App.maze.mesh) {
        App.zones.forEach((zone, index) => {
            // Crear vector de posición original
            const originalPos = new THREE.Vector3(
                App.zoneOriginalPositions[index].x,
                App.zoneOriginalPositions[index].y,
                App.zoneOriginalPositions[index].z
            );
            
            // Aplicar la rotación del laberinto a la posición
            originalPos.applyQuaternion(App.maze.mesh.quaternion);
            
            // Aplicar la posición del laberinto
            originalPos.add(App.maze.mesh.position);
            
            // Actualizar posición de la zona (visual y física)
            zone.mesh.position.copy(originalPos);
            zone.body.position.copy(originalPos);
            
            // Aplicar la rotación del laberinto a la zona
            zone.mesh.quaternion.copy(App.maze.mesh.quaternion);
            zone.body.quaternion.copy(App.maze.mesh.quaternion);
        });
    }
}

/**
 * Realiza la simulación de la física (World.step).
 */
function updateSimulacionFisica() {
    // Simulación con múltiples substeps para evitar atravesamientos
    App.world.step(App.timeStep, App.timeStep, App.maxSubSteps);
}

/**
 * Sincroniza las mallas visuales con los cuerpos de la física.
 */
function updateSincronizacion() {
    // Sincronizar todas las esferas
    App.spheres.forEach((sphere, index) => {
        sphere.mesh.position.copy(sphere.body.position);
        sphere.mesh.quaternion.copy(sphere.body.quaternion);
    });
}

/**
 * Actualiza el estado de las zonas de objetivo.
 * Verifica colisiones con las pelotas y cambia color a verde.
 * Cuando todas las zonas son verdes, activa la condición de victoria.
 */
function updateZonasObjetivo() {
    // Verificar cada zona
    App.zones.forEach((zone, zoneIndex) => {
        // Asumir que no hay colisión inicialmente
        let hasCollision = false;

        // Verificar colisión con cada pelota usando AABB overlap
        App.spheres.forEach((sphere) => {
            // Calcular los límites de la zona (AABB)
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

            // Calcular los límites de la esfera
            const sphereRadius = sphere.body.shapes[0].radius;
            const sphereMin = {
                x: sphere.body.position.x - sphereRadius,
                y: sphere.body.position.y - sphereRadius,
                z: sphere.body.position.z - sphereRadius
            };
            const sphereMax = {
                x: sphere.body.position.x + sphereRadius,
                y: sphere.body.position.y + sphereRadius,
                z: sphere.body.position.z + sphereRadius
            };

            // Verificar overlap en los 3 ejes
            const overlapX = sphereMax.x >= zoneMin.x && sphereMin.x <= zoneMax.x;
            const overlapY = sphereMax.y >= zoneMin.y && sphereMin.y <= zoneMax.y;
            const overlapZ = sphereMax.z >= zoneMin.z && sphereMin.z <= zoneMax.z;

            // Si hay overlap en los 3 ejes, hay colisión
            if (overlapX && overlapY && overlapZ) {
                hasCollision = true;
            }
        });

        // Actualizar el estado de la zona basado en la colisión
        if (hasCollision && !zone.isGreen) {
            // Cambiar a verde
            zone.material.color.setHex(0x00ff00);
            zone.isGreen = true;
            console.log(`✅ Zona ${zoneIndex + 1} activada (verde)`);
        } else if (!hasCollision && zone.isGreen) {
            // Cambiar a rojo
            zone.material.color.setHex(0xff0000);
            zone.isGreen = false;
            console.log(`🔴 Zona ${zoneIndex + 1} desactivada (rojo)`);
        }
    });

    // Verificar si todas las zonas son verdes
    const allGreen = App.zones.every(zone => zone.isGreen);
    
    // Actualizar variable de condición de victoria
    if (allGreen && !App.allZonesGreen) {
        App.allZonesGreen = true;
        console.log('🎉 ¡TODAS LAS ZONAS ESTÁN VERDES! Condición de victoria activada.');
    } else if (!allGreen && App.allZonesGreen) {
        // Resetear condición de victoria si alguna zona vuelve a rojo
        App.allZonesGreen = false;
        console.log('⚠️ Condición de victoria desactivada (no todas las zonas están verdes)');
    }
}

/**
 * Actualiza el debug de física y la flecha de velocidad.
 */
function updateDebug() {
    // Actualizar debugger de física
    if (App.cannonDebugger) {
        App.cannonDebugger.update();
    }
    
    // Actualizar vector de velocidad (solo para la primera pelota)
    if (App.velocityArrow && App.spheres.length > 0) {
        const velocity = App.spheres[0].body.velocity;
        const speed = velocity.length();
        
        if (speed > 0.01) { 
            // Posición de la flecha (desde el centro de la esfera)
            App.velocityArrow.position.copy(App.spheres[0].mesh.position);
            
            // Dirección normalizada de la velocidad
            const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
            App.velocityArrow.setDirection(direction);
            
            // Longitud AMPLIFICADA proporcional a la velocidad
            const arrowLength = Math.min(speed * 3, 30); 
            App.velocityArrow.setLength(arrowLength, arrowLength * 0.25, arrowLength * 0.2);
            
            App.velocityArrow.visible = true;
        } else {
            App.velocityArrow.visible = false; 
        }
    }
}

/**
 * Realiza el renderizado de la escena.
 */
function updateRender() {
    App.renderer.render(App.scene, App.camera);
}

/**
 * Función principal de inicialización que llama a todos los setups.
 */
function init() {
    setupConfiguracionInicial();
    setupPisoColision(); // Piso de colisión para evitar que la esfera traspase
    setupParedes(); // Paredes de contención para evitar que la esfera salga volando
    setupLaberinto();
    setupEsfera();
    setupZonasObjetivo(); // Zonas de objetivo rojas que cambian a verde
    setupCamaraYControl();
    setupDebug(); 
    
    // Iniciar el loop de animación
    animate();
}

/**
 * Bucle de animación principal. Llama a los métodos de actualización.
 */
function animate() {
    requestAnimationFrame(animate);
    
    // 1. Lógica de control e inclinación
    if (App.maze) { // Asegurarse de que el laberinto esté cargado antes de inclinar
        updateInclinacionLaberinto();
    }
    
    // 2. Simulación de la física
    updateSimulacionFisica();

    // 3. Actualizar zonas de objetivo
    updateZonasObjetivo();

    // 4. Debug (si está activado)
    updateDebug();
    
    // 5. Sincronización visual
    updateSincronizacion();
    
    // 6. Renderizado
    updateRender();
}

// Llamada para iniciar la aplicación
init();