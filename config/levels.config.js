/**
 * Configuración de niveles del juego
 * Cada nivel define su propio laberinto, tamaño, posiciones y cantidades de objetos
 */

export const LEVELS_CONFIG = {
    1: {
        id: 1,
        name: "Nivel Principiante",
        description: "Aprende los controles básicos",
        unlocked: true,
        maze: {
            model: '/models/maze2.glb',
            scale: 0.2,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 14,
            wallHeight: 10,
            wallThickness: 1,
            groundOffsetY: 20
        },
        balls: [
            { position: { x: -5, y: 20, z: 5 }, color: 0x00ff00, radius: 0.5 },     // Verde
            { position: { x: -5, y: 20, z: -5 }, color: 0xffff00, radius: 0.5 }     // Amarilla
        ],
        zones: [
            { position: { x: 12, y: 3.5, z: 12 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 1: Noreste
            { position: { x: -12, y: 3.5, z: -12 }, size: { width: 3, height: 1, depth: 3 } }, // Zona 3: Suroeste
        ]
    },
    2: {
        id: 2,
        name: "Nivel Intermedio",
        description: "Más desafíos te esperan",
        unlocked: false, // Se desbloquea al completar nivel 1
        maze: {
            model: '/models/maze.glb', // Mismo modelo por ahora, puedes cambiarlo cuando tengas otro
            scale: 0.7,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 25,
            wallHeight: 12,
            wallThickness: 1,
            groundOffsetY: 3
        },
        balls: [
            { position: { x: 8, y: 20, z: 8 }, color: 0xff0000, radius: 0.5 },      // Roja
            { position: { x: -8, y: 20, z: 8 }, color: 0x00ff00, radius: 0.5 },      // Verde
            { position: { x: 0, y: 20, z: -8 }, color: 0x0000ff, radius: 0.5 },       // Azul
            { position: { x: 8, y: 20, z: -8 }, color: 0xffff00, radius: 0.5 }       // Amarillo
        ],
        zones: [
            { position: { x: 15, y: 3.5, z: 15 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 1
            { position: { x: -15, y: 3.5, z: -15 }, size: { width: 3, height: 1, depth: 3 } },  // Zona 2
            { position: { x: 15, y: 3.5, z: -15 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 3
            { position: { x: -15, y: 3.5, z: 15 }, size: { width: 3, height: 1, depth: 3 } }    // Zona 4
        ]
    }
};

/**
 * Configuración global del juego
 * Mantiene consistencia en físicas y controles entre todos los niveles
 */
export const GAME_CONFIG = {
    physics: {
        gravity: { x: 0, y: -10, z: 0 },
        timeStep: 1 / 60,
        maxSubSteps: 20,
        solverIterations: 20
    },
    controls: {
        maxTilt: Math.PI / 12, // Máxima inclinación del laberinto
        mouseSensitivity: 1.0
    },
    materials: {
        ball: {
            mass: 0.5,
            linearDamping: 0.0,
            angularDamping: 0.0,
            friction: 0.0,
            restitution: 0.0,
            ccdSpeedThreshold: 0.001,
            ccdIterations: 30
        },
        maze: {
            friction: 0.0,
            restitution: 0.0
        }
    }
};
