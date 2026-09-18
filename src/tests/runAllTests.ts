import { ejecutarTestsMemoria } from './memoryRepositories.test';
import { ejecutarTestsPostgres } from './postgresIntegration.test';

async function main() {
  console.log('[test] Iniciando suite de validación');

  const resultadoMemoria = await ejecutarTestsMemoria();
  const resultadoPostgres = await ejecutarTestsPostgres();

  console.log('\n[test] Reporte consolidado');
  console.log(`- Tests unitarios (memoria): ${resultadoMemoria.pasados} pasados, ${resultadoMemoria.fallados} fallados`);

  if (resultadoPostgres.omitido) {
    console.log(`- Tests integración (PostgreSQL): OMITIDO (${resultadoPostgres.motivoOmision})`);
  } else {
    console.log(`- Tests integración (PostgreSQL): ${resultadoPostgres.pasados} pasados, ${resultadoPostgres.fallados} fallados`);
  }

  if (resultadoMemoria.fallados > 0 || (!resultadoPostgres.omitido && resultadoPostgres.fallados > 0)) {
    console.error('\nFallo: uno o más tests no superaron la validación.');
    process.exit(1);
  } else {
    console.log('\nValidación completada exitosamente.');
  }
}

main().catch((err) => {
  console.error('Error fatal al ejecutar los tests:', err);
  process.exit(1);
});
