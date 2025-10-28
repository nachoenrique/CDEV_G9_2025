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

    // Esfera
    sphereMesh: null,
    sphereBody: null,

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

function setupEsfera() {
    // Esfera (visual)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMesh3Material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    App.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMesh3Material);
    App.sphereMesh.position.set(0, 20, 0);
    App.scene.add(App.sphereMesh);

    // Esfera (física)
    const sphereShape = new CANNON.Sphere(0.5);
    App.sphereBody = new CANNON.Body({ 
        mass: 0.5, 
        material: App.sphereMaterial,
        linearDamping: 0.0, 
        angularDamping: 0.0 
    });
    App.sphereBody.addShape(sphereShape);
    App.sphereBody.position.set(0, 20, 0);

    // CCD (Continuous Collision Detection) CRÍTICO
    App.sphereBody.ccdSpeedThreshold = 0.001; 
    App.sphereBody.ccdIterations = 30; 

    App.world.addBody(App.sphereBody);
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
    App.sphereMesh.position.copy(App.sphereBody.position);
    App.sphereMesh.quaternion.copy(App.sphereBody.quaternion);
    console.log('🔄 Sincronizando esfera: Posición', App.sphereBody.position, 'Rotación', App.sphereBody.quaternion);
}

/**
 * Actualiza el debug de física y la flecha de velocidad.
 */
function updateDebug() {
    // Actualizar debugger de física
    if (App.cannonDebugger) {
        App.cannonDebugger.update();
    }
    
    // Actualizar vector de velocidad
    if (App.velocityArrow) {
        const velocity = App.sphereBody.velocity;
        const speed = velocity.length();
        
        if (speed > 0.01) { 
            // Posición de la flecha (desde el centro de la esfera)
            App.velocityArrow.position.copy(App.sphereMesh.position);
            
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
    setupLaberinto();
    setupEsfera();
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

    // 3. Debug (si está activado)
    updateDebug();
    
    // 4. Sincronización visual
    updateSincronizacion();
    
    // 5. Renderizado
    updateRender();
}

// Llamada para iniciar la aplicación
init();