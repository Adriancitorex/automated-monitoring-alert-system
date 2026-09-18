/**
 * INTERFACES DE REPOSITORIOS Y PERSISTENCIA - AVISAMULTAS JALISCO
 * 
 * Contratos agnósticos de base de datos para asegurar el desacoplamiento
 * entre la lógica de negocio y los motores de almacenamiento (PostgreSQL / Memoria).
 */

import { InfraccionCanonica } from '../types';
import { EventoAuditoria } from '../audit/auditTypes';

export interface UsuarioEntity {
  id: string;
  nombre: string;
  email: string;
  telefonoWhatsApp: string;
  creadoEn: string;
}

export interface VehiculoEntity {
  id: string;
  usuarioId: string;
  placa: string;
  numeroSerie5: string;
  alias?: string;
  estadoSuscripcion: 'PENDIENTE_PAGO' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  plan: 'MENSUAL_BASICO' | 'ANUAL_AHORRO';
  montoPlanMxn: number;
  ultimaRevisionEn?: string;
  proximaRevisionEstimadaEn?: string;
  totalMultasRegistradas: number;
  creadoEn: string;
}

export interface SuscripcionEntity {
  id: string;
  usuarioId: string;
  vehiculoId: string;
  plan: 'MENSUAL_BASICO' | 'ANUAL_AHORRO';
  montoMxn: number;
  estado: 'PENDIENTE_PAGO' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  periodoInicio: string;
  periodoFin?: string;
  pasarelaPagoId?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface RevisionEntity {
  id: string;
  vehiculoId: string;
  placa: string;
  resultado: 'SIN_INFRACCIONES' | 'NUEVA_INFRACCION_REGISTRADA' | 'ERROR_CONSULTA';
  observaciones: string;
  fechaRevision: string;
}

export interface NotificacionEntity {
  id: string;
  infraccionId?: string;
  vehiculoId: string;
  placa: string;
  telefonoDestino: string;
  canal: 'WHATSAPP' | 'EMAIL' | 'SMS';
  mensaje: string;
  estado: 'ENVIADO' | 'FALLIDO' | 'PENDIENTE';
  proveedorMsgId?: string;
  enviadoEn: string;
}

export interface OnboardingParams {
  nombre: string;
  email: string;
  telefonoWhatsApp: string;
  placa: string;
  numeroSerie5: string;
  alias?: string;
  plan?: 'MENSUAL_BASICO' | 'ANUAL_AHORRO';
  ipOrigen?: string;
}

export interface OnboardingResult {
  usuario: UsuarioEntity;
  vehiculo: VehiculoEntity;
  suscripcion: SuscripcionEntity;
  revisionInicial: RevisionEntity;
  auditoriaId: string;
}

// Repositorios individuales

export interface IUsuarioRepository {
  crear(usuario: Omit<UsuarioEntity, 'id' | 'creadoEn'> & { id?: string }): Promise<UsuarioEntity>;
  obtenerPorId(id: string): Promise<UsuarioEntity | null>;
  obtenerPorEmail(email: string): Promise<UsuarioEntity | null>;
  obtenerPorTelefono(telefono: string): Promise<UsuarioEntity | null>;
  listarTodos(): Promise<UsuarioEntity[]>;
}

export interface IVehiculoRepository {
  crear(vehiculo: Omit<VehiculoEntity, 'id' | 'creadoEn' | 'totalMultasRegistradas' | 'estadoSuscripcion' | 'plan'> & { id?: string; estadoSuscripcion?: VehiculoEntity['estadoSuscripcion']; plan?: VehiculoEntity['plan'] }): Promise<VehiculoEntity>;
  obtenerPorId(id: string): Promise<VehiculoEntity | null>;
  obtenerPorPlaca(placa: string): Promise<VehiculoEntity | null>;
  listarPorUsuarioId(usuarioId: string): Promise<VehiculoEntity[]>;
  listarTodos(): Promise<VehiculoEntity[]>;
  actualizarRevision(id: string, ultimaRevisionEn: string, proximaEstimadaEn: string): Promise<void>;
  incrementarTotalMultas(id: string): Promise<void>;
  actualizarEstadoSuscripcion(id: string, estado: VehiculoEntity['estadoSuscripcion']): Promise<void>;
}

export interface ISuscripcionRepository {
  crear(suscripcion: Omit<SuscripcionEntity, 'id' | 'creadoEn' | 'actualizadoEn'> & { id?: string }): Promise<SuscripcionEntity>;
  obtenerPorId(id: string): Promise<SuscripcionEntity | null>;
  obtenerPorVehiculoId(vehiculoId: string): Promise<SuscripcionEntity | null>;
  actualizarEstado(id: string, estado: SuscripcionEntity['estado']): Promise<void>;
  listarTodas(): Promise<SuscripcionEntity[]>;
}

export interface IInfraccionRepository {
  crear(infraccion: InfraccionCanonica): Promise<InfraccionCanonica>;
  obtenerPorId(idInterno: string): Promise<InfraccionCanonica | null>;
  obtenerPorIdentificador(vehiculoId: string, fuenteIdentificador: string, identificadorExterno: string): Promise<InfraccionCanonica | null>;
  obtenerPorHechoMaterial(vehiculoId: string, fechaInfraccion: string, concepto: string): Promise<InfraccionCanonica | null>;
  listarPorVehiculoId(vehiculoId: string): Promise<InfraccionCanonica[]>;
  listarPorPlaca(placa: string): Promise<InfraccionCanonica[]>;
  listarTodas(): Promise<InfraccionCanonica[]>;
}

export interface IRevisionRepository {
  crear(revision: Omit<RevisionEntity, 'id' | 'fechaRevision'> & { id?: string; fechaRevision?: string }): Promise<RevisionEntity>;
  listarPorVehiculoId(vehiculoId: string): Promise<RevisionEntity[]>;
  listarRecientes(limite?: number): Promise<RevisionEntity[]>;
}

export interface INotificacionRepository {
  crear(notificacion: Omit<NotificacionEntity, 'id' | 'enviadoEn'> & { id?: string; enviadoEn?: string }): Promise<NotificacionEntity>;
  listarPorVehiculoId(vehiculoId: string): Promise<NotificacionEntity[]>;
  listarTodas(): Promise<NotificacionEntity[]>;
}

export interface IAuditoriaRepository {
  registrar(evento: Omit<EventoAuditoria, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<EventoAuditoria>;
  listarRecientes(limite?: number): Promise<EventoAuditoria[]>;
}

export interface AppRepositories {
  modo: 'DEMO_MEMORY' | 'POSTGRESQL';
  usuarios: IUsuarioRepository;
  vehiculos: IVehiculoRepository;
  suscripciones: ISuscripcionRepository;
  infracciones: IInfraccionRepository;
  revisiones: IRevisionRepository;
  notificaciones: INotificacionRepository;
  auditoria: IAuditoriaRepository;
  
  /**
   * Ejecuta onboarding dentro de una transacción atómica única.
   * Si cualquier paso falla, revierte todo para evitar huérfanos.
   */
  ejecutarOnboardingTransaccional(params: OnboardingParams): Promise<OnboardingResult>;
  
  /**
   * Elimina un vehículo y sus dependencias (suscripciones, revisiones, infracciones, notificaciones)
   * respetando la integridad referencial y limpiando el usuario si no posee más vehículos.
   */
  eliminarVehiculoPorPlaca(placa: string): Promise<boolean>;

  /**
   * Reinicia los datos (en PostgreSQL limpia tablas dentro de transacción; en Memoria restablece los datos demo).
   */
  reiniciarDatosDemo(): Promise<void>;

  /**
   * Comprobación explícita de salud (SELECT 1 en Postgres)
   */
  comprobarSalud(): Promise<{
    estado: 'POSTGRESQL_CONNECTED' | 'POSTGRESQL_UNAVAILABLE' | 'DEMO_MEMORY';
    detalles?: string;
  }>;
}
