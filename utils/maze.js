import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCompoundBodyFromModel } from './physics.js';

/**
 * Centra un objeto 3D en el origen de la escena (0, 0, 0)
 * basándose en su centro geométrico (BoundingBox).
 * @param {THREE.Object3D} model - El modelo 3D (ej: gltf.scene) a centrar
 * @returns {THREE.Vector3} El vector de offset aplicado (para debug)
 */
function centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Ajustar la posición del modelo restando el centro
    model.position.sub(center);
    
    console.log('📐 Modelo centrado. Offset aplicado:', {
        x: center.x.toFixed(2),
        y: center.y.toFixed(2),
        z: center.z.toFixed(2)
    });
    
    return center;
}

/**
 * Clase para gestionar el laberinto (visual y física)
 *
 * Refactor: helper logic is organized into private methods to keep `load`
 * lightweight and to make it easier to extend (texture/UV helpers, etc.).
 */
export class Maze {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mesh = null;
    this.body = null;
    this.loaded = false;
    this.scale = 1;
    this.centerOffset = null; // Guarda el offset de centrado
  }

  /**
   * Carga el modelo GLB del laberinto y delega configuración/creación de física
   * a métodos separados.
   * @param {string} path
   * @param {Object} options { scale, position, rotation }
   * @returns {Promise<Maze>}
   */
  load(path, options = {}) {
    const {
      scale = 4,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 }
    } = options;

    this.scale = scale;

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      console.log('🔄 Cargando laberinto con escala:', scale);

      loader.load(
        path,
        (gltf) => {
          const loadedMesh = gltf.scene;

          // PASO 1: Aplicar escala ANTES de calcular bounding box
          loadedMesh.scale.set(scale, scale, scale);
          loadedMesh.updateMatrixWorld(true);
          
          // PASO 2: Calcular bounding box y centro geométrico
          const box = new THREE.Box3().setFromObject(loadedMesh);
          const center = new THREE.Vector3();
          box.getCenter(center);
          
          // PASO 3: Crear Group como contenedor (este será el pivote correcto)
          const pivotGroup = new THREE.Group();
          
          // PASO 4: Offset del mesh para centrar pivote en (x_center, y_min, z_center)
          const offsetX = -center.x;  // Centrar en X
          const offsetY = -box.min.y; // Base del modelo en Y=0
          const offsetZ = -center.z;  // Centrar en Z
          
          loadedMesh.position.set(offsetX, offsetY, offsetZ);
          
          // PASO 5: Añadir mesh al Group
          pivotGroup.add(loadedMesh);
          
          // PASO 6: El Group es ahora nuestro mesh principal
          this.mesh = pivotGroup;
          this.centerOffset = new THREE.Vector3(center.x, box.min.y, center.z);
          
          console.log('📐 Pivote configurado. Offset aplicado:', {
            x: offsetX.toFixed(2),
            y: offsetY.toFixed(2),
            z: offsetZ.toFixed(2)
          });
          
          // PASO 7: Aplicar posición y rotación al Group
          this.mesh.position.set(position.x, position.y, position.z);
          this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);

          // PASO 8: Configurar sombras en el mesh hijo
          loadedMesh.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = true;
            }
          });
          
          this.scene.add(this.mesh);

          console.log('✅ Modelo del laberinto cargado con escala:', scale);
          console.log('📦 Estructura del modelo:', this.mesh);

          // Ensure world matrices are up-to-date before generating physics
          this.mesh.updateMatrixWorld(true);

          // Create the physics representation
          this._createPhysics(position);

          this.loaded = true;
          resolve(this);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`⏳ Cargando: ${percent}%`);
        },
        (error) => {
          console.error('❌ Error al cargar el laberinto:', error);
          reject(error);
        }
      );
    });
  }

  // ----------------------------- Helpers -----------------------------
  /**
   * NOTA: Este método ya no se usa. El centrado y configuración
   * se hace directamente en el callback del loader para tener
   * el orden correcto: escala -> centrado -> posición.
   * Se mantiene por compatibilidad pero puede ser eliminado.
   */
  _configureMesh(opts) {
    // Método deprecado - la configuración se hace en load()
    console.warn('⚠️ _configureMesh está deprecado. La configuración se hace en load()');
  }

  /**
   * Crea el cuerpo físico compuesto a partir del mesh y lo añade al world.
   * Se delega en `createCompoundBodyFromModel` que reside en `physics.js`.
   * @param {{x:number,y:number,z:number}} position
   */
  _createPhysics(position) {
    if (!this.mesh || !this.world) return;
    this.body = createCompoundBodyFromModel(this.mesh, this.world);
    this.body.position.set(position.x, position.y, position.z);
    this.world.addBody(this.body);
    console.log('🎮 Física del laberinto generada');
  }

  // --------------------------- Public API ----------------------------
  /**
   * Actualiza la rotación del laberinto (visual y física)
   * @param {number} x - Rotación en eje X
   * @param {number} y - Rotación en eje Y
   * @param {number} z - Rotación en eje Z
   */
  setRotation(x, y, z) {
    if (!this.loaded) return;
    if (this.mesh) this.mesh.rotation.set(x, y, z);
    if (this.body) {
      this.body.position.copy(this.mesh.position);
      this.body.quaternion.setFromEuler(x, y, z);
    }
  }

  /**
   * Obtiene si el laberinto está cargado
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }
}
