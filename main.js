import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Maze } from './maze.js';

// #region Configuración inicial
// Debugger globals
const DEBUG_PHYSICS = true; // Cambiar a true para ver las formas físicas en verde
let cannonDebugger = null;
let velocityArrow = null;

// Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Mundo de física con configuración para Trimesh
const world = new CANNON.World();
world.gravity.set(0, -30, 0); // Gravedad de la Tierra en m/s²
world.broadphase = new CANNON.NaiveBroadphase(); // Broadphase más preciso
world.solver.iterations = 20; // Más iteraciones del solver
world.allowSleep = false; // Desactivar sleep para objetos críticos

// Materiales de contacto SIN fricción ni restitución
const mazeMaterial = new CANNON.Material('maze');
const sphereMaterial = new CANNON.Material('sphere');
const contactMaterial = new CANNON.ContactMaterial(mazeMaterial, sphereMaterial, {
  friction: 0.0,      // SIN fricción (deslizamiento perfecto)
  restitution: 0.0    // SIN rebote
});  
world.addContactMaterial(contactMaterial); 
// #endregion Configuración inicial

// #region Laberinto
// Cargar el laberinto con física automática
const maze = new Maze(scene, world);
maze.load('/models/maze.glb', {
  scale: 0.5,  // Escala aumentada a 2 (más grande)
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }
}).then(() => {
  // Asignar material al laberinto una vez cargado
  maze.body.material = mazeMaterial;
  // Si el laberinto creó un techo invisible, asignarle el mismo material
  if (maze.ceilingBody) {
    maze.ceilingBody.material = mazeMaterial;
    console.log('🏗️ Techo invisible recibió el material del laberinto');
  }
  console.log('🎯 Laberinto listo con', maze.body.shapes.length, 'formas físicas');
});
// #endregion Laberinto

// #region Esfera
// Esfera (visual)
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMesh3Material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMesh3Material);
sphereMesh.position.set(0, 20, 0);
scene.add(sphereMesh);

// Esfera (física)
const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({ 
  mass: 0.5, // Masa realista para una bola pequeña (500g)
  material: sphereMaterial,
  linearDamping: 0.0,  // Sin amortiguación lineal
  angularDamping: 0.0  // Sin amortiguación angular
});
sphereBody.addShape(sphereShape);
sphereBody.position.set(0, 20, 0);

// CCD (Continuous Collision Detection) CRÍTICO para Trimesh
sphereBody.ccdSpeedThreshold = 0.001; // Activa CCD desde velocidades muy bajas
sphereBody.ccdIterations = 30;        // Iteraciones aumentadas para Trimesh

world.addBody(sphereBody);
// #endregion Esfera

// #region Camara y control de mouse
// Posición de la cámara
camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

// Variables para el mouse
let mouseX = 0;
let mouseY = 0;
const maxTilt = Math.PI / 6; // Límite de inclinación: 30 grados

// Seguimiento del mouse
window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Loop de animación con parámetros ajustados para Trimesh
const timeStep = 1 / 60; // 60 FPS - timestep más pequeño
const maxSubSteps = 20;   // MÁS substeps para Trimesh (CRÍTICO)

// Redimensionar ventana
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// #endregion Camara y control de mouse

function animate() {
  requestAnimationFrame(animate);
  
  // Inclinar el laberinto según la posición del mouse
  const tiltX = -mouseY * maxTilt;
  const tiltZ = -mouseX * maxTilt;
  
  maze.setRotation(tiltX, 0, tiltZ);
  
  // Simulación con múltiples substeps para evitar atravesamientos
  world.step(timeStep, timeStep, maxSubSteps);

  // Debug de física (solo si está activado)
  // Actualizar debugger de física (solo si está activado)
  if (cannonDebugger) {
    cannonDebugger.update();
  }
  
  // Actualizar vector de velocidad (solo si está activado)
  if (velocityArrow) {
    const velocity = sphereBody.velocity;
    const speed = velocity.length();
    
    if (speed > 0.01) { // Solo mostrar si hay movimiento significativo
      // Posición de la flecha (desde el centro de la esfera)
      velocityArrow.position.copy(sphereMesh.position);
      
      // Dirección normalizada de la velocidad
      const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
      velocityArrow.setDirection(direction);
      
      // Longitud AMPLIFICADA proporcional a la velocidad
      const arrowLength = Math.min(speed * 3, 30); // Amplificado x6 y máximo 30 unidades
      velocityArrow.setLength(arrowLength, arrowLength * 0.25, arrowLength * 0.2);
      
      velocityArrow.visible = true;
    } else {
      velocityArrow.visible = false; // Ocultar si está casi quieto
    }
  }
  
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);
  
  renderer.render(scene, camera);
}

animate();

// Inicializar herramientas de depuración (una sola vez, antes de animate)
if (DEBUG_PHYSICS) {
  cannonDebugger = new CannonDebugger(scene, world, {
    color: 0x00ff00,
    scale: 1.0
  });
  
  // Crear flecha para visualizar el vector de velocidad
  velocityArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 0), // Dirección (se actualizará en cada frame)
    new THREE.Vector3(0, 0, 0), // Origen (se actualizará en cada frame)
    1, // Longitud base
    0xff00ff, // Color magenta
    0.5, // Longitud de la cabeza
    0.3  // Ancho de la cabeza
  );
  scene.add(velocityArrow);
  
  console.log('🐛 Debug de física activado');
  console.log('➡️ Flecha de velocidad: Magenta');
}
