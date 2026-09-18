import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { inicializarPool, cerrarPool, verificarSaludPostgres } from './postgres/pool';

dotenv.config();

async function ejecutarMigraciones() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('[migracion] Error: DATABASE_URL no configurada.');
    process.exit(1);
  }

  const health = await verificarSaludPostgres();
  if (!health.conectado) {
    console.error(`[migracion] Error de conexión: ${health.error}`);
    process.exit(1);
  }

  console.log(`[migracion] Conexión establecida (${health.latenciaMs}ms). Aplicando schema.sql...`);

  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const pool = inicializarPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[migracion] Esquema aplicado exitosamente.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`[migracion] Error en sentencias DDL. Transacción revertida: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
    await cerrarPool();
  }
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  ejecutarMigraciones().catch((err) => {
    console.error('[migracion] Fallo no controlado:', err);
    process.exit(1);
  });
}

export { ejecutarMigraciones };
export const runMigrations = ejecutarMigraciones;
