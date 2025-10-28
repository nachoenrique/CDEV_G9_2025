import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCompoundBodyFromModel } from './physics.js';

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
          this.mesh = gltf.scene;

          // Configure visual transform and scene placement
          this._configureMesh({ scale, position, rotation });
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
   * Configura transformaciones básicas del mesh y cualquier ajuste visual
   * (por ejemplo, activar sombras si se requiere).
   * @param {{scale:number, position:{x,y,z}, rotation:{x,y,z}}} opts
   */
  _configureMesh(opts) {
    const { scale, position, rotation } = opts;
    if (!this.mesh) return;
    this.mesh.scale.set(scale, scale, scale);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);

    // Optional: enable shadows for meshes if the app uses them
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
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
