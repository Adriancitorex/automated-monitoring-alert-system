/**
 * POOL DE CONEXIONES POSTGRESQL - AVISAMULTAS JALISCO
 * 
 * Gestiona el ciclo de vida del Pool de node-postgres (pg).
 * Incluye comprobación explícita con `SELECT 1` y soporte de transacciones seguras.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPostgresConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  return {
    databaseUrl: databaseUrl?.trim() || null,
    tieneConfiguracion: Boolean(databaseUrl && databaseUrl.trim().length > 0)
  };
}

export function initPool(): Pool {
  if (pool) return pool;

  const { databaseUrl, tieneConfiguracion } = getPostgresConfig();

  if (!tieneConfiguracion || !databaseUrl) {
    throw new Error('No se puede inicializar el pool de PostgreSQL: DATABASE_URL no está configurada en el entorno.');
  }

  // Configuración dinámica de SSL para bases de datos administradas (Supabase, Neon, AWS RDS, Cloud SQL, etc.)
  let sslConfig: any = undefined;
  const sslExplicit = process.env.DATABASE_SSL?.toLowerCase().trim();
  const urlHasSsl = databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true');

  if (sslExplicit === 'false' || sslExplicit === '0' || databaseUrl.includes('sslmode=disable')) {
    sslConfig = undefined;
  } else if (sslExplicit === 'true' || sslExplicit === '1' || urlHasSsl || process.env.NODE_ENV === 'production') {
    const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';
    sslConfig = { rejectUnauthorized };
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: sslConfig
  });

  pool.on('error', (err) => {
    console.error('Error imprevisto en cliente inactivo del pool de PostgreSQL:', err.message);
  });

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Comprobación explícita de salud ejecutando SELECT 1
 */
export async function checkPostgresHealth(): Promise<{ conectado: boolean; latenciaMs?: number; error?: string }> {
  const { tieneConfiguracion } = getPostgresConfig();
  if (!tieneConfiguracion) {
    return { conectado: false, error: 'DATABASE_URL_NOT_SET' };
  }

  const p = initPool();
  const inicio = Date.now();
  try {
    const client = await p.connect();
    try {
      await client.query('SELECT 1 AS health_check');
      const latenciaMs = Date.now() - inicio;
      return { conectado: true, latenciaMs };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { conectado: false, error: err.message || 'Error al conectar con PostgreSQL' };
  }
}

/**
 * Ejecuta una consulta individual usando el pool
 */
export async function query<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
  const p = initPool();
  return p.query<R>(text, params);
}

/**
 * Ejecuta una función dentro de una transacción atómica PostgreSQL (BEGIN ... COMMIT / ROLLBACK)
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = initPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error durante ROLLBACK:', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}
