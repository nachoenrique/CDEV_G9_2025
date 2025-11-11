/**
 * Configuración de niveles del juego
 * Cada nivel define su propio laberinto, tamaño, posiciones y cantidades de objetos
 */

export const LEVELS_CONFIG = {
    1: {
        id: 1,
        name: "Tutorial",
        description: "Aprende los controles básicos",
        unlocked: true,
        lighting: {
            ambient: 0x40ff40,      // Verde suave
            colors: [0x00ff00, 0xffff00], // Verde y amarillo
            intensity: 2.5,
            description: "Luces verdes/amarillas - Ambiente tranquilo"
        },
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
            groundOffsetY: 2
        },
        balls: [
            { position: { x: -5, y: 20, z: -5 }, color: 0xffff00, radius: 0.5 }     // Amarilla
        ],
        zones: [
            { position: { x: 11, y: 3.5, z: 11 }, size: { width: 3, height: 5, depth: 3 } },   // Zona 1: Noreste
        ]
    },
    2: {
        id: 2,
        name: "Comencemos",
        description: "Más desafíos te esperan",
        unlocked: false, // Se desbloquea al completar nivel 1
        lighting: {
            ambient: 0xff8040,      // Naranja suave
            colors: [0xff6600, 0xffaa00], // Naranja y amarillo intenso
            intensity: 3.0,
            description: "Luces naranjas - Dificultad media"
        },
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
            groundOffsetY: 2
        },
        balls: [
            { position: { x: -5, y: 20, z: 5 }, color: 0x00ff00, radius: 0.5 },     // Verde
            { position: { x: -5, y: 20, z: -5 }, color: 0xffff00, radius: 0.5 }     // Amarilla
        ],
        zones: [
            { position: { x: 11, y: 3.5, z: 11 }, size: { width: 3, height: 5, depth: 3 } },   // Zona 1: Noreste
            { position: { x: -11, y: 3.5, z: -11 }, size: { width: 3, height: 5, depth: 3 } }, // Zona 3: Suroeste
        ]
    },
    3: {
        id: 3,
        name: "Nivel Intermedio",
        description: "Sincronizacion y precisión",
        unlocked: false, // Se desbloquea al completar nivel 1
        lighting: {
            ambient: 0xff4040,      // Rojo suave
            colors: [0xff0000, 0xff00ff, 0x8800ff], // Rojo, magenta y morado
            intensity: 3.5,
            description: "Luces rojas/moradas - Máxima dificultad"
        },
        maze: {
            model: '/models/mazeRustico.glb',
            scale: 1.5,
            position: { x: 0, y: 0, z: 3 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 20,
            wallHeight: 10,
            wallThickness: 1,
            groundOffsetY: 2
        },
        balls: [
            { position: { x: 1, y: 20, z: 18 }, color: 0x00ff00, radius: 0.5 },     // Verde
            { position: { x: -1, y: 20, z: 18 }, color: 0xffff00, radius: 0.5 }     // Amarilla
        ],
        zones: [
            { position: { x: -5, y: 2, z: -13 }, size: { width: 3, height: 3, depth: 3 } },   // Zona 1: Noreste
            { position: { x: -17, y: 2, z: -13.5 }, size: { width: 2.5, height: 3, depth: 3 } }, // Zona 3: Suroeste
        ]
    },
    4: {
        id: 4,
        name: "El Pacman",
        description: "El camino es largo pero no imposible",
        unlocked: false, // Se desbloquea al completar nivel 3
        lighting: {
            ambient: 0xff8040,      // Naranja suave
            colors: [0xff6600, 0xffaa00], // Naranja y amarillo intenso
            intensity: 3.5,
            description: "Luces naranjas - Máxima dificultad"
        },
        maze: {
            model: '/models/mazePacman.glb', 
            scale: 9,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 15,
            wallHeight: 12,
            wallThickness: 1,
            groundOffsetY: 1
        },
        balls: [
            { position: { x: -10, y: 20, z: 10 }, color: 0xff0000, radius: 0.5 },      // Roja
        ],
        zones: [
            { position: { x: 0, y: 0.5, z: -2.7 }, size: { width: 6.1, height: 2, depth: 3 } }    // Zona 1
        ]
    },
    5: {
        id: 5,
        name: "Nivel Avanzado",
        description: "El camino es largo pero no imposible",
        unlocked: false, // Se desbloquea al completar nivel 3
        lighting: {
            ambient: 0xff8040,      // Naranja suave
            colors: [0xff6600, 0xffaa00], // Naranja y amarillo intenso
            intensity: 3.5,
            description: "Luces naranjas - Máxima dificultad"
        },
        maze: {
            model: '/models/mazePrueba.glb', 
            scale: 2,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 28,
            wallHeight: 12,
            wallThickness: 1,
            groundOffsetY: 3
        },
        balls: [
            { position: { x: -26, y: 20, z: 25 }, color: 0xff0000, radius: 0.5 },      // Roja
        ],
        zones: [
            { position: { x: 25, y: 0.5, z: -27 }, size: { width: 2.5, height: 7, depth: 3 } }    // Zona 1
        ]
    },
    6: {
        id: 6,
        name: "Nivel Pro",
        description: "Desafíos extremos te esperan",
        unlocked: false, // Se desbloquea al completar nivel 2
        lighting: {
            ambient: 0xff4040,      // Rojo suave
            colors: [0xff0000, 0xff00ff, 0x8800ff], // Rojo, magenta y morado
            intensity: 3.5,
            description: "Luces rojas/moradas - Máxima dificultad"
        },
        maze: {
            model: '/models/maze.glb', // Mismo modelo por ahora, puedes cambiarlo cuando tengas otro
            scale: 0.7,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 27,
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
            { position: { x: 16, y: 3.5, z: 16 }, size: { width: 4.5, height: 5.5, depth: 4.5 } },   // Zona 1
            { position: { x: -16, y: 3.5, z: -16 }, size: { width: 4.5, height: 5.5, depth: 4.5 } },  // Zona 2
            { position: { x: 16, y: 3.5, z: -16 }, size: { width: 4.5, height: 5.5, depth: 4.5 } },   // Zona 3
            { position: { x: -16, y: 3.5, z: 16 }, size: { width: 4.5, height: 5.5, depth: 4.5 } }    // Zona 4
        ]
    },
    // 6: {
    //     id: 6,
    //     name: "Nivel Intermedio",
    //     description: "Más desafíos te esperan",
    //     unlocked: true, // Se desbloquea al completar nivel 1
    //     lighting: {
    //         ambient: 0xff4040,      // Rojo suave
    //         colors: [0xff0000, 0xff00ff, 0x8800ff], // Rojo, magenta y morado
    //         intensity: 3.5,
    //         description: "Luces rojas/moradas - Máxima dificultad"
    //     },
    //     maze: {
    //         model: '/models/mazeMedieval.glb',
    //         scale: 0.5,
    //         position: { x: 0, y: 0, z: 0 },
    //         rotation: { x: 0, y: 0, z: 0 }
    //     },
    //     bounds: {
    //         wallDistance: 14,
    //         wallHeight: 10,
    //         wallThickness: 1,
    //         groundOffsetY: 2
    //     },
    //     balls: [
    //         { position: { x: -5, y: 20, z: 5 }, color: 0x00ff00, radius: 0.5 },     // Verde
    //         { position: { x: -5, y: 20, z: -5 }, color: 0xffff00, radius: 0.5 }     // Amarilla
    //     ],
    //     zones: [
    //         { position: { x: 12, y: 3.5, z: 12 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 1: Noreste
    //         { position: { x: -12, y: 3.5, z: -12 }, size: { width: 3, height: 1, depth: 3 } }, // Zona 3: Suroeste
    //     ]
    // },
    // 7: {
    //     id: 7,
    //     name: "Nivel Intermedio",
    //     description: "Más desafíos te esperan",
    //     unlocked: true, // Se desbloquea al completar nivel 1
    //     lighting: {
    //         ambient: 0xff4040,      // Rojo suave
    //         colors: [0xff0000, 0xff00ff, 0x8800ff], // Rojo, magenta y morado
    //         intensity: 3.5,
    //         description: "Luces rojas/moradas - Máxima dificultad"
    //     },
    //     maze: {
    //         model: '/models/mazePacman.glb',
    //         scale: 12,
    //         position: { x: 0, y: 0, z: 0 },
    //         rotation: { x: 0, y: 0, z: 0 }
    //     },
    //     bounds: {
    //         wallDistance: 14,
    //         wallHeight: 10,
    //         wallThickness: 1,
    //         groundOffsetY: 2
    //     },
    //     balls: [
    //         { position: { x: -5, y: 20, z: 5 }, color: 0x00ff00, radius: 0.5 },     // Verde
    //     ],
    //     zones: [
    //         { position: { x: 0, y: 1, z: -3.5 }, size: { width: 3, height: 1, depth: 3 } },   // Zona 1: Noreste
    //     ]
    // },
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
