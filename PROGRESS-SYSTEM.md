# Sistema de Progreso del Jugador

## Descripción General

El sistema de progreso guarda automáticamente el avance del jugador en `localStorage`, permitiendo que los niveles se desbloqueen progresivamente conforme se completan.

## Características

### 🔓 Desbloqueo Progresivo
- El nivel 1 está siempre desbloqueado
- Al completar un nivel, automáticamente se desbloquea el siguiente
- El progreso se mantiene entre sesiones del navegador

### 💾 Almacenamiento Persistente
El progreso se guarda en `localStorage` bajo la clave `mazeGameProgress` con la siguiente estructura:

```javascript
{
  "unlockedLevels": [1, 2, 3],      // Niveles desbloqueados
  "completedLevels": [1, 2],        // Niveles completados
  "lastPlayedLevel": 2,              // Último nivel jugado
  "createdAt": "2025-11-10T...",    // Fecha de creación
  "updatedAt": "2025-11-10T..."     // Última actualización
}
```

## Uso

### Desde el Código

```javascript
// Importar ProgressManager
import { ProgressManager } from './utils/ProgressManager.js';

// Crear instancia
const progressManager = new ProgressManager();

// Verificar si un nivel está desbloqueado
if (progressManager.isLevelUnlocked(3)) {
  // Cargar nivel 3
}

// Marcar nivel como completado (desbloquea el siguiente)
progressManager.completeLevel(2, totalLevels);

// Aplicar progreso a la configuración de niveles
progressManager.applyToLevelsConfig(LEVELS_CONFIG);

// Obtener estadísticas
const stats = progressManager.getStats();
console.log(stats);
// {
//   unlockedLevels: 3,
//   completedLevels: 2,
//   lastPlayed: 2,
//   progress: {...}
// }
```

### Desde la Consola del Navegador

```javascript
// Ver progreso actual
const progress = JSON.parse(localStorage.getItem('mazeGameProgress'));
console.log(progress);

// Desbloquear todos los niveles (para testing)
const allProgress = JSON.parse(localStorage.getItem('mazeGameProgress'));
allProgress.unlockedLevels = [1, 2, 3, 4, 5, 6];
localStorage.setItem('mazeGameProgress', JSON.stringify(allProgress));
location.reload(); // Recargar página

// Resetear todo el progreso
localStorage.removeItem('mazeGameProgress');
location.reload(); // Recargar página
```

### Botón de Reset en la UI

Existe un botón "🔄 Reiniciar Progreso" en el menú principal que permite al jugador resetear todo su progreso. Este botón:
- Solicita confirmación antes de resetear
- Elimina el progreso guardado
- Recarga la página para aplicar los cambios

## Integración con el Sistema Existente

### Game.js
Cuando un nivel se completa (método `onWin()`), automáticamente:
1. Marca el nivel como completado
2. Desbloquea el siguiente nivel
3. Guarda el progreso en localStorage
4. Actualiza la UI del menú

### main.js
Al iniciar la aplicación:
1. Carga el progreso guardado
2. Aplica el estado de desbloqueo a `LEVELS_CONFIG`
3. Muestra en consola las estadísticas del progreso

### MenuManager.js
El menú muestra:
- Niveles desbloqueados: botones activos con colores vibrantes
- Niveles bloqueados: botones deshabilitados con icono de candado 🔒

## Funciones Adicionales

### Exportar/Importar Progreso

```javascript
// Exportar progreso (útil para backup)
const backup = progressManager.exportProgress();
console.log(backup); // Copiar este JSON

// Importar progreso (restaurar backup)
const backupJSON = '{"unlockedLevels":[1,2,3],...}';
progressManager.importProgress(backupJSON);
```

### Verificar Estado de Niveles

```javascript
// Verificar si un nivel está completado
if (progressManager.isLevelCompleted(1)) {
  console.log('Nivel 1 ya fue completado');
}

// Desbloquear manualmente un nivel (para testing)
progressManager.unlockLevel(5);
```

## Debugging

Para facilitar el desarrollo, puedes:

1. **Ver el progreso actual en consola:**
   ```javascript
   console.log('Progreso:', game.progressManager.getStats());
   ```

2. **Desbloquear todos los niveles temporalmente:**
   ```javascript
   Object.keys(LEVELS_CONFIG).forEach(id => {
     game.progressManager.unlockLevel(parseInt(id));
   });
   game.progressManager.applyToLevelsConfig(LEVELS_CONFIG);
   menuManager.createLevelButtons(LEVELS_CONFIG);
   ```

3. **Usar el botón de reset en el menú** para volver al estado inicial

## Notas Técnicas

- El progreso se guarda automáticamente después de cada cambio
- No hay límite en el número de niveles que se pueden gestionar
- El sistema es compatible con actualizaciones de niveles (agregar nuevos niveles)
- Si se elimina o corrompe el localStorage, se crea un progreso nuevo por defecto

## Seguridad

- El progreso se guarda solo localmente (no hay servidor)
- El jugador puede manipular su progreso a través de la consola del navegador
- Para un sistema más seguro, considera implementar validación del lado del servidor

## Mejoras Futuras Sugeridas

- [ ] Sincronización con Supabase para progreso entre dispositivos
- [ ] Sistema de logros/achievements
- [ ] Estadísticas por nivel (mejor tiempo, intentos, etc.)
- [ ] Modo de desafío con vidas limitadas
- [ ] Guardar preferencias del jugador (música, efectos, etc.)
