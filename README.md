# CDEV_G9_2025 🎮

Proyecto de **Creatividad y Desarrollo de Entornos Virtuales** - Laberinto 3D interactivo con física realista y sistema de niveles.

## 📋 Descripción

Juego 3D de laberinto con física implementada usando **Three.js** y **Cannon.js**. El proyecto incluye:

- 🎯 Sistema de niveles configurables
- 🎨 Menú interactivo con selección de niveles
- ⚽ Física realista con Cannon.js (gravedad, colisiones, fricción)
- 🖱️ Control por mouse - inclina el laberinto para mover las bolas
- 📱 Control por giroscopio - juega inclinando tu celular (móviles)
- 🎯 Sistema de calibración para controles de giroscopio
- 🏗️ Arquitectura modular y escalable (separación de responsabilidades)
- 🐛 Sistema de debug integrado (activable desde el menú)
- 🎊 Sistema de victoria y progresión de niveles
- 📊 HUD en tiempo real con información del juego

## 🚀 Instalación

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 16 o superior)
- npm (viene incluido con Node.js)

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/nachoenrique/CDEV_G9_2025.git
cd CDEV_G9_2025
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
   - El servidor te mostrará una URL (normalmente `http://localhost:5173`)
   - Abre esa URL en tu navegador

## 🎮 Cómo jugar

### Control por Mouse (Desktop)
1. **Selecciona un nivel** desde el menú principal
2. **Mueve el mouse** para inclinar el laberinto
3. **Guía las pelotas** hacia las zonas objetivo (rojas)
4. Las zonas se vuelven **verdes** cuando una pelota está dentro
5. **Completa todas las zonas** para ganar el nivel
6. Desbloquea niveles adicionales al completar los anteriores

### Control por Giroscopio (Móvil) 📱

¡Ahora puedes jugar inclinando tu celular!

1. **Activa el giroscopio** desde el menú principal:
   - Marca el checkbox "📱 Control Giroscopio"
   - En iOS, acepta el permiso cuando se solicite
   
2. **Calibra el giroscopio** (opcional):
   - Mantén el celular en posición cómoda
   - Presiona el botón "🎯 Calibrar"
   - Esta será tu posición neutral
   
3. **Juega inclinando el dispositivo**:
   - Inclina el celular hacia adelante/atrás para mover en el eje X
   - Inclina el celular hacia izquierda/derecha para mover en el eje Z
   - Mantén el teléfono en posición horizontal para mayor control

**Consejos para control de giroscopio:**
- Calibra antes de cada nivel para mejor precisión
- Usa movimientos suaves y graduales
- Si el control es muy sensible/lento, recalibra
- En iOS, asegúrate de permitir el acceso al giroscopio cuando se solicite

### Modo Debug

Activa el **Modo Debug** desde el menú principal para ver:
- Formas físicas de colisión (verde)
- Flechas de velocidad de las pelotas (magenta)
- Planos de las paredes y piso

## 📁 Estructura del proyecto (refactorizada)

```
CDEV_G9_2025/
├── index.html              # Página HTML con menú y UI
├── styles.css              # Estilos del menú y HUD
├── main.js                 # Punto de entrada (orquestador)
├── config/
│   └── levels.config.js    # Configuración de todos los niveles
├── core/
│   ├── Game.js             # Lógica principal del juego
│   ├── LevelManager.js     # Gestión de carga/descarga de niveles
│   └── MazeController.js   # Controles y sincronización del laberinto
├── ui/
│   └── MenuManager.js      # Gestión del menú y HUD
├── utils/
│   ├── physics.js          # Utilidades de física (Trimesh, conversiones)
│   ├── maze.js             # Clase para cargar laberintos
│   ├── deviceOrientation.js # Control de giroscopio/acelerómetro
│   └── DebugManager.js     # Sistema de debug visual
├── models/
│   └── maze.glb            # Modelos 3D de los laberintos
├── package.json            # Dependencias
└── README.md               # Este archivo
```

### 🏗️ Arquitectura modular

La aplicación está diseñada con **separación de responsabilidades**:

- **`config/`**: Configuraciones (niveles, físicas, controles) - DATOS
- **`core/`**: Lógica del juego (Game, LevelManager, MazeController) - LÓGICA
- **`ui/`**: Interfaz de usuario (menú, HUD, overlays) - UI
- **`utils/`**: Herramientas reutilizables (física, debug, maze) - UTILIDADES
- **`main.js`**: Orquestador que conecta todo - ENTRADA

## 🛠️ Tecnologías utilizadas

- **[Three.js](https://threejs.org/)** - Motor de renderizado 3D
- **[Cannon.js](https://pmndrs.github.io/cannon-es/)** (cannon-es) - Motor de física
- **[Vite](https://vitejs.dev/)** - Build tool y servidor de desarrollo
- **[cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger)** - Visualización de colisiones

## 📦 Scripts disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para producción
npm run preview  # Previsualiza el build de producción
```

## 🔧 Cómo añadir nuevos niveles

¡Es muy fácil! Solo edita `config/levels.config.js`:

```javascript
export const LEVELS_CONFIG = {
    // ... niveles existentes ...
    
    3: {  // Nuevo nivel
        id: 3,
        name: "Nivel Experto",
        description: "El desafío definitivo",
        unlocked: false,
        maze: {
            model: '/models/maze_level3.glb',  // Tu nuevo modelo
            scale: 0.8,
            position: { x: 0, y: 0, z: 0 }
        },
        bounds: {
            wallDistance: 30,    // Cambiar tamaño
            wallHeight: 15,
            groundOffsetY: 3
        },
        balls: [
            // Definir tus pelotas
            { position: { x: 10, y: 20, z: 10 }, color: 0xff0000, radius: 0.5 }
        ],
        zones: [
            // Definir tus zonas
            { position: { x: 20, y: 3.5, z: 20 }, size: { width: 3, height: 1, depth: 3 } }
        ]
    }
};
```

**¡Eso es todo!** El juego automáticamente:
- Crea el botón en el menú
- Carga el laberinto
- Crea las pelotas y zonas
- Gestiona la física
- Verifica la victoria

### Ajustar la configuración global

En `config/levels.config.js`, modifica `GAME_CONFIG`:

```javascript
export const GAME_CONFIG = {
    physics: {
        gravity: { x: 0, y: -10, z: 0 },  // Cambiar gravedad
        timeStep: 1 / 60,
        maxSubSteps: 20,
        solverIterations: 20
    },
    controls: {
        maxTilt: Math.PI / 12,     // Inclinación máxima
        mouseSensitivity: 1.0      // Sensibilidad del mouse
    },
    materials: {
        ball: {
            mass: 0.5,             // Masa de las pelotas
            friction: 0.0,
            restitution: 0.0       // Rebote
        }
    }
};
```

## 🐛 Solución de problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Elimina `node_modules` y vuelve a instalar: `rm -rf node_modules && npm install`

### No se ve el menú
- Verifica que `index.html` esté cargando correctamente
- Revisa la consola del navegador (F12) para ver errores

### La bola atraviesa el piso
- El sistema ya incluye CCD (Continuous Collision Detection)
- Si persiste, ajusta `ccdIterations` en `config/levels.config.js`

### No se ve el laberinto
- Verifica que la ruta del modelo sea correcta en `config/levels.config.js`
- Revisa la consola del navegador para ver errores de carga
- Asegúrate de que el archivo `.glb` existe en la carpeta `models/`

### El debug no funciona
- Marca el checkbox "Modo Debug" en el menú principal
- Verifica que `cannon-es-debugger` esté instalado: `npm install`

### El giroscopio no funciona en mi celular
**En iOS:**
- Asegúrate de usar iOS 13 o superior
- Acepta el permiso cuando se solicite
- Si no aparece la solicitud, ve a Configuración > Safari > Avanzado > Experimental y activa "DeviceOrientation Event"
- Recarga la página después de cambiar configuraciones

**En Android:**
- Verifica que tu navegador soporte DeviceOrientation API (Chrome, Firefox)
- Asegúrate de estar usando HTTPS o localhost
- Algunos navegadores pueden requerir interacción del usuario antes de activar sensores

**General:**
- El giroscopio solo funciona en dispositivos móviles con sensores
- Calibra antes de jugar para mejor precisión
- Si el control está invertido o no responde bien, presiona "Calibrar"

## 👥 Autores

Proyecto desarrollado para el curso de Creatividad y Desarrollo de Entornos Virtuales.

## 📄 Licencia

Este proyecto es de uso académico.
