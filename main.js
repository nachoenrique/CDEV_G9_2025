import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Maze } from './maze.js';

// ⚙️ CONFIGURACIÓN
const DEBUG_PHYSICS = false; // Cambiar a true para ver las formas físicas en verde

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

// Mundo de física
const world = new CANNON.World();
world.gravity.set(0, -10, 0);

// Debug de física (solo si está activado)
let cannonDebugger = null;
if (DEBUG_PHYSICS) {
  cannonDebugger = new CannonDebugger(scene, world, {
    color: 0x00ff00,
    scale: 1.0
  });
  console.log('🐛 Debug de física activado');
} 

// Materiales de contacto para mejor física
const mazeMaterial = new CANNON.Material('maze');
const sphereMaterial = new CANNON.Material('sphere');
const contactMaterial = new CANNON.ContactMaterial(mazeMaterial, sphereMaterial, {
  friction: 0.3,
  restitution: 0.3
});
world.addContactMaterial(contactMaterial); 

// Cargar el laberinto con física automática
const maze = new Maze(scene, world);
maze.load('/models/maze.glb', {
  scale: 0.5,  // Escala aumentada a 2 (más grande)
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }
}).then(() => {
  // Asignar material al laberinto una vez cargado
  maze.body.material = mazeMaterial;
  console.log('🎯 Laberinto listo con', maze.body.shapes.length, 'formas físicas');
});

// Esfera (visual)
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMesh3Material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMesh3Material);
sphereMesh.position.set(0, 20, 0);
scene.add(sphereMesh);

// Esfera (física)
const sphereShape = new CANNON.Sphere(0.5);
const sphereBody = new CANNON.Body({ 
  mass: 1,
  material: sphereMaterial, 
});
sphereBody.addShape(sphereShape);
sphereBody.position.set(0, 20, 0);
world.addBody(sphereBody);

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

// Loop de animación
function animate() {
  requestAnimationFrame(animate);
  
  // Inclinar el laberinto según la posición del mouse
  const tiltX = -mouseY * maxTilt;
  const tiltZ = -mouseX * maxTilt;
  
  maze.setRotation(tiltX, 0, tiltZ);
  
  world.step(1 / 60);
  
  // Actualizar debugger de física (solo si está activado)
  if (cannonDebugger) {
    cannonDebugger.update();
  }
  
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);
  
  renderer.render(scene, camera);
}

animate();

// Redimensionar ventana
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
