/**
 * SCRIPT DE MIGRACIÓN - AVISAMULTAS JALISCO
 * 
 * Ejecuta src/db/schema.sql en la base de datos PostgreSQL apuntada por DATABASE_URL.
 * Uso: npx tsx src/db/migrate.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initPool, closePool, checkPostgresHealth } from './postgres/pool';

dotenv.config();

async function runMigrations() {
  console.log('--- AVISAMULTAS JALISCO: EJECUCIÓN DE MIGRACIONES ---');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('❌ ERROR: DATABASE_URL no está configurada. No se pueden ejecutar migraciones.');
    process.exit(1);
  }

  const health = await checkPostgresHealth();
  if (!health.conectado) {
    console.error(`❌ ERROR: No se pudo conectar a PostgreSQL: ${health.error}`);
    process.exit(1);
  }

  console.log(`✅ Conexión establecida con PostgreSQL (${health.latenciaMs}ms). Leyendo schema.sql...`);

  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const pool = initPool();
  const client = await pool.connect();

  try {
    console.log('Iniciando ejecución de sentencias DDL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migraciones aplicadas con éxito.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando migraciones. Transacción revertida:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

// Ejecución directa si se invoca como script
if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations().catch((err) => {
    console.error('Fallo no controlado en migración:', err);
    process.exit(1);
  });
}

export { runMigrations };
