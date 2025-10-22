import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Maze } from './maze.js';
import Joystick from './joystick.js';

// #region Configuración inicial
// Debugger globals
const DEBUG_PHYSICS = true; // Cambiar a true para ver las formas físicas en verde
let cannonDebugger = null;
let velocityArrow = null;

// Escena, cámara y renderizador
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Luz principal
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
scene.add(light);

// Luz ambiental
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Mundo de física con configuración para Trimesh
const world = new CANNON.World();
world.gravity.set(0, -35, 0); // Gravedad aumentada para más respuesta
world.broadphase = new CANNON.SAPBroadphase(world); // Broadphase más eficiente
world.solver.iterations = 30; // Más iteraciones para mejor precisión
world.allowSleep = false; // Desactivar sleep para objetos críticos

// Materiales de contacto SIN fricción ni restitución
const mazeMaterial = new CANNON.Material('maze');
const sphereMaterial = new CANNON.Material('sphere');
const contactMaterial = new CANNON.ContactMaterial(mazeMaterial, sphereMaterial, {
  friction: 0.0,      // SIN fricción (deslizamiento perfecto)
  restitution: 0.0,   // SIN rebote
  contactEquationStiffness: 1e9,  // Rigidez MUY alta para evitar penetración
  contactEquationRelaxation: 2    // Más estricto
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
sphereMesh.position.set(0, 5, 0); // Empezar más bajo para menos impacto inicial
scene.add(sphereMesh);

// Esfera (física)
const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({ 
  mass: 0.5, // Masa realista para una bola pequeña (500g)
  material: sphereMaterial,
  linearDamping: 0.01,  // Amortiguamiento mínimo
  angularDamping: 0.01  // Amortiguamiento mínimo
});
sphereBody.addShape(sphereShape);
sphereBody.position.set(0, 5, 0); // Empezar más bajo

// CCD (Continuous Collision Detection) MEJORADO - CRÍTICO para evitar atravesar paredes
sphereBody.ccdSpeedThreshold = 0.1; // Activa CCD a velocidades muy bajas
sphereBody.ccdIterations = 30;      // Más iteraciones para mejor detección

world.addBody(sphereBody);
// #endregion Esfera

// #region Camara y control de mouse
// Posición de la cámara
camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

// Variables para el control del joystick únicamente
let joyX = 0;
let joyY = 0;
let lastTiltX = 0; // Guardar última inclinación
let lastTiltZ = 0; // Guardar última inclinación
const maxTilt = Math.PI / 8; // Inclinación aumentada: 22.5 grados (antes 18)

// Estado del juego
let gameInProgress = false;
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const restartHint = document.getElementById('restart-hint');
const joystickContainer = document.getElementById('joystick-container');
const restartButton = document.getElementById('restart-button');

// Función para reiniciar el juego
function resetGame() {
  console.log('🔄 Reiniciando juego...');
  
  // Resetear posición y velocidades de la esfera
  sphereBody.position.set(0, 5, 0); // Altura más baja
  sphereBody.velocity.set(0, 0, 0);
  sphereBody.angularVelocity.set(0, 0, 0);
  sphereBody.quaternion.set(0, 0, 0, 1);
  
  // Resetear rotación del laberinto
  maze.setRotation(0, 0, 0);
  
  // Resetear joystick visualmente (volver al centro)
  joyX = 0;
  joyY = 0;
  
  // Actualizar mesh visual inmediatamente
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);
  
  console.log('✅ Juego reiniciado');
}

// Click para iniciar/reanudar
window.addEventListener('mousedown', (event) => {
  // Solo responder si el overlay está visible
  if (overlay && !overlay.classList.contains('hidden')) {
    gameInProgress = true;
    overlay.classList.add('hidden');
    joystickContainer.classList.add('active');
    restartButton.classList.add('active');
    console.log('🎮 Juego iniciado');
  }
});

// Click en el botón de reinicio
restartButton.addEventListener('click', (event) => {
  event.stopPropagation(); // Evitar que active el overlay
  resetGame();
  console.log('🔄 Reinicio desde botón');
});

// Tecla ESC para pausar y R para reiniciar
window.addEventListener('keydown', (event) => {
  // ESC: Pausar
  if (event.key === 'Escape' && gameInProgress) {
    gameInProgress = false;
    overlayTitle.textContent = '⏸️ JUEGO PAUSADO';
    restartHint.textContent = 'Haz CLICK para continuar';
    overlay.classList.remove('hidden');
    joystickContainer.classList.remove('active');
    console.log('⏸️ Juego pausado');
  }
  
  // R: Reiniciar (mantener por compatibilidad)
  if ((event.key === 'r' || event.key === 'R')) {
    resetGame();
    console.log('🔄 Reinicio desde teclado (R)');
  }
});

// Inicializar joystick
let joystick = null;
try {
  joystick = new Joystick({ baseId: 'joy-base', stickId: 'joy-stick', maxRadius: 52 });
  joystick.onChange((v) => {
    joyX = v.dx;
    joyY = v.dy;
  });
  console.log('🕹️ Joystick inicializado correctamente');
} catch (err) {
  console.warn('⚠️ Joystick no disponible:', err);
}

// Loop de animación con parámetros ajustados para Trimesh
const timeStep = 1 / 60; // 60 FPS - balance entre precisión y rendimiento
const maxSubSteps = 20;  // Más substeps para mejor precisión

// Redimensionar ventana
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// #endregion Camara y control de mouse

function animate() {
  requestAnimationFrame(animate);
  
  // Solo ejecutar lógica del juego si está en progreso
  if (gameInProgress) {
    // Control SOLO por joystick
    const inputX = joyY;  // joy dy -> tilt X (adelante/atrás)
    const inputZ = joyX;  // joy dx -> tilt Z (izquierda/derecha)
    
    // Verificar si el joystick está en uso o centrado
    const joystickActive = Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01;
    
    if (joystickActive) {
      // Joystick activo: aplicar inclinación directamente
      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -inputX * maxTilt));
      const tiltZ = Math.max(-maxTilt, Math.min(maxTilt, -inputZ * maxTilt));
      
      lastTiltX = tiltX;
      lastTiltZ = tiltZ;
    } else {
      // Joystick soltado: volver gradualmente a 0 (nivelado)
      const returnSpeed = 0.05; // Velocidad de retorno (ajustar para más rápido/lento)
      lastTiltX *= (1 - returnSpeed);
      lastTiltZ *= (1 - returnSpeed);
      
      // Si está muy cerca de 0, forzar a 0
      if (Math.abs(lastTiltX) < 0.001) lastTiltX = 0;
      if (Math.abs(lastTiltZ) < 0.001) lastTiltZ = 0;
    }
    
    maze.setRotation(lastTiltX, 0, lastTiltZ);
    
    // Limitar la velocidad máxima de la esfera para evitar atravesar paredes
    const currentSpeed = sphereBody.velocity.length();
    const maxSpeed = 25; // Velocidad máxima reducida para mejor estabilidad
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      sphereBody.velocity.x *= scale;
      sphereBody.velocity.y *= scale;
      sphereBody.velocity.z *= scale;
    }
    
    // Simulación con múltiples substeps para evitar atravesamientos
    world.step(timeStep, timeStep, maxSubSteps);
    
    // Verificar si la esfera se cayó del laberinto o está muy lejos
    const distanceFromCenter = Math.sqrt(
      sphereBody.position.x * sphereBody.position.x + 
      sphereBody.position.z * sphereBody.position.z
    );
    
    // Detectar si está cayendo (velocidad Y negativa significativa)
    if (sphereBody.velocity.y < -10) {
      console.warn('⚠️ CAÍDA DETECTADA - Velocidad Y:', sphereBody.velocity.y);
      console.log('📍 Posición actual:', sphereBody.position);
    }
    
    // Ajustar límites según la escala del laberinto (0.5 = pequeño)
    if (sphereBody.position.y < -3 || distanceFromCenter > 25) {
      console.log('⚠️ La esfera se salió del área, reseteando...');
      console.log('📍 Posición:', sphereBody.position, 'Distancia:', distanceFromCenter);
      sphereBody.position.set(0, 5, 0); // Altura más baja
      sphereBody.velocity.set(0, 0, 0);
      sphereBody.angularVelocity.set(0, 0, 0);
      sphereBody.quaternion.set(0, 0, 0, 1);
      
      // Resetear inclinación del laberinto
      lastTiltX = 0;
      lastTiltZ = 0;
      maze.setRotation(0, 0, 0);
    }
    
    // Actualizar posición de la esfera visual SOLO cuando el juego está activo
    sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);
  } else {
    // Cuando está pausado, mantener la ÚLTIMA inclinación (no resetear a 0)
    maze.setRotation(lastTiltX, 0, lastTiltZ);
    // NO actualizar la física ni la posición de la esfera cuando está pausado
  }

  // Debug de física (solo si está activado)
  // Actualizar debugger de física (solo si está activado)
  if (cannonDebugger && gameInProgress) {
    cannonDebugger.update();
  }
  
  // Actualizar vector de velocidad (solo si está activado)
  if (velocityArrow && gameInProgress) {
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
