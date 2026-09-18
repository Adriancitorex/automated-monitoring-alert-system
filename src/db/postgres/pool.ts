import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function obtenerConfiguracionPostgres() {
  const databaseUrl = process.env.DATABASE_URL;
  return {
    databaseUrl: databaseUrl?.trim() || null,
    tieneConfiguracion: Boolean(databaseUrl && databaseUrl.trim().length > 0)
  };
}

export function inicializarPool(): Pool {
  if (pool) return pool;

  const { databaseUrl, tieneConfiguracion } = obtenerConfiguracionPostgres();

  if (!tieneConfiguracion || !databaseUrl) {
    throw new Error('DATABASE_URL no configurada en el entorno');
  }

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
    console.error('Error imprevisto en cliente inactivo del pool:', err.message);
  });

  return pool;
}

export async function cerrarPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function verificarSaludPostgres(): Promise<{ conectado: boolean; latenciaMs?: number; error?: string }> {
  const { tieneConfiguracion } = obtenerConfiguracionPostgres();
  if (!tieneConfiguracion) {
    return { conectado: false, error: 'DATABASE_URL_NOT_SET' };
  }

  const p = inicializarPool();
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

export async function ejecutarConsulta<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
  const p = inicializarPool();
  return p.query<R>(text, params);
}

export async function ejecutarEnTransaccion<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = inicializarPool();
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

// Aliases para compatibilidad
export const getPostgresConfig = obtenerConfiguracionPostgres;
export const initPool = inicializarPool;
export const closePool = cerrarPool;
export const checkPostgresHealth = verificarSaludPostgres;
export const query = ejecutarConsulta;
export const withTransaction = ejecutarEnTransaccion;

