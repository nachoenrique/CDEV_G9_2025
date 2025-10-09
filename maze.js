import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCompoundBodyFromModel } from './physics.js';

/**
 * Clase para gestionar el laberinto (visual y física)
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
   * Carga el modelo del laberinto y genera su física automáticamente
   * @param {string} path - Ruta al archivo GLB del laberinto
   * @param {Object} options - Opciones de carga (scale, position, rotation)
   * @returns {Promise} Promesa que se resuelve cuando el laberinto está cargado
   */
  load(path, options = {}) {
    const {
      scale = 4,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 }
    } = options;

    // Guardar escala
    this.scale = scale;

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      console.log('🔄 Cargando laberinto con escala:', scale);
      
      loader.load(
        path,
        (gltf) => {
          // Configurar mesh visual
          this.mesh = gltf.scene;
          this.mesh.scale.set(scale, scale, scale);
          this.mesh.position.set(position.x, position.y, position.z);
          this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
          this.scene.add(this.mesh);
          
          console.log('✅ Modelo del laberinto cargado con escala:', scale);
          console.log('📦 Estructura del modelo:', this.mesh);
          
          // IMPORTANTE: Actualizar las matrices antes de crear física
          this.mesh.updateMatrixWorld(true);
          
          // Crear física automáticamente desde la geometría (ya incluye la escala)
          this.body = createCompoundBodyFromModel(this.mesh, this.world);
          this.body.position.set(position.x, position.y, position.z);
          this.world.addBody(this.body);
          
          this.loaded = true;
          
          console.log('🎮 Física del laberinto generada');
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

  /**
   * Actualiza la rotación del laberinto (visual y física)
   * @param {number} x - Rotación en eje X
   * @param {number} y - Rotación en eje Y
   * @param {number} z - Rotación en eje Z
   */
  setRotation(x, y, z) {
    if (!this.loaded) return;
    
    // Actualizar visual
    if (this.mesh) {
      this.mesh.rotation.set(x, y, z);
    }
    
    // Actualizar física - sincronizar posición y rotación
    if (this.body) {
      // Copiar posición del mesh al body
      this.body.position.copy(this.mesh.position);
      this.body.quaternion.setFromEuler(x, y, z);
    }
  }

  /**
   * Obtiene si el laberinto está cargado
   * @returns {boolean} True si el laberinto está listo
   */
  isLoaded() {
    return this.loaded;
  }
}
