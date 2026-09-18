/**
 * FÁBRICA DE REPOSITORIOS (PRODUCCIÓN POSTGRESQL VS DEMO MEMORIA)
 * 
 * Comportamiento estricto:
 * 1. Sin DATABASE_URL:
 *    -> Modo DEMO_MEMORY.
 * 2. Con DATABASE_URL:
 *    -> Modo POSTGRESQL.
 * 
 * REGLA DE ORO DE INFRAESTRUCTURA:
 * Si DATABASE_URL está configurada pero PostgreSQL falla o no está disponible,
 * QUEDA PROHIBIDO HACER FALLBACK SILENCIOSO A MEMORIA.
 * Debe arrojar error explícito de infraestructura (POSTGRESQL_UNAVAILABLE).
 */

import { AppRepositories, OnboardingParams, OnboardingResult } from '../domain/repositories/interfaces';
import {
  PostgresUsuarioRepository,
  PostgresVehiculoRepository,
  PostgresSuscripcionRepository,
  PostgresInfraccionRepository,
  PostgresRevisionRepository,
  PostgresNotificacionRepository,
  PostgresAuditoriaRepository,
  ejecutarOnboardingTransaccionalPostgres,
  eliminarVehiculoPorPlacaPostgres,
  reiniciarDatosPostgres
} from './postgres/postgresRepositories';
import {
  defaultMemoryStore,
  MemoryUsuarioRepository,
  MemoryVehiculoRepository,
  MemorySuscripcionRepository,
  MemoryInfraccionRepository,
  MemoryRevisionRepository,
  MemoryNotificacionRepository,
  MemoryAuditoriaRepository,
  ejecutarOnboardingTransaccionalMemoria,
  eliminarVehiculoPorPlacaMemoria,
  reiniciarDatosMemoria
} from './memory/memoryRepositories';
import { checkPostgresHealth, getPostgresConfig } from './postgres/pool';
import { seedDemoData } from './seeds/demoSeed';

let singletonRepos: AppRepositories | null = null;

export async function obtenerEstadoConexion(): Promise<{
  estado: 'POSTGRESQL_CONNECTED' | 'POSTGRESQL_UNAVAILABLE' | 'DEMO_MEMORY';
  detalles: string;
  error?: string;
}> {
  const { tieneConfiguracion } = getPostgresConfig();

  if (!tieneConfiguracion) {
    return {
      estado: 'DEMO_MEMORY',
      detalles: 'DATABASE_URL no configurada. Operando en memoria volátil para pruebas locales.'
    };
  }

  const health = await checkPostgresHealth();
  if (health.conectado) {
    return {
      estado: 'POSTGRESQL_CONNECTED',
      detalles: `PostgreSQL verificado con SELECT 1 (latencia: ${health.latenciaMs}ms)`
    };
  } else {
    return {
      estado: 'POSTGRESQL_UNAVAILABLE',
      detalles: 'DATABASE_URL configurada pero PostgreSQL no responde o rechazó la conexión. Fallback a memoria BLOQUEADO.',
      error: health.error
    };
  }
}

export async function inicializarRepositorios(): Promise<AppRepositories> {
  const { tieneConfiguracion } = getPostgresConfig();

  if (!tieneConfiguracion) {
    // 1. MODO DEMO / MEMORIA
    seedDemoData(defaultMemoryStore);

    singletonRepos = {
      modo: 'DEMO_MEMORY',
      usuarios: new MemoryUsuarioRepository(defaultMemoryStore),
      vehiculos: new MemoryVehiculoRepository(defaultMemoryStore),
      suscripciones: new MemorySuscripcionRepository(defaultMemoryStore),
      infracciones: new MemoryInfraccionRepository(defaultMemoryStore),
      revisiones: new MemoryRevisionRepository(defaultMemoryStore),
      notificaciones: new MemoryNotificacionRepository(defaultMemoryStore),
      auditoria: new MemoryAuditoriaRepository(defaultMemoryStore),
      ejecutarOnboardingTransaccional: async (params: OnboardingParams): Promise<OnboardingResult> => {
        return ejecutarOnboardingTransaccionalMemoria(params, defaultMemoryStore);
      },
      eliminarVehiculoPorPlaca: async (placa: string): Promise<boolean> => {
        return eliminarVehiculoPorPlacaMemoria(placa, defaultMemoryStore);
      },
      reiniciarDatosDemo: async (): Promise<void> => {
        reiniciarDatosMemoria(defaultMemoryStore);
      },
      comprobarSalud: async () => ({
        estado: 'DEMO_MEMORY',
        detalles: 'Operando con almacenamiento en memoria volátil.'
      })
    };

    return singletonRepos;
  }

  // 2. MODO PRODUCCIÓN POSTGRESQL
  const health = await checkPostgresHealth();

  if (!health.conectado) {
    const mensajeError = `ERROR DE INFRAESTRUCTURA CRÍTICO: DATABASE_URL está configurada pero la conexión falló: ${health.error}. Prohibido fallback silencioso a memoria.`;
    console.error(mensajeError);

    // Creamos un adaptador que arroja error si se intenta cualquier operación
    const failFastRepo: any = new Proxy({}, {
      get() {
        return () => {
          throw new Error('POSTGRESQL_UNAVAILABLE: Base de datos configurada no disponible. Operación abortada.');
        };
      }
    });

    singletonRepos = {
      modo: 'POSTGRESQL',
      usuarios: failFastRepo,
      vehiculos: failFastRepo,
      suscripciones: failFastRepo,
      infracciones: failFastRepo,
      revisiones: failFastRepo,
      notificaciones: failFastRepo,
      auditoria: failFastRepo,
      ejecutarOnboardingTransaccional: async () => {
        throw new Error('POSTGRESQL_UNAVAILABLE: No se puede registrar vehículos mientras PostgreSQL no esté disponible.');
      },
      eliminarVehiculoPorPlaca: async () => {
        throw new Error('POSTGRESQL_UNAVAILABLE: No se puede eliminar vehículos mientras PostgreSQL no esté disponible.');
      },
      reiniciarDatosDemo: async () => {
        throw new Error('POSTGRESQL_UNAVAILABLE: No se pueden reiniciar datos mientras PostgreSQL no esté disponible.');
      },
      comprobarSalud: async () => ({
        estado: 'POSTGRESQL_UNAVAILABLE',
        detalles: `Fallo de conexión: ${health.error}`
      })
    };

    return singletonRepos;
  }

  singletonRepos = {
    modo: 'POSTGRESQL',
    usuarios: new PostgresUsuarioRepository(),
    vehiculos: new PostgresVehiculoRepository(),
    suscripciones: new PostgresSuscripcionRepository(),
    infracciones: new PostgresInfraccionRepository(),
    revisiones: new PostgresRevisionRepository(),
    notificaciones: new PostgresNotificacionRepository(),
    auditoria: new PostgresAuditoriaRepository(),
    ejecutarOnboardingTransaccional: async (params: OnboardingParams): Promise<OnboardingResult> => {
      return ejecutarOnboardingTransaccionalPostgres(params);
    },
    eliminarVehiculoPorPlaca: async (placa: string): Promise<boolean> => {
      return eliminarVehiculoPorPlacaPostgres(placa);
    },
    reiniciarDatosDemo: async (): Promise<void> => {
      return reiniciarDatosPostgres();
    },
    comprobarSalud: async () => {
      const h = await checkPostgresHealth();
      return {
        estado: h.conectado ? 'POSTGRESQL_CONNECTED' : 'POSTGRESQL_UNAVAILABLE',
        detalles: h.conectado ? `SELECT 1 exitoso (${h.latenciaMs}ms)` : (h.error || 'Error desconocido')
      };
    }
  };

  return singletonRepos;
}

export async function getRepositories(): Promise<AppRepositories> {
  if (!singletonRepos) {
    return inicializarRepositorios();
  }
  return singletonRepos;
}
