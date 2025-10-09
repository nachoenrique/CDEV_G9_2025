# CDEV_G9_2025 🎮

Proyecto de **Creatividad y Desarrollo de Entornos Virtuales** - Laberinto 3D interactivo con física realista.

## 📋 Descripción

Simulación 3D de un laberinto con física implementada usando **Three.js** y **Cannon.js**. El proyecto incluye:

- 🎯 Laberinto 3D cargado desde modelo GLB
- ⚽ Física realista con Cannon.js (gravedad, colisiones, fricción)
- 🖱️ Control por mouse - inclina el laberinto para mover la bola
- 🏗️ Arquitectura modular y escalable
- 🐛 Sistema de debug para visualizar colisiones

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

## 🎮 Cómo usar

- **Mueve el mouse** para inclinar el laberinto
- La bola seguirá la inclinación y rodará por el laberinto
- Las paredes tienen colisiones realistas

### Modo Debug

Para ver las formas físicas (colisiones):

1. Abre `main.js`
2. Cambia la línea:
```javascript
const DEBUG_PHYSICS = false; // Cambiar a true
```
3. Guarda el archivo
4. Verás las colisiones en color verde

## 📁 Estructura del proyecto

```
CDEV_G9_2025/
├── index.html          # Página principal
├── main.js            # Configuración principal y loop de animación
├── physics.js         # Módulo de física (Trimesh, conversiones)
├── maze.js            # Módulo del laberinto (carga y gestión)
├── models/            # Modelos 3D del laberinto
│   └── maze.glb       # Modelo del laberinto (recomendado)
├── package.json       # Dependencias del proyecto
└── README.md          # Este archivo
```

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

## 🔧 Configuración avanzada

### Ajustar el tamaño del laberinto

En `main.js`, modifica el parámetro `scale`:

```javascript
maze.load('/models/maze.glb', {
  scale: 2,  // Cambiar este valor (1 = normal, 2 = doble, etc.)
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }
});
```

### Ajustar la física

En `main.js`, puedes modificar:

```javascript
// Gravedad
world.gravity.set(0, -10, 0); // Cambiar -10 por otro valor

// Fricción y rebote
const contactMaterial = new CANNON.ContactMaterial(mazeMaterial, sphereMaterial, {
  friction: 0.3,      // Más alto = más fricción
  restitution: 0.3    // Más alto = más rebote
});
```

### Cambiar la cámara

En `main.js`:

```javascript
camera.position.set(0, 50, 0);  // Altura de la cámara
```

## 🐛 Solución de problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Elimina `node_modules` y vuelve a instalar: `rm -rf node_modules && npm install`

### La bola atraviesa el piso
- Esto es un problema conocido con Trimesh en física de alta velocidad
- Soluciones en desarrollo (ver `physics.js`)

### No se ve el laberinto
- Verifica que la ruta del modelo sea correcta en `main.js`
- Revisa la consola del navegador para ver errores

## 👥 Autores

Proyecto desarrollado para el curso de Creatividad y Desarrollo de Entornos Virtuales.

## 📄 Licencia

Este proyecto es de uso académico.
