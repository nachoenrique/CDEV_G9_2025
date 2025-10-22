import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCompoundBodyFromModel } from './physics.js';
import * as THREE from 'three';

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

  /**
   * Aplica un material de vidrio semi-transparente con tinte azul al laberinto
   */
  applyGlassMaterial() {
    if (!this.mesh) {
      console.warn('⚠️ No se puede aplicar material: laberinto no cargado');
      return;
    }

    // Crear material de vidrio con efecto realista y bordes más visibles
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,           // Tinte azul claro
      metalness: 0.1,            // Poco metálico
      roughness: 0.05,           // Muy pulido (casi espejo)
      transparent: true,
      opacity: 0.5,              // 50% opaco para mejor visibilidad
      transmission: 0.8,         // Transmisión de luz reducida para más solidez
      thickness: 1.0,            // Mayor grosor para bordes más visibles
      envMapIntensity: 2.0,      // Más reflejos del entorno
      clearcoat: 1.0,            // Capa clara brillante
      clearcoatRoughness: 0.05,  // Capa clara muy pulida
      ior: 1.5,                  // Índice de refracción del vidrio
      reflectivity: 0.7,         // Mayor reflectividad para bordes más visibles
      side: THREE.DoubleSide,    // Visible desde ambos lados
      emissive: 0x2244aa,        // Emisión azul suave para resaltar bordes
      emissiveIntensity: 0.15    // Intensidad de emisión leve
    });

    // Aplicar el material a todos los meshes del laberinto
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.material = glassMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Agregar bordes visibles con LineSegments
        const edges = new THREE.EdgesGeometry(child.geometry, 15); // 15 grados threshold
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x4488bb,  // Azul más oscuro
          linewidth: 2,
          transparent: true,
          opacity: 0.35
        });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        child.add(lineSegments);
      }
    });

    console.log('💎 Material de vidrio con bordes definidos aplicado al laberinto');
  }

  /**
   * Restaura el material original del laberinto
   */
  restoreOriginalMaterial() {
    if (!this.mesh) return;

    this.mesh.traverse((child) => {
      if (child.isMesh) {
        // Remover todos los LineSegments (bordes) que se hayan agregado
        const edgesToRemove = [];
        child.children.forEach((grandChild) => {
          if (grandChild.isLineSegments) {
            edgesToRemove.push(grandChild);
          }
        });
        edgesToRemove.forEach((edge) => {
          child.remove(edge);
          if (edge.geometry) edge.geometry.dispose();
          if (edge.material) edge.material.dispose();
        });
        
        // Restaurar propiedades de sombras estándar
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    console.log('🔄 Material original restaurado');
  }
}
