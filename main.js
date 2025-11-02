import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Maze } from './maze.js';
import Joystick from './joystick.js';

// #region Configuración inicial
// Debugger globals
const DEBUG_PHYSICS = false; // Cambiar a true para ver las formas físicas en verde
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
sphereMesh.position.set(-18.45, 2.50, 0.13); // Posición inicial solicitada
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
sphereBody.position.set(-18.45, 2.50, 0.13); // Posición inicial solicitada

// CCD (Continuous Collision Detection) MEJORADO - CRÍTICO para evitar atravesar paredes
sphereBody.ccdSpeedThreshold = 0.1; // Activa CCD a velocidades muy bajas
sphereBody.ccdIterations = 30;      // Más iteraciones para mejor detección

world.addBody(sphereBody);

// Prevent bouncing: on collision remove the velocity component along the contact normal
// This avoids elastic-like reflection while preserving collision response (no passing through)
{
  // tmp vector to avoid allocations
  const _tmp = new CANNON.Vec3();
  sphereBody.addEventListener('collide', (e) => {
    try {
      const contact = e.contact;
      if (!contact) return;

      // contact.ni is the contact normal (from body i to body j)
      // We compute the velocity projection along that normal and subtract it
      // so the sphere won't gain a bounce component along the normal.
      const normal = contact.ni; // CANNON.Vec3
      // Compute vn = v . n
      const v = sphereBody.velocity;
      const vn = v.x * normal.x + v.y * normal.y + v.z * normal.z;
      if (vn > 0) {
        // tmp = normal * vn
        normal.scale(vn, _tmp);
        // v = v - tmp
        v.vsub(_tmp, sphereBody.velocity);
      }
    } catch (err) {
      console.error('Error handling collision:', err);
    }
  });
}
// #endregion Esfera

//region Camara y control de mouse
// Posición de la cámara
camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

// Variables para el control del joystick únicamente
let joyX = 0;
let joyY = 0;
let lastTiltX = 0; // Guardar última inclinación
let lastTiltZ = 0; // Guardar última inclinación
const maxTilt = Math.PI / 8; // Inclinación aumentada: 22.5 grados (antes 18)

// Variables para control de cámara con mouse
let mouseIsDown = false;
let mouseX = 0;
let mouseY = 0;
const mouseSensitivity = 0.002; // Reducida de 0.003 a 0.001 para un control más suave
let cameraAngleHorizontal = 0;
let cameraAngleVertical = Math.PI / 6; // Ángulo inicial vertical (30 grados)
const minVerticalAngle = 0.1; // Límite superior (casi horizontal)
const maxVerticalAngle = Math.PI / 2; // Límite inferior (45 grados hacia abajo)

// Cámara: modo y parámetros de tercera persona
let cameraMode = 'static'; // 'static' | 'thirdperson'
const cameraIndicator = document.getElementById('camera-indicator');
const thirdPersonOffset = new THREE.Vector3(0, 0.8, 2.0); // más bajo y más cerca para estar dentro del laberinto

// Raycast para evitar que la cámara atraviese paredes
const raycaster = new THREE.Raycaster();
const _tempV3 = new THREE.Vector3(); // para cálculos temporales
const cameraLerpFactor = 0.18; // suavizado de cámara
let lastForward = new THREE.Vector3(0, 0, 1); // dirección previa para fallback
let currentLookAt = new THREE.Vector3(0, 0, 0); // objetivo suavizado para lookAt

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
  sphereBody.position.set(-18.45, 2.50, 0.13); // Posición inicial solicitada
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

// Eventos de mouse para control de cámara
window.addEventListener('mousedown', (event) => {
  // Iniciar juego si el overlay está visible
  if (overlay && !overlay.classList.contains('hidden')) {
    gameInProgress = true;
    overlay.classList.add('hidden');
    joystickContainer.classList.add('active');
    restartButton.classList.add('active');
    console.log('🎮 Juego iniciado');
  }
  
  // Activar control de cámara solo con click derecho en modo tercera persona
  if (event.button === 2 && cameraMode === 'thirdperson') {
    mouseIsDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
});

window.addEventListener('mouseup', (event) => {
  if (event.button === 2) {
    mouseIsDown = false;
  }
});

window.addEventListener('mousemove', (event) => {
  if (mouseIsDown && cameraMode === 'thirdperson') {
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;
    
    cameraAngleHorizontal -= deltaX * mouseSensitivity;
    cameraAngleVertical = Math.max(minVerticalAngle,
      Math.min(maxVerticalAngle,
        cameraAngleVertical + deltaY * mouseSensitivity));
    
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
});

// Prevenir menú contextual del click derecho
window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
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
  
  // V: alternar entre vista estática y tercera persona
  if (event.key === 'v' || event.key === 'V') {
    cameraMode = cameraMode === 'static' ? 'thirdperson' : 'static';

    if (cameraIndicator) {
      cameraIndicator.textContent = cameraMode === 'static' ? 'Cámara: Estática' : 'Cámara: 3ª persona';
    }

    // Ajuste inmediato si volvemos a estática
    if (cameraMode === 'static') {
      camera.position.set(0, 50, 0);
      camera.lookAt(0, 0, 0);
    }
    // Si entramos en tercera persona, posicionar la cámara y dirección solicitadas
    if (cameraMode === 'thirdperson') {
      // Posición solicitada para la cámara
      camera.position.set(-19.98, 3.78, 0.13);

      // Dirección solicitada (vector de dirección)
      const desiredDir = new THREE.Vector3(0.94, 1, 0.00).normalize();

      // Hacer que la cámara mire en la dirección deseada (mirando hacia un punto adelante)
      const lookAtPoint = new THREE.Vector3().copy(camera.position).add(desiredDir);
      camera.lookAt(lookAtPoint);

      // Actualizar lastForward con la proyección horizontal de desiredDir para mantener controles coherentes
      lastForward.copy(desiredDir);
      lastForward.y = 0;
      if (lastForward.lengthSq() === 0) lastForward.set(0, 0, 1);
      lastForward.normalize();

      // Ajustar los ángulos usados por el sistema de cámara para evitar sobrescrituras bruscas
      cameraAngleHorizontal = Math.atan2(-lastForward.x, -lastForward.z);
      cameraAngleVertical = Math.asin(THREE.MathUtils.clamp(desiredDir.y, -0.99, 0.99));
    }

    console.log('🎥 Modo de cámara:', cameraMode);
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
  const inputZ = -joyX;  // joy dx -> tilt Z (izquierda/derecha) (invertido para que A=izquierda, D=derecha)
    
    // Verificar si el joystick está en uso o centrado
    const joystickActive = Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01;
    
    if (joystickActive) {
      // Joystick activo: calcular "tilt" interno (pero NO rotamos el laberinto)
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

    // Calcular fuerzas basadas en la orientación de la cámara en tercera persona
    const g = Math.abs(world.gravity.y) || 9.82;
    const mass = sphereBody.mass || 1;
    
    let fx = 0, fz = 0;
    
    if (cameraMode === 'thirdperson') {
      // En tercera persona, las fuerzas son relativas a la dirección de la cámara
      const forward = lastForward.clone(); // Vector hacia donde mira la cámara
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)); // Vector derecha de la cámara
      
      // Calcular dirección final combinando los inputs
      const direction = new THREE.Vector3();
      
      // W/S: Movimiento adelante/atrás en dirección de la cámara
      direction.add(forward.clone().multiplyScalar(-lastTiltX)); // -lastTiltX porque W es negativo
      
      // A/D: Movimiento izquierda/derecha perpendicular a la cámara
      direction.add(right.clone().multiplyScalar(lastTiltZ));
      
      // Normalizar y aplicar fuerza si hay input
      const inputMagnitude = Math.sqrt(lastTiltX * lastTiltX + lastTiltZ * lastTiltZ);
      if (inputMagnitude > 0.001) {
        direction.normalize();
        direction.multiplyScalar(inputMagnitude * g * mass);
        fx = direction.x;
        fz = direction.z;
      }
    } else {
      // En otros modos, mantener el comportamiento original
      const accelZ = Math.sin(lastTiltX) * g;
      const accelX = Math.sin(lastTiltZ) * g;
      fx = accelX * mass;
      fz = accelZ * mass;
    }

    // Aplicar la fuerza en el centro de masa
    sphereBody.applyForce(new CANNON.Vec3(fx, 0, fz), sphereBody.position);
    
    // Limitar la velocidad máxima de la esfera para evitar atravesar paredes
    const currentSpeed = sphereBody.velocity.length();
  const maxSpeed = 5; // Velocidad máxima reducida para mejor estabilidad (ajustada a 12)
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
  sphereBody.position.set(-18.45, 2.50, 0.13); // Posición inicial solicitada
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
    
    // Actualizar cámara según el modo seleccionado
    if (cameraMode === 'thirdperson') {
      // Calcular la posición de la cámara usando los ángulos del mouse
      const horizontalDistance = thirdPersonOffset.z * Math.cos(cameraAngleVertical);
      
      // Calcular offset de la cámara usando ángulos esféricos
      const cameraOffset = new THREE.Vector3(
        horizontalDistance * Math.sin(cameraAngleHorizontal),
        thirdPersonOffset.z * Math.sin(cameraAngleVertical),
        horizontalDistance * Math.cos(cameraAngleHorizontal)
      );

      // Actualizar lastForward para el movimiento relativo a la cámara
      lastForward.set(
        -Math.sin(cameraAngleHorizontal),
        0,
        -Math.cos(cameraAngleHorizontal)
      );
      lastForward.normalize();

      // Posición deseada = posición de la bola + offset calculado
      const desired = new THREE.Vector3().copy(sphereMesh.position).add(cameraOffset);
      
      // Raycast para evitar atravesar paredes
      _tempV3.copy(desired).sub(sphereMesh.position);
      const distance = _tempV3.length();
      _tempV3.normalize();
      
      raycaster.ray.origin.copy(sphereMesh.position);
      raycaster.ray.direction.copy(_tempV3);
      
      const intersects = raycaster.intersectObject(maze.mesh, true);
      
      if (intersects.length > 0 && intersects[0].distance < distance) {
        const hitPoint = intersects[0].point;
        _tempV3.multiplyScalar(-0.2);
        hitPoint.add(_tempV3);
        camera.position.lerp(hitPoint, cameraLerpFactor);
      } else {
        camera.position.lerp(desired, cameraLerpFactor);
      }

      // Punto de mira adelante de la bola en la dirección de movimiento
      const lookAtPoint = new THREE.Vector3()
        .copy(sphereMesh.position)
        .add(lastForward.clone().multiplyScalar(2));
      
      // Suavizar el punto de mira para evitar movimientos bruscos
      currentLookAt.lerp(lookAtPoint, cameraLerpFactor);
      camera.lookAt(currentLookAt);
    } else {
      // volver suavemente a vista estática cenital
      const staticTarget = new THREE.Vector3(0, 50, 0);
      camera.position.lerp(staticTarget, 0.06);
      camera.lookAt(0, 0, 0);
    }
  } else {
    // Cuando está pausado, no rotamos el laberinto (permanece estático)
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
