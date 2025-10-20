import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Convierte una geometría de Three.js a una forma física de Cannon.js
 * @param {THREE.BufferGeometry} geometry - Geometría de Three.js
 * @param {THREE.Vector3} scale - Escala del objeto
 * @returns {CANNON.Shape} Forma física compatible con Cannon.js
 */
export function createShapeFromGeometry(geometry, scale = new THREE.Vector3(1, 1, 1)) {
  // Calcular bounding box de la geometría
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  
  const bbox = geometry.boundingBox;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  // Aplicar escala
  size.multiply(scale);
  
  // Crear una caja que envuelva la geometría
  const halfExtents = new CANNON.Vec3(
    size.x / 2,
    size.y / 2,
    size.z / 2
  );
  
  return new CANNON.Box(halfExtents);
}

/**
 * Extrae la posición de un objeto Three.js en coordenadas del mundo
 * @param {THREE.Object3D} object - Objeto de Three.js
 * @returns {CANNON.Vec3} Posición en coordenadas del mundo
 */
export function getWorldPosition(object) {
  const worldPos = new THREE.Vector3();
  object.getWorldPosition(worldPos);
  return new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z);
}

/**
 * Extrae la rotación de un objeto Three.js en quaternion
 * @param {THREE.Object3D} object - Objeto de Three.js
 * @returns {CANNON.Quaternion} Rotación en quaternion
 */
export function getWorldQuaternion(object) {
  const worldQuat = new THREE.Quaternion();
  object.getWorldQuaternion(worldQuat);
  return new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
}

/**
 * Convierte una geometría de Three.js a un Trimesh de Cannon.js
 * Trimesh proporciona colisiones precisas con geometría compleja
 * @param {THREE.BufferGeometry} geometry - Geometría de Three.js
 * @param {THREE.Vector3} scale - Escala del objeto
 * @returns {CANNON.Trimesh} Trimesh con la geometría exacta
 */
export function createTrimeshFromGeometry(geometry, scale = new THREE.Vector3(1, 1, 1)) {
  const vertices = [];
  const indices = [];
  
  const position = geometry.attributes.position;
  
  // Extraer vértices aplicando escala
  for (let i = 0; i < position.count; i++) {
    vertices.push(
      position.getX(i) * scale.x,
      position.getY(i) * scale.y,
      position.getZ(i) * scale.z
    );
  }
  
  // Extraer índices de las caras
  if (geometry.index) {
    for (let i = 0; i < geometry.index.count; i++) {
      indices.push(geometry.index.getX(i));
    }
  } else {
    // Si no hay índices, crear secuencia 0,1,2,3,4,5...
    for (let i = 0; i < position.count; i++) {
      indices.push(i);
    }
  }
  
  return new CANNON.Trimesh(vertices, indices);
}

/**
 * Crea un cuerpo físico compuesto a partir de un modelo 3D usando Trimesh
 * Proporciona colisiones precisas para geometría compleja como laberintos
 * @param {THREE.Object3D} model - Modelo 3D de Three.js
 * @param {CANNON.World} world - Mundo de física de Cannon.js
 * @returns {CANNON.Body} Cuerpo físico compuesto
 */
export function createCompoundBodyFromModel(model, world) {
  const body = new CANNON.Body({ 
    mass: 0,  // Objeto estático
    type: CANNON.Body.STATIC  // Explícitamente estático para mejor rendimiento
  });
  
  let shapeCount = 0;
  let totalVertices = 0;
  let totalFaces = 0;
  
  // Obtener posición del modelo padre
  const modelWorldPos = new THREE.Vector3();
  model.getWorldPosition(modelWorldPos);
  
  // Recorrer todos los meshes del modelo
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      try {
        // Obtener escala del objeto
        const scale = new THREE.Vector3();
        child.getWorldScale(scale);
        
        // Crear Trimesh desde la geometría - colisiones precisas
        const trimeshShape = createTrimeshFromGeometry(child.geometry, scale);
        
        // Configuración crítica para Trimesh
        trimeshShape.setScale(new CANNON.Vec3(1, 1, 1));
        trimeshShape.updateAABB();
        trimeshShape.updateBoundingSphereRadius();
        trimeshShape.updateTree();
        
        // Obtener posición RELATIVA al modelo padre
        const childWorldPos = new THREE.Vector3();
        child.getWorldPosition(childWorldPos);
        const relativePos = childWorldPos.sub(modelWorldPos);
        
        const position = new CANNON.Vec3(
          relativePos.x, 
          relativePos.y, 
          relativePos.z
        );
        
        // Obtener rotación relativa
        const quaternion = getWorldQuaternion(child);
        
        // Agregar Trimesh al cuerpo compuesto
        body.addShape(trimeshShape, position, quaternion);
        shapeCount++;
        
        const vertexCount = trimeshShape.vertices.length / 3;
        const faceCount = trimeshShape.indices.length / 3;
        totalVertices += vertexCount;
        totalFaces += faceCount;
        
        console.log(`✓ Trimesh creado para: ${child.name || 'mesh sin nombre'}`, {
          vértices: vertexCount,
          caras: faceCount,
          position: position
        });
      } catch (error) {
        console.warn(`⚠ No se pudo crear física para mesh:`, child.name, error);
      }
    }
  });
  
  console.log(`✅ Cuerpo físico con Trimesh creado:`, {
    formas: shapeCount,
    vértices_totales: totalVertices,
    caras_totales: totalFaces
  });
  
  return body;
}
