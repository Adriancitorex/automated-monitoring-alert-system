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
import { verificarSaludPostgres, obtenerConfiguracionPostgres } from './postgres/pool';
import { seedDemoData } from './seeds/demoSeed';

let singletonRepos: AppRepositories | null = null;

export async function obtenerEstadoConexion(): Promise<{
  estado: 'POSTGRESQL_CONNECTED' | 'POSTGRESQL_UNAVAILABLE' | 'DEMO_MEMORY';
  detalles: string;
  error?: string;
}> {
  const { tieneConfiguracion } = obtenerConfiguracionPostgres();

  if (!tieneConfiguracion) {
    return {
      estado: 'DEMO_MEMORY',
      detalles: 'DATABASE_URL no configurada. Operando en memoria volátil.'
    };
  }

  const health = await verificarSaludPostgres();
  if (health.conectado) {
    return {
      estado: 'POSTGRESQL_CONNECTED',
      detalles: `PostgreSQL verificado con SELECT 1 (${health.latenciaMs}ms)`
    };
  }

  return {
    estado: 'POSTGRESQL_UNAVAILABLE',
    detalles: 'DATABASE_URL configurada pero PostgreSQL no responde. Fallback a memoria bloqueado por consistencia.',
    error: health.error
  };
}

export async function inicializarRepositorios(): Promise<AppRepositories> {
  const { tieneConfiguracion } = obtenerConfiguracionPostgres();

  if (!tieneConfiguracion) {
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
        detalles: 'Almacenamiento en memoria volátil.'
      })
    };

    return singletonRepos;
  }

  const health = await verificarSaludPostgres();

  if (!health.conectado) {
    console.error(`Fallo de conexión a base de datos configurada: ${health.error}`);

    // Falla rápida para impedir corrupción de datos ante indisponibilidad de base de datos
    const failFastRepo: any = new Proxy({}, {
      get() {
        return () => {
          throw new Error('POSTGRESQL_UNAVAILABLE: Base de datos configurada no disponible.');
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
        throw new Error('POSTGRESQL_UNAVAILABLE: Operación suspendida por indisponibilidad de base de datos.');
      },
      eliminarVehiculoPorPlaca: async () => {
        throw new Error('POSTGRESQL_UNAVAILABLE: Operación suspendida por indisponibilidad de base de datos.');
      },
      reiniciarDatosDemo: async () => {
        throw new Error('POSTGRESQL_UNAVAILABLE: Operación suspendida por indisponibilidad de base de datos.');
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
      const h = await verificarSaludPostgres();
      return {
        estado: h.conectado ? 'POSTGRESQL_CONNECTED' : 'POSTGRESQL_UNAVAILABLE',
        detalles: h.conectado ? `SELECT 1 exitoso (${h.latenciaMs}ms)` : (h.error || 'Error desconocido')
      };
    }
  };

  return singletonRepos;
}

export async function obtenerRepositorios(): Promise<AppRepositories> {
  if (!singletonRepos) {
    return inicializarRepositorios();
  }
  return singletonRepos;
}

// Alias para compatibilidad
export const getRepositories = obtenerRepositorios;
