/**
 * EJECUTOR GENERAL DE TESTS - AVISAMULTAS JALISCO
 * 
 * Ejecuta:
 * 1. Suite de repositorios en memoria (unitarios).
 * 2. Suite de integración en PostgreSQL (si DATABASE_URL existe; si no, OMITIDO).
 */

import { runMemoryTests } from './memoryRepositories.test';
import { runPostgresIntegrationTests } from './postgresIntegration.test';

async function main() {
  console.log('====================================================');
  console.log('  AVISAMULTAS JALISCO: SUITE DE VALIDACIÓN');
  console.log('====================================================');

  const resultadoMemoria = await runMemoryTests();
  const resultadoPostgres = await runPostgresIntegrationTests();

  console.log('\n====================================================');
  console.log('  REPORTE FINAL CONSOLIDADO');
  console.log('====================================================');
  console.log(`- Tests Unitarios (Memoria): ${resultadoMemoria.pasados} pasados, ${resultadoMemoria.fallados} fallados`);
  
  if (resultadoPostgres.omitido) {
    console.log(`- Tests Integración (PostgreSQL): ⚠️  OMITIDO (${resultadoPostgres.motivoOmision})`);
  } else {
    console.log(`- Tests Integración (PostgreSQL): ${resultadoPostgres.pasados} pasados, ${resultadoPostgres.fallados} fallados`);
  }

  if (resultadoMemoria.fallados > 0 || (!resultadoPostgres.omitido && resultadoPostgres.fallados > 0)) {
    console.error('\n❌ Uno o más tests fallaron.');
    process.exit(1);
  } else {
    console.log('\n✅ Validación completada exitosamente.');
  }
}

main().catch((err) => {
  console.error('Error fatal al ejecutar los tests:', err);
  process.exit(1);
});
