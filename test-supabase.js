/**
 * Script de prueba para verificar la conexión con Supabase
 * Ejecutar con: npm run test-supabase
 */

import { testConnection, testRankingSystem } from './utils/supabaseClient.js';

console.log('🚀 Iniciando prueba de conexión con Supabase...\n');

// Probar conexión básica
const connected = await testConnection();

if (connected) {
    console.log('\n🔄 Conexión establecida. Probando sistema completo...\n');
    await testRankingSystem();
} else {
    console.log('\n❌ No se pudo conectar. Verifica tus credenciales.\n');
}
