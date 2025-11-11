/**
 * Script de prueba para el sistema de progreso
 * Ejecutar en la consola del navegador para probar funcionalidades
 */

// ============================================
// FUNCIONES DE TESTING PARA EL PROGRESO
// ============================================

// Ver progreso actual
function verProgreso() {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress'));
    console.log('📊 Progreso actual:', progress);
    return progress;
}

// Desbloquear todos los niveles (para testing)
function desbloquearTodos() {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress')) || {};
    progress.unlockedLevels = [1, 2, 3, 4, 5, 6];
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem('mazeGameProgress', JSON.stringify(progress));
    console.log('✅ Todos los niveles desbloqueados');
    console.log('🔄 Recarga la página para ver los cambios');
    return progress;
}

// Resetear progreso completamente
function resetearProgreso() {
    if (confirm('¿Estás seguro de resetear el progreso?')) {
        localStorage.removeItem('mazeGameProgress');
        console.log('🔄 Progreso reseteado');
        console.log('🔄 Recarga la página para ver los cambios');
    }
}

// Desbloquear nivel específico
function desbloquearNivel(levelId) {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress')) || {
        unlockedLevels: [1],
        completedLevels: [],
        lastPlayedLevel: null
    };
    
    if (!progress.unlockedLevels.includes(levelId)) {
        progress.unlockedLevels.push(levelId);
        progress.unlockedLevels.sort((a, b) => a - b);
        progress.updatedAt = new Date().toISOString();
        localStorage.setItem('mazeGameProgress', JSON.stringify(progress));
        console.log(`🔓 Nivel ${levelId} desbloqueado`);
        console.log('🔄 Recarga la página para ver los cambios');
    } else {
        console.log(`ℹ️ Nivel ${levelId} ya estaba desbloqueado`);
    }
    return progress;
}

// Completar nivel (marca como completado y desbloquea el siguiente)
function completarNivel(levelId) {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress')) || {
        unlockedLevels: [1],
        completedLevels: [],
        lastPlayedLevel: null
    };
    
    if (!progress.completedLevels.includes(levelId)) {
        progress.completedLevels.push(levelId);
        progress.completedLevels.sort((a, b) => a - b);
    }
    
    const nextLevel = levelId + 1;
    if (nextLevel <= 6 && !progress.unlockedLevels.includes(nextLevel)) {
        progress.unlockedLevels.push(nextLevel);
        progress.unlockedLevels.sort((a, b) => a - b);
        console.log(`🔓 Nivel ${nextLevel} desbloqueado automáticamente`);
    }
    
    progress.lastPlayedLevel = levelId;
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem('mazeGameProgress', JSON.stringify(progress));
    console.log(`✅ Nivel ${levelId} completado`);
    console.log('🔄 Recarga la página para ver los cambios');
    return progress;
}

// Exportar progreso (para backup)
function exportarProgreso() {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress'));
    const backup = JSON.stringify(progress, null, 2);
    console.log('📋 Copia este JSON para hacer backup:');
    console.log(backup);
    return backup;
}

// Importar progreso (desde backup)
function importarProgreso(jsonString) {
    try {
        const progress = JSON.parse(jsonString);
        if (progress.unlockedLevels && progress.completedLevels) {
            localStorage.setItem('mazeGameProgress', JSON.stringify(progress));
            console.log('✅ Progreso importado exitosamente');
            console.log('🔄 Recarga la página para ver los cambios');
            return true;
        } else {
            console.error('❌ Formato de progreso inválido');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al importar:', error);
        return false;
    }
}

// Ver estadísticas
function verEstadisticas() {
    const progress = JSON.parse(localStorage.getItem('mazeGameProgress'));
    if (!progress) {
        console.log('⚠️ No hay progreso guardado');
        return null;
    }
    
    const stats = {
        'Niveles desbloqueados': progress.unlockedLevels.length,
        'Niveles completados': progress.completedLevels.length,
        'Último nivel jugado': progress.lastPlayedLevel,
        'Fecha de creación': progress.createdAt,
        'Última actualización': progress.updatedAt
    };
    
    console.table(stats);
    console.log('📋 Niveles desbloqueados:', progress.unlockedLevels);
    console.log('✅ Niveles completados:', progress.completedLevels);
    return stats;
}

// Simular progreso de prueba
function simularProgresoPrueba() {
    console.log('🧪 Simulando progreso de prueba...');
    
    // Resetear
    localStorage.removeItem('mazeGameProgress');
    
    // Crear progreso de ejemplo
    const testProgress = {
        unlockedLevels: [1, 2, 3],
        completedLevels: [1, 2],
        lastPlayedLevel: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('mazeGameProgress', JSON.stringify(testProgress));
    console.log('✅ Progreso de prueba creado:');
    console.log('   - Niveles 1 y 2 completados');
    console.log('   - Nivel 3 desbloqueado pero no completado');
    console.log('🔄 Recarga la página para ver los cambios');
    return testProgress;
}

// Mostrar ayuda
function ayudaProgreso() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           COMANDOS DE TESTING - SISTEMA DE PROGRESO        ║
╚════════════════════════════════════════════════════════════╝

📊 CONSULTAS:
  verProgreso()              - Ver el progreso actual guardado
  verEstadisticas()          - Ver estadísticas en formato tabla

🔓 MODIFICAR PROGRESO:
  desbloquearNivel(N)        - Desbloquear nivel N (1-6)
  completarNivel(N)          - Completar nivel N y desbloquear el siguiente
  desbloquearTodos()         - Desbloquear todos los niveles
  resetearProgreso()         - Borrar todo el progreso

💾 BACKUP/RESTORE:
  exportarProgreso()         - Exportar progreso como JSON
  importarProgreso(json)     - Importar progreso desde JSON

🧪 TESTING:
  simularProgresoPrueba()    - Crear progreso de ejemplo para testing

📖 AYUDA:
  ayudaProgreso()            - Mostrar esta ayuda

NOTA: Después de modificar el progreso, recarga la página para ver los cambios.
    `);
}

// Mostrar ayuda automáticamente
console.log('🎮 Sistema de Progreso - Comandos de Testing cargados');
console.log('💡 Ejecuta ayudaProgreso() para ver todos los comandos disponibles');

// Exportar funciones al scope global para uso en consola
if (typeof window !== 'undefined') {
    window.testProgreso = {
        ver: verProgreso,
        stats: verEstadisticas,
        desbloquear: desbloquearNivel,
        completar: completarNivel,
        desbloquearTodos,
        resetear: resetearProgreso,
        exportar: exportarProgreso,
        importar: importarProgreso,
        simular: simularProgresoPrueba,
        ayuda: ayudaProgreso
    };
    
    console.log('✅ También puedes usar: testProgreso.ver(), testProgreso.stats(), etc.');
}
