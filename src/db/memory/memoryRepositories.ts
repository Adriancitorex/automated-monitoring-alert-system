/**
 * REPOSITORIOS EN MEMORIA (MODO DEMO / DESARROLLO SIN DATABASE_URL)
 * 
 * Implementa la misma interfaz que PostgreSQL con comprobación de integridad referencial,
 * deduplicación estricta y atomicidad de transacciones.
 */

import {
  IUsuarioRepository,
  IVehiculoRepository,
  ISuscripcionRepository,
  IInfraccionRepository,
  IRevisionRepository,
  INotificacionRepository,
  IAuditoriaRepository,
  UsuarioEntity,
  VehiculoEntity,
  SuscripcionEntity,
  RevisionEntity,
  NotificacionEntity,
  OnboardingParams,
  OnboardingResult
} from '../../domain/repositories/interfaces';
import { InfraccionCanonica } from '../../domain/types';
import { EventoAuditoria } from '../../domain/audit/auditTypes';
import { DeduplicationEngine } from '../../domain/deduplication/deduplicator';
import { seedDemoData } from '../seeds/demoSeed';

export class MemoryStore {
  usuarios: UsuarioEntity[] = [];
  vehiculos: VehiculoEntity[] = [];
  suscripciones: SuscripcionEntity[] = [];
  infracciones: InfraccionCanonica[] = [];
  revisiones: RevisionEntity[] = [];
  notificaciones: NotificacionEntity[] = [];
  auditorias: EventoAuditoria[] = [];

  clonar(): MemoryStore {
    const clone = new MemoryStore();
    clone.usuarios = JSON.parse(JSON.stringify(this.usuarios));
    clone.vehiculos = JSON.parse(JSON.stringify(this.vehiculos));
    clone.suscripciones = JSON.parse(JSON.stringify(this.suscripciones));
    clone.infracciones = JSON.parse(JSON.stringify(this.infracciones));
    clone.revisiones = JSON.parse(JSON.stringify(this.revisiones));
    clone.notificaciones = JSON.parse(JSON.stringify(this.notificaciones));
    clone.auditorias = JSON.parse(JSON.stringify(this.auditorias));
    return clone;
  }

  restaurarDesde(origen: MemoryStore) {
    this.usuarios = origen.usuarios;
    this.vehiculos = origen.vehiculos;
    this.suscripciones = origen.suscripciones;
    this.infracciones = origen.infracciones;
    this.revisiones = origen.revisiones;
    this.notificaciones = origen.notificaciones;
    this.auditorias = origen.auditorias;
  }

  limpiar() {
    this.usuarios = [];
    this.vehiculos = [];
    this.suscripciones = [];
    this.infracciones = [];
    this.revisiones = [];
    this.notificaciones = [];
    this.auditorias = [];
  }
}

export const defaultMemoryStore = new MemoryStore();

// 1. USUARIOS EN MEMORIA
export class MemoryUsuarioRepository implements IUsuarioRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(usuario: Omit<UsuarioEntity, 'id' | 'creadoEn'> & { id?: string }): Promise<UsuarioEntity> {
    const emailNorm = usuario.email.trim().toLowerCase();
    const yaExiste = this.store.usuarios.some((u) => u.email.toLowerCase() === emailNorm);
    if (yaExiste) {
      throw new Error(`El usuario con email ${emailNorm} ya existe.`);
    }

    const nuevo: UsuarioEntity = {
      id: usuario.id || `usr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      nombre: usuario.nombre.trim(),
      email: emailNorm,
      telefonoWhatsApp: usuario.telefonoWhatsApp.trim(),
      creadoEn: new Date().toISOString()
    };
    this.store.usuarios.push(nuevo);
    return nuevo;
  }

  async obtenerPorId(id: string): Promise<UsuarioEntity | null> {
    return this.store.usuarios.find((u) => u.id === id) || null;
  }

  async obtenerPorEmail(email: string): Promise<UsuarioEntity | null> {
    const emailNorm = email.trim().toLowerCase();
    return this.store.usuarios.find((u) => u.email.toLowerCase() === emailNorm) || null;
  }

  async obtenerPorTelefono(telefono: string): Promise<UsuarioEntity | null> {
    const telNorm = telefono.trim();
    return this.store.usuarios.find((u) => u.telefonoWhatsApp === telNorm) || null;
  }

  async listarTodos(): Promise<UsuarioEntity[]> {
    return [...this.store.usuarios];
  }
}

// 2. VEHÍCULOS EN MEMORIA
export class MemoryVehiculoRepository implements IVehiculoRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(vehiculo: Omit<VehiculoEntity, 'id' | 'creadoEn' | 'totalMultasRegistradas' | 'estadoSuscripcion' | 'plan'> & { id?: string; estadoSuscripcion?: VehiculoEntity['estadoSuscripcion']; plan?: VehiculoEntity['plan'] }): Promise<VehiculoEntity> {
    // Comprobar integridad referencial: el usuario debe existir
    const usuarioExiste = this.store.usuarios.some((u) => u.id === vehiculo.usuarioId);
    if (!usuarioExiste) {
      throw new Error(`Foreign Key Violation: El usuarioId '${vehiculo.usuarioId}' no existe.`);
    }

    const placaNorm = vehiculo.placa.trim().toUpperCase();
    const yaExiste = this.store.vehiculos.some((v) => v.placa === placaNorm);
    if (yaExiste) {
      throw new Error(`La placa ${placaNorm} ya se encuentra registrada en el sistema.`);
    }

    const nuevo: VehiculoEntity = {
      id: vehiculo.id || `veh-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      usuarioId: vehiculo.usuarioId,
      placa: placaNorm,
      numeroSerie5: vehiculo.numeroSerie5.trim(),
      alias: vehiculo.alias?.trim() || `Vehículo ${placaNorm}`,
      estadoSuscripcion: vehiculo.estadoSuscripcion || 'PENDIENTE_PAGO',
      plan: vehiculo.plan || 'MENSUAL_BASICO',
      montoPlanMxn: Number(vehiculo.montoPlanMxn.toFixed(2)),
      ultimaRevisionEn: vehiculo.ultimaRevisionEn,
      proximaRevisionEstimadaEn: vehiculo.proximaRevisionEstimadaEn,
      totalMultasRegistradas: 0,
      creadoEn: new Date().toISOString()
    };
    this.store.vehiculos.push(nuevo);
    return nuevo;
  }

  async obtenerPorId(id: string): Promise<VehiculoEntity | null> {
    return this.store.vehiculos.find((v) => v.id === id) || null;
  }

  async obtenerPorPlaca(placa: string): Promise<VehiculoEntity | null> {
    const placaNorm = placa.trim().toUpperCase();
    return this.store.vehiculos.find((v) => v.placa === placaNorm) || null;
  }

  async listarPorUsuarioId(usuarioId: string): Promise<VehiculoEntity[]> {
    return this.store.vehiculos.filter((v) => v.usuarioId === usuarioId);
  }

  async listarTodos(): Promise<VehiculoEntity[]> {
    return [...this.store.vehiculos];
  }

  async actualizarRevision(id: string, ultimaRevisionEn: string, proximaEstimadaEn: string): Promise<void> {
    const vehiculo = this.store.vehiculos.find((v) => v.id === id);
    if (vehiculo) {
      vehiculo.ultimaRevisionEn = ultimaRevisionEn;
      vehiculo.proximaRevisionEstimadaEn = proximaEstimadaEn;
    }
  }

  async incrementarTotalMultas(id: string): Promise<void> {
    const vehiculo = this.store.vehiculos.find((v) => v.id === id);
    if (vehiculo) {
      vehiculo.totalMultasRegistradas += 1;
    }
  }

  async actualizarEstadoSuscripcion(id: string, estado: VehiculoEntity['estadoSuscripcion']): Promise<void> {
    const vehiculo = this.store.vehiculos.find((v) => v.id === id);
    if (vehiculo) {
      vehiculo.estadoSuscripcion = estado;
    }
  }
}

// 3. SUSCRIPCIONES EN MEMORIA
export class MemorySuscripcionRepository implements ISuscripcionRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(suscripcion: Omit<SuscripcionEntity, 'id' | 'creadoEn' | 'actualizadoEn'> & { id?: string }): Promise<SuscripcionEntity> {
    // Comprobar integridad referencial
    const usuarioExiste = this.store.usuarios.some((u) => u.id === suscripcion.usuarioId);
    if (!usuarioExiste) {
      throw new Error(`Foreign Key Violation: El usuarioId '${suscripcion.usuarioId}' no existe.`);
    }

    const vehiculoExiste = this.store.vehiculos.some((v) => v.id === suscripcion.vehiculoId);
    if (!vehiculoExiste) {
      throw new Error(`Foreign Key Violation: El vehiculoId '${suscripcion.vehiculoId}' no existe.`);
    }

    const ahora = new Date().toISOString();
    const nueva: SuscripcionEntity = {
      id: suscripcion.id || `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      usuarioId: suscripcion.usuarioId,
      vehiculoId: suscripcion.vehiculoId,
      plan: suscripcion.plan,
      montoMxn: Number(suscripcion.montoMxn.toFixed(2)),
      estado: suscripcion.estado || 'PENDIENTE_PAGO',
      periodoInicio: suscripcion.periodoInicio,
      periodoFin: suscripcion.periodoFin,
      pasarelaPagoId: suscripcion.pasarelaPagoId,
      creadoEn: ahora,
      actualizadoEn: ahora
    };
    this.store.suscripciones.push(nueva);
    return nueva;
  }

  async obtenerPorId(id: string): Promise<SuscripcionEntity | null> {
    return this.store.suscripciones.find((s) => s.id === id) || null;
  }

  async obtenerPorVehiculoId(vehiculoId: string): Promise<SuscripcionEntity | null> {
    return this.store.suscripciones.find((s) => s.vehiculoId === vehiculoId) || null;
  }

  async actualizarEstado(id: string, estado: SuscripcionEntity['estado']): Promise<void> {
    const s = this.store.suscripciones.find((sub) => sub.id === id);
    if (s) {
      s.estado = estado;
      s.actualizadoEn = new Date().toISOString();
    }
  }

  async listarTodas(): Promise<SuscripcionEntity[]> {
    return [...this.store.suscripciones];
  }
}

// 4. INFRACCIONES EN MEMORIA
export class MemoryInfraccionRepository implements IInfraccionRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(infraccion: InfraccionCanonica): Promise<InfraccionCanonica> {
    // Comprobar integridad referencial
    const vehiculoExiste = this.store.vehiculos.some((v) => v.id === infraccion.vehiculoId);
    if (!vehiculoExiste) {
      throw new Error(`Foreign Key Violation: El vehiculoId '${infraccion.vehiculoId}' no existe.`);
    }

    // Deduplicación estricta
    const check = DeduplicationEngine.detectarDuplicado(
      {
        vehiculoId: infraccion.vehiculoId,
        fuenteIdentificador: infraccion.fuenteIdentificador,
        identificadorExterno: infraccion.identificadorExterno,
        fechaInfraccion: infraccion.fechaInfraccion,
        concepto: infraccion.concepto
      },
      this.store.infracciones
    );

    if (check.esDuplicado) {
      throw new Error(`Restricción de unicidad violada: ${check.motivo}`);
    }

    const nueva: InfraccionCanonica = {
      ...infraccion,
      placa: infraccion.placa.trim().toUpperCase(),
      montoOriginalMxn: Number(infraccion.montoOriginalMxn.toFixed(2)),
      montoVigenteMxn: Number(infraccion.montoVigenteMxn.toFixed(2)),
      recargosMxn: Number((infraccion.recargosMxn || 0).toFixed(2)),
      gastosEjecucionMxn: Number((infraccion.gastosEjecucionMxn || 0).toFixed(2)),
      descuentoVigenteMxn: Number((infraccion.descuentoVigenteMxn || 0).toFixed(2)),
      porcentajeDescuento: Number((infraccion.porcentajeDescuento || 0).toFixed(2)),
      hashAuxiliar:
        infraccion.hashAuxiliar ||
        DeduplicationEngine.generarHashIdentificador(
          infraccion.vehiculoId,
          infraccion.fuenteIdentificador,
          infraccion.identificadorExterno
        )
    };

    this.store.infracciones.unshift(nueva);
    return nueva;
  }

  async obtenerPorId(idInterno: string): Promise<InfraccionCanonica | null> {
    return this.store.infracciones.find((i) => i.idInterno === idInterno) || null;
  }

  async obtenerPorIdentificador(
    vehiculoId: string,
    fuenteIdentificador: string,
    identificadorExterno: string
  ): Promise<InfraccionCanonica | null> {
    return (
      this.store.infracciones.find(
        (i) =>
          i.vehiculoId === vehiculoId &&
          i.fuenteIdentificador.toUpperCase() === fuenteIdentificador.toUpperCase() &&
          i.identificadorExterno.toUpperCase() === identificadorExterno.toUpperCase()
      ) || null
    );
  }

  async obtenerPorHechoMaterial(
    vehiculoId: string,
    fechaInfraccion: string,
    concepto: string
  ): Promise<InfraccionCanonica | null> {
    const hash = DeduplicationEngine.generarHashHechoMaterial(vehiculoId, fechaInfraccion, concepto);
    return (
      this.store.infracciones.find((i) => {
        const hashExistente = DeduplicationEngine.generarHashHechoMaterial(i.vehiculoId, i.fechaInfraccion, i.concepto);
        return hashExistente === hash;
      }) || null
    );
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<InfraccionCanonica[]> {
    return this.store.infracciones.filter((i) => i.vehiculoId === vehiculoId);
  }

  async listarPorPlaca(placa: string): Promise<InfraccionCanonica[]> {
    const placaNorm = placa.trim().toUpperCase();
    return this.store.infracciones.filter((i) => i.placa === placaNorm);
  }

  async listarTodas(): Promise<InfraccionCanonica[]> {
    return [...this.store.infracciones];
  }
}

// 5. REVISIONES EN MEMORIA
export class MemoryRevisionRepository implements IRevisionRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(revision: Omit<RevisionEntity, 'id' | 'fechaRevision'> & { id?: string; fechaRevision?: string }): Promise<RevisionEntity> {
    const nueva: RevisionEntity = {
      id: revision.id || `rev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      vehiculoId: revision.vehiculoId,
      placa: revision.placa.trim().toUpperCase(),
      resultado: revision.resultado,
      observaciones: revision.observaciones,
      fechaRevision: revision.fechaRevision || new Date().toISOString()
    };
    this.store.revisiones.unshift(nueva);
    return nueva;
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<RevisionEntity[]> {
    return this.store.revisiones.filter((r) => r.vehiculoId === vehiculoId);
  }

  async listarRecientes(limite = 50): Promise<RevisionEntity[]> {
    return this.store.revisiones.slice(0, limite);
  }
}

// 6. NOTIFICACIONES EN MEMORIA
export class MemoryNotificacionRepository implements INotificacionRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async crear(notificacion: Omit<NotificacionEntity, 'id' | 'enviadoEn'> & { id?: string; enviadoEn?: string }): Promise<NotificacionEntity> {
    const nueva: NotificacionEntity = {
      id: notificacion.id || `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      infraccionId: notificacion.infraccionId,
      vehiculoId: notificacion.vehiculoId,
      placa: notificacion.placa.trim().toUpperCase(),
      telefonoDestino: notificacion.telefonoDestino.trim(),
      canal: notificacion.canal || 'WHATSAPP',
      mensaje: notificacion.mensaje,
      estado: notificacion.estado || 'PENDIENTE',
      proveedorMsgId: notificacion.proveedorMsgId,
      enviadoEn: notificacion.enviadoEn || new Date().toISOString()
    };
    this.store.notificaciones.unshift(nueva);
    return nueva;
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<NotificacionEntity[]> {
    return this.store.notificaciones.filter((n) => n.vehiculoId === vehiculoId);
  }

  async listarTodas(): Promise<NotificacionEntity[]> {
    return [...this.store.notificaciones];
  }
}

// 7. AUDITORÍA EN MEMORIA
export class MemoryAuditoriaRepository implements IAuditoriaRepository {
  constructor(private store: MemoryStore = defaultMemoryStore) {}

  async registrar(evento: Omit<EventoAuditoria, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<EventoAuditoria> {
    const nuevo: EventoAuditoria = {
      id: evento.id || `aud-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tipo: evento.tipo,
      entidadId: evento.entidadId,
      usuarioId: evento.usuarioId,
      vehiculoId: evento.vehiculoId,
      ipOrigen: evento.ipOrigen,
      detalles: evento.detalles || {},
      timestamp: evento.timestamp || new Date().toISOString()
    };
    this.store.auditorias.unshift(nuevo);
    return nuevo;
  }

  async listarRecientes(limite = 50): Promise<EventoAuditoria[]> {
    return this.store.auditorias.slice(0, limite);
  }
}

// 8. ONBOARDING TRANSACCIONAL ATÓMICO EN MEMORIA (CON ROLLBACK EN FALLO)
export async function ejecutarOnboardingTransaccionalMemoria(
  params: OnboardingParams,
  store: MemoryStore = defaultMemoryStore
): Promise<OnboardingResult> {
  const snapshot = store.clonar();

  try {
    const userRepo = new MemoryUsuarioRepository(store);
    const vehiculoRepo = new MemoryVehiculoRepository(store);
    const suscripcionRepo = new MemorySuscripcionRepository(store);
    const revisionRepo = new MemoryRevisionRepository(store);
    const auditoriaRepo = new MemoryAuditoriaRepository(store);

    const placaLimpia = params.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const vehiculoExistente = await vehiculoRepo.obtenerPorPlaca(placaLimpia);
    if (vehiculoExistente) {
      throw new Error(`La placa ${placaLimpia} ya se encuentra registrada en el sistema.`);
    }

    let usuario = await userRepo.obtenerPorEmail(params.email);
    if (!usuario) {
      usuario = await userRepo.crear({
        nombre: params.nombre,
        email: params.email,
        telefonoWhatsApp: params.telefonoWhatsApp
      });
    }

    const montoPlan = params.plan === 'ANUAL_AHORRO' ? 990.00 : 99.00;
    const vehiculo = await vehiculoRepo.crear({
      usuarioId: usuario.id,
      placa: placaLimpia,
      numeroSerie5: params.numeroSerie5.trim(),
      alias: params.alias?.trim() || `Vehículo ${placaLimpia}`,
      estadoSuscripcion: 'PENDIENTE_PAGO',
      plan: params.plan || 'MENSUAL_BASICO',
      montoPlanMxn: montoPlan
    });

    const suscripcion = await suscripcionRepo.crear({
      usuarioId: usuario.id,
      vehiculoId: vehiculo.id,
      plan: params.plan || 'MENSUAL_BASICO',
      montoMxn: montoPlan,
      estado: 'PENDIENTE_PAGO',
      periodoInicio: new Date().toISOString()
    });

    const revisionInicial = await revisionRepo.crear({
      vehiculoId: vehiculo.id,
      placa: vehiculo.placa,
      resultado: 'SIN_INFRACCIONES',
      observaciones: 'Vehículo registrado en modo demostración. Suscripción inicial en estado PENDIENTE_PAGO.'
    });

    const auditoria = await auditoriaRepo.registrar({
      tipo: 'USUARIO_CREADO',
      entidadId: vehiculo.id,
      usuarioId: usuario.id,
      vehiculoId: vehiculo.id,
      ipOrigen: params.ipOrigen,
      detalles: {
        accion: 'ONBOARDING_TRANSACCIONAL_MEMORIA_COMPLETADO',
        placa: vehiculo.placa,
        plan: suscripcion.plan,
        monto: suscripcion.montoMxn,
        suscripcionId: suscripcion.id
      }
    });

    return {
      usuario,
      vehiculo,
      suscripcion,
      revisionInicial,
      auditoriaId: auditoria.id
    };
  } catch (err) {
    // Rollback atómico: revertir todo el estado al snapshot previo
    store.restaurarDesde(snapshot);
    throw err;
  }
}

// 9. ELIMINACIÓN DE VEHÍCULO EN MEMORIA
export function eliminarVehiculoPorPlacaMemoria(placa: string, store: MemoryStore = defaultMemoryStore): boolean {
  const placaNorm = placa.trim().toUpperCase();
  const vIndex = store.vehiculos.findIndex((v) => v.placa === placaNorm);
  if (vIndex === -1) return false;
  const vehiculo = store.vehiculos[vIndex];
  const vehiculoId = vehiculo.id;
  const usuarioId = vehiculo.usuarioId;

  store.vehiculos.splice(vIndex, 1);
  store.suscripciones = store.suscripciones.filter((s) => s.vehiculoId !== vehiculoId);
  store.infracciones = store.infracciones.filter((i) => i.vehiculoId !== vehiculoId);
  store.revisiones = store.revisiones.filter((r) => r.vehiculoId !== vehiculoId);
  store.notificaciones = store.notificaciones.filter((n) => n.vehiculoId !== vehiculoId);
  store.auditorias = store.auditorias.filter((a) => a.vehiculoId !== vehiculoId);

  const tieneOtros = store.vehiculos.some((v) => v.usuarioId === usuarioId);
  if (!tieneOtros) {
    store.usuarios = store.usuarios.filter((u) => u.id !== usuarioId);
    store.auditorias = store.auditorias.filter((a) => a.usuarioId !== usuarioId);
  }
  return true;
}

// 10. REINICIO DE DATOS EN MEMORIA
export function reiniciarDatosMemoria(store: MemoryStore = defaultMemoryStore): void {
  store.limpiar();
  seedDemoData(store);
}

