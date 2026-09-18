/**
 * IMPLEMENTACIÓN DE REPOSITORIOS EN POSTGRESQL - AVISAMULTAS JALISCO
 * 
 * Cumple con:
 * - Foreign Keys con ON DELETE RESTRICT
 * - Precisión monetaria NUMERIC
 * - Deduplicación estricta multivariada (namespace + folio y hecho material)
 * - Soporte transaccional atómico para onboarding (cero huérfanos)
 */

import { PoolClient } from 'pg';
import crypto from 'crypto';
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
import { query, withTransaction } from './pool';
import { DeduplicationEngine } from '../../domain/deduplication/deduplicator';

// 1. USUARIOS
export class PostgresUsuarioRepository implements IUsuarioRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  async crear(usuario: Omit<UsuarioEntity, 'id' | 'creadoEn'> & { id?: string }): Promise<UsuarioEntity> {
    const id = usuario.id || `usr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const res = await this.run(
      `INSERT INTO usuarios (id, nombre, email, telefono_whatsapp, creado_en)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, nombre, email, telefono_whatsapp AS "telefonoWhatsApp", creado_en AS "creadoEn"`,
      [id, usuario.nombre.trim(), usuario.email.trim().toLowerCase(), usuario.telefonoWhatsApp.trim()]
    );
    return res.rows[0];
  }

  async obtenerPorId(id: string): Promise<UsuarioEntity | null> {
    const res = await this.run(
      `SELECT id, nombre, email, telefono_whatsapp AS "telefonoWhatsApp", creado_en AS "creadoEn"
       FROM usuarios WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async obtenerPorEmail(email: string): Promise<UsuarioEntity | null> {
    const res = await this.run(
      `SELECT id, nombre, email, telefono_whatsapp AS "telefonoWhatsApp", creado_en AS "creadoEn"
       FROM usuarios WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    return res.rows[0] || null;
  }

  async obtenerPorTelefono(telefono: string): Promise<UsuarioEntity | null> {
    const res = await this.run(
      `SELECT id, nombre, email, telefono_whatsapp AS "telefonoWhatsApp", creado_en AS "creadoEn"
       FROM usuarios WHERE telefono_whatsapp = $1`,
      [telefono.trim()]
    );
    return res.rows[0] || null;
  }

  async listarTodos(): Promise<UsuarioEntity[]> {
    const res = await this.run(
      `SELECT id, nombre, email, telefono_whatsapp AS "telefonoWhatsApp", creado_en AS "creadoEn"
       FROM usuarios ORDER BY creado_en DESC`
    );
    return res.rows;
  }
}

// 2. VEHÍCULOS
export class PostgresVehiculoRepository implements IVehiculoRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  private mapRow(row: any): VehiculoEntity {
    return {
      id: row.id,
      usuarioId: row.usuario_id || row.usuarioId,
      placa: row.placa,
      numeroSerie5: row.numero_serie_5 || row.numeroSerie5,
      alias: row.alias || undefined,
      estadoSuscripcion: row.estado_suscripcion || row.estadoSuscripcion,
      plan: row.plan,
      montoPlanMxn: Number(row.monto_plan_mxn || row.montoPlanMxn),
      ultimaRevisionEn: row.ultima_revision_en ? new Date(row.ultima_revision_en).toISOString() : undefined,
      proximaRevisionEstimadaEn: row.proxima_revision_estimada_en ? new Date(row.proxima_revision_estimada_en).toISOString() : undefined,
      totalMultasRegistradas: Number(row.total_multas_registradas ?? row.totalMultasRegistradas ?? 0),
      creadoEn: new Date(row.creado_en || row.creadoEn).toISOString()
    };
  }

  async crear(vehiculo: Omit<VehiculoEntity, 'id' | 'creadoEn' | 'totalMultasRegistradas' | 'estadoSuscripcion' | 'plan'> & { id?: string; estadoSuscripcion?: VehiculoEntity['estadoSuscripcion']; plan?: VehiculoEntity['plan'] }): Promise<VehiculoEntity> {
    const id = vehiculo.id || `veh-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const res = await this.run(
      `INSERT INTO vehiculos (id, usuario_id, placa, numero_serie_5, alias, estado_suscripcion, plan, monto_plan_mxn, total_multas_registradas, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NOW())
       RETURNING *`,
      [
        id,
        vehiculo.usuarioId,
        vehiculo.placa.trim().toUpperCase(),
        vehiculo.numeroSerie5.trim(),
        vehiculo.alias?.trim() || null,
        vehiculo.estadoSuscripcion || 'PENDIENTE_PAGO',
        vehiculo.plan || 'MENSUAL_BASICO',
        vehiculo.montoPlanMxn.toFixed(2)
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async obtenerPorId(id: string): Promise<VehiculoEntity | null> {
    const res = await this.run(`SELECT * FROM vehiculos WHERE id = $1`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async obtenerPorPlaca(placa: string): Promise<VehiculoEntity | null> {
    const res = await this.run(`SELECT * FROM vehiculos WHERE placa = $1`, [placa.trim().toUpperCase()]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async listarPorUsuarioId(usuarioId: string): Promise<VehiculoEntity[]> {
    const res = await this.run(`SELECT * FROM vehiculos WHERE usuario_id = $1 ORDER BY creado_en DESC`, [usuarioId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async listarTodos(): Promise<VehiculoEntity[]> {
    const res = await this.run(`SELECT * FROM vehiculos ORDER BY creado_en DESC`);
    return res.rows.map((r) => this.mapRow(r));
  }

  async actualizarRevision(id: string, ultimaRevisionEn: string, proximaEstimadaEn: string): Promise<void> {
    await this.run(
      `UPDATE vehiculos
       SET ultima_revision_en = $2, proxima_revision_estimada_en = $3
       WHERE id = $1`,
      [id, ultimaRevisionEn, proximaEstimadaEn]
    );
  }

  async incrementarTotalMultas(id: string): Promise<void> {
    await this.run(
      `UPDATE vehiculos
       SET total_multas_registradas = total_multas_registradas + 1
       WHERE id = $1`,
      [id]
    );
  }

  async actualizarEstadoSuscripcion(id: string, estado: VehiculoEntity['estadoSuscripcion']): Promise<void> {
    await this.run(
      `UPDATE vehiculos
       SET estado_suscripcion = $2
       WHERE id = $1`,
      [id, estado]
    );
  }
}

// 3. SUSCRIPCIONES
export class PostgresSuscripcionRepository implements ISuscripcionRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  private mapRow(row: any): SuscripcionEntity {
    return {
      id: row.id,
      usuarioId: row.usuario_id || row.usuarioId,
      vehiculoId: row.vehiculo_id || row.vehiculoId,
      plan: row.plan,
      montoMxn: Number(row.monto_mxn || row.montoMxn),
      estado: row.estado,
      periodoInicio: new Date(row.periodo_inicio || row.periodoInicio).toISOString(),
      periodoFin: row.periodo_fin ? new Date(row.periodo_fin).toISOString() : undefined,
      pasarelaPagoId: row.pasarela_pago_id || undefined,
      creadoEn: new Date(row.creado_en || row.creadoEn).toISOString(),
      actualizadoEn: new Date(row.actualizado_en || row.actualizadoEn).toISOString()
    };
  }

  async crear(suscripcion: Omit<SuscripcionEntity, 'id' | 'creadoEn' | 'actualizadoEn'> & { id?: string }): Promise<SuscripcionEntity> {
    const id = suscripcion.id || `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const res = await this.run(
      `INSERT INTO suscripciones (id, usuario_id, vehiculo_id, plan, monto_mxn, estado, periodo_inicio, periodo_fin, pasarela_pago_id, creado_en, actualizado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        id,
        suscripcion.usuarioId,
        suscripcion.vehiculoId,
        suscripcion.plan,
        suscripcion.montoMxn.toFixed(2),
        suscripcion.estado || 'PENDIENTE_PAGO',
        suscripcion.periodoInicio,
        suscripcion.periodoFin || null,
        suscripcion.pasarelaPagoId || null
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async obtenerPorId(id: string): Promise<SuscripcionEntity | null> {
    const res = await this.run(`SELECT * FROM suscripciones WHERE id = $1`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async obtenerPorVehiculoId(vehiculoId: string): Promise<SuscripcionEntity | null> {
    const res = await this.run(`SELECT * FROM suscripciones WHERE vehiculo_id = $1 ORDER BY creado_en DESC LIMIT 1`, [vehiculoId]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async actualizarEstado(id: string, estado: SuscripcionEntity['estado']): Promise<void> {
    await this.run(
      `UPDATE suscripciones
       SET estado = $2, actualizado_en = NOW()
       WHERE id = $1`,
      [id, estado]
    );
  }

  async listarTodas(): Promise<SuscripcionEntity[]> {
    const res = await this.run(`SELECT * FROM suscripciones ORDER BY creado_en DESC`);
    return res.rows.map((r) => this.mapRow(r));
  }
}

// 4. INFRACCIONES
export class PostgresInfraccionRepository implements IInfraccionRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  private mapRow(row: any): InfraccionCanonica {
    return {
      idInterno: row.id_interno,
      vehiculoId: row.vehiculo_id,
      placa: row.placa,
      identificadorExterno: row.identificador_externo,
      fuenteIdentificador: row.fuente_identificador,
      fechaInfraccion: typeof row.fecha_infraccion === 'string' ? row.fecha_infraccion : row.fecha_infraccion.toISOString().split('T')[0],
      fechaNotificacion: row.fecha_notificacion ? (typeof row.fecha_notificacion === 'string' ? row.fecha_notificacion : row.fecha_notificacion.toISOString().split('T')[0]) : undefined,
      fechaConsulta: new Date(row.fecha_consulta).toISOString(),
      concepto: row.concepto,
      tipoInfraccion: row.tipo_infraccion,
      autoridad: row.autoridad,
      montoOriginalMxn: Number(row.monto_original_mxn),
      montoVigenteMxn: Number(row.monto_vigente_mxn),
      recargosMxn: Number(row.recargos_mxn || 0),
      gastosEjecucionMxn: Number(row.gastos_ejecucion_mxn || 0),
      descuentoVigenteMxn: Number(row.descuento_vigente_mxn || 0),
      porcentajeDescuento: Number(row.porcentaje_descuento || 0),
      fechaLimiteDescuento: row.fecha_limite_descuento ? (typeof row.fecha_limite_descuento === 'string' ? row.fecha_limite_descuento : row.fecha_limite_descuento.toISOString().split('T')[0]) : undefined,
      nivelConfianzaDescuento: row.nivel_confianza_descuento,
      reglaDescuentoAplicada: row.regla_descuento_aplicada || undefined,
      urlOficialPago: row.url_oficial_pago || undefined,
      fuenteDato: row.fuente_dato,
      hashAuxiliar: row.hash_auxiliar
    };
  }

  async crear(infraccion: InfraccionCanonica): Promise<InfraccionCanonica> {
    const hashAuxiliar =
      infraccion.hashAuxiliar ||
      DeduplicationEngine.generarHashIdentificador(
        infraccion.vehiculoId,
        infraccion.fuenteIdentificador,
        infraccion.identificadorExterno
      );

    const res = await this.run(
      `INSERT INTO infracciones (
        id_interno, vehiculo_id, placa, identificador_externo, fuente_identificador,
        fecha_infraccion, fecha_notificacion, fecha_consulta, concepto, tipo_infraccion,
        autoridad, monto_original_mxn, monto_vigente_mxn, recargos_mxn, gastos_ejecucion_mxn,
        descuento_vigente_mxn, porcentaje_descuento, fecha_limite_descuento, nivel_confianza_descuento,
        regla_descuento_aplicada, url_oficial_pago, fuente_dato, hash_auxiliar, creado_en
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, NOW()
      ) RETURNING *`,
      [
        infraccion.idInterno,
        infraccion.vehiculoId,
        infraccion.placa.trim().toUpperCase(),
        infraccion.identificadorExterno.trim(),
        infraccion.fuenteIdentificador.trim().toUpperCase(),
        infraccion.fechaInfraccion,
        infraccion.fechaNotificacion || null,
        infraccion.fechaConsulta || new Date().toISOString(),
        infraccion.concepto.trim(),
        infraccion.tipoInfraccion,
        infraccion.autoridad,
        infraccion.montoOriginalMxn.toFixed(2),
        infraccion.montoVigenteMxn.toFixed(2),
        (infraccion.recargosMxn || 0).toFixed(2),
        (infraccion.gastosEjecucionMxn || 0).toFixed(2),
        (infraccion.descuentoVigenteMxn || 0).toFixed(2),
        (infraccion.porcentajeDescuento || 0).toFixed(2),
        infraccion.fechaLimiteDescuento || null,
        infraccion.nivelConfianzaDescuento || 'UNKNOWN',
        infraccion.reglaDescuentoAplicada || null,
        infraccion.urlOficialPago || null,
        infraccion.fuenteDato || 'MANUAL',
        hashAuxiliar
      ]
    );

    return this.mapRow(res.rows[0]);
  }

  async obtenerPorId(idInterno: string): Promise<InfraccionCanonica | null> {
    const res = await this.run(`SELECT * FROM infracciones WHERE id_interno = $1`, [idInterno]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async obtenerPorIdentificador(
    vehiculoId: string,
    fuenteIdentificador: string,
    identificadorExterno: string
  ): Promise<InfraccionCanonica | null> {
    const res = await this.run(
      `SELECT * FROM infracciones
       WHERE vehiculo_id = $1 AND UPPER(fuente_identificador) = UPPER($2) AND UPPER(identificador_externo) = UPPER($3)`,
      [vehiculoId, fuenteIdentificador, identificadorExterno]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async obtenerPorHechoMaterial(
    vehiculoId: string,
    fechaInfraccion: string,
    concepto: string
  ): Promise<InfraccionCanonica | null> {
    const res = await this.run(
      `SELECT * FROM infracciones
       WHERE vehiculo_id = $1 AND fecha_infraccion = $2`,
      [vehiculoId, fechaInfraccion]
    );

    const hashBuscado = DeduplicationEngine.generarHashHechoMaterial(vehiculoId, fechaInfraccion, concepto);

    for (const row of res.rows) {
      const canonica = this.mapRow(row);
      const hashExistente = DeduplicationEngine.generarHashHechoMaterial(canonica.vehiculoId, canonica.fechaInfraccion, canonica.concepto);
      if (hashExistente === hashBuscado) {
        return canonica;
      }
    }

    return null;
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<InfraccionCanonica[]> {
    const res = await this.run(`SELECT * FROM infracciones WHERE vehiculo_id = $1 ORDER BY fecha_infraccion DESC`, [vehiculoId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async listarPorPlaca(placa: string): Promise<InfraccionCanonica[]> {
    const res = await this.run(`SELECT * FROM infracciones WHERE placa = $1 ORDER BY fecha_infraccion DESC`, [placa.trim().toUpperCase()]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async listarTodas(): Promise<InfraccionCanonica[]> {
    const res = await this.run(`SELECT * FROM infracciones ORDER BY fecha_infraccion DESC`);
    return res.rows.map((r) => this.mapRow(r));
  }
}

// 5. REVISIONES
export class PostgresRevisionRepository implements IRevisionRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  private mapRow(row: any): RevisionEntity {
    return {
      id: row.id,
      vehiculoId: row.vehiculo_id || row.vehiculoId,
      placa: row.placa,
      resultado: row.resultado,
      observaciones: row.observaciones,
      fechaRevision: new Date(row.fecha_revision || row.fechaRevision).toISOString()
    };
  }

  async crear(revision: Omit<RevisionEntity, 'id' | 'fechaRevision'> & { id?: string; fechaRevision?: string }): Promise<RevisionEntity> {
    const id = revision.id || `rev-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fecha = revision.fechaRevision || new Date().toISOString();
    const res = await this.run(
      `INSERT INTO revisiones (id, vehiculo_id, placa, resultado, observaciones, fecha_revision)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, revision.vehiculoId, revision.placa.trim().toUpperCase(), revision.resultado, revision.observaciones, fecha]
    );
    return this.mapRow(res.rows[0]);
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<RevisionEntity[]> {
    const res = await this.run(`SELECT * FROM revisiones WHERE vehiculo_id = $1 ORDER BY fecha_revision DESC`, [vehiculoId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async listarRecientes(limite = 50): Promise<RevisionEntity[]> {
    const res = await this.run(`SELECT * FROM revisiones ORDER BY fecha_revision DESC LIMIT $1`, [limite]);
    return res.rows.map((r) => this.mapRow(r));
  }
}

// 6. NOTIFICACIONES
export class PostgresNotificacionRepository implements INotificacionRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  private mapRow(row: any): NotificacionEntity {
    return {
      id: row.id,
      infraccionId: row.infraccion_id || undefined,
      vehiculoId: row.vehiculo_id,
      placa: row.placa,
      telefonoDestino: row.telefono_destino,
      canal: row.canal,
      mensaje: row.mensaje,
      estado: row.estado,
      proveedorMsgId: row.proveedor_msg_id || undefined,
      enviadoEn: new Date(row.enviado_en).toISOString()
    };
  }

  async crear(notificacion: Omit<NotificacionEntity, 'id' | 'enviadoEn'> & { id?: string; enviadoEn?: string }): Promise<NotificacionEntity> {
    const id = notificacion.id || `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const enviadoEn = notificacion.enviadoEn || new Date().toISOString();
    const res = await this.run(
      `INSERT INTO notificaciones (id, infraccion_id, vehiculo_id, placa, telefono_destino, canal, mensaje, estado, proveedor_msg_id, enviado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        notificacion.infraccionId || null,
        notificacion.vehiculoId,
        notificacion.placa.trim().toUpperCase(),
        notificacion.telefonoDestino.trim(),
        notificacion.canal || 'WHATSAPP',
        notificacion.mensaje,
        notificacion.estado || 'PENDIENTE',
        notificacion.proveedorMsgId || null,
        enviadoEn
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  async listarPorVehiculoId(vehiculoId: string): Promise<NotificacionEntity[]> {
    const res = await this.run(`SELECT * FROM notificaciones WHERE vehiculo_id = $1 ORDER BY enviado_en DESC`, [vehiculoId]);
    return res.rows.map((r) => this.mapRow(r));
  }

  async listarTodas(): Promise<NotificacionEntity[]> {
    const res = await this.run(`SELECT * FROM notificaciones ORDER BY enviado_en DESC`);
    return res.rows.map((r) => this.mapRow(r));
  }
}

// 7. AUDITORÍA
export class PostgresAuditoriaRepository implements IAuditoriaRepository {
  constructor(private client?: PoolClient) {}

  private async run(text: string, params?: any[]) {
    return this.client ? this.client.query(text, params) : query(text, params);
  }

  async registrar(evento: Omit<EventoAuditoria, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<EventoAuditoria> {
    const id = evento.id || `aud-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const ts = evento.timestamp || new Date().toISOString();
    const res = await this.run(
      `INSERT INTO auditoria (id, tipo, entidad_id, usuario_id, vehiculo_id, ip_origen, detalles, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tipo, entidad_id AS "entidadId", usuario_id AS "usuarioId", vehiculo_id AS "vehiculoId", ip_origen AS "ipOrigen", detalles, timestamp`,
      [
        id,
        evento.tipo,
        evento.entidadId || null,
        evento.usuarioId || null,
        evento.vehiculoId || null,
        evento.ipOrigen || null,
        JSON.stringify(evento.detalles || {}),
        ts
      ]
    );
    return {
      ...res.rows[0],
      timestamp: new Date(res.rows[0].timestamp).toISOString()
    };
  }

  async listarRecientes(limite = 50): Promise<EventoAuditoria[]> {
    const res = await this.run(
      `SELECT id, tipo, entidad_id AS "entidadId", usuario_id AS "usuarioId", vehiculo_id AS "vehiculoId", ip_origen AS "ipOrigen", detalles, timestamp
       FROM auditoria ORDER BY timestamp DESC LIMIT $1`,
      [limite]
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
}

// 8. ONBOARDING TRANSACCIONAL ATÓMICO EN POSTGRESQL
export async function ejecutarOnboardingTransaccionalPostgres(params: OnboardingParams): Promise<OnboardingResult> {
  return withTransaction(async (client) => {
    const userRepo = new PostgresUsuarioRepository(client);
    const vehiculoRepo = new PostgresVehiculoRepository(client);
    const suscripcionRepo = new PostgresSuscripcionRepository(client);
    const revisionRepo = new PostgresRevisionRepository(client);
    const auditoriaRepo = new PostgresAuditoriaRepository(client);

    const placaLimpia = params.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Validar placa duplicada
    const vehiculoExistente = await vehiculoRepo.obtenerPorPlaca(placaLimpia);
    if (vehiculoExistente) {
      throw new Error(`La placa ${placaLimpia} ya se encuentra registrada en el sistema.`);
    }

    // 2. Obtener o crear usuario
    let usuario = await userRepo.obtenerPorEmail(params.email);
    if (!usuario) {
      usuario = await userRepo.crear({
        nombre: params.nombre,
        email: params.email,
        telefonoWhatsApp: params.telefonoWhatsApp
      });
    }

    // 3. Crear vehículo vinculado al usuario
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

    // 4. Crear suscripción en estado PENDIENTE_PAGO vinculada a usuario y vehículo
    const suscripcion = await suscripcionRepo.crear({
      usuarioId: usuario.id,
      vehiculoId: vehiculo.id,
      plan: params.plan || 'MENSUAL_BASICO',
      montoMxn: montoPlan,
      estado: 'PENDIENTE_PAGO',
      periodoInicio: new Date().toISOString()
    });

    // 5. Registrar revisión inicial
    const revisionInicial = await revisionRepo.crear({
      vehiculoId: vehiculo.id,
      placa: vehiculo.placa,
      resultado: 'SIN_INFRACCIONES',
      observaciones: 'Vehículo registrado. Suscripción inicial en estado PENDIENTE_PAGO.'
    });

    // 6. Registrar evento de auditoría
    const auditoria = await auditoriaRepo.registrar({
      tipo: 'USUARIO_CREADO',
      entidadId: vehiculo.id,
      usuarioId: usuario.id,
      vehiculoId: vehiculo.id,
      ipOrigen: params.ipOrigen,
      detalles: {
        accion: 'ONBOARDING_TRANSACCIONAL_COMPLETADO',
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
  });
}

// 9. ELIMINACIÓN SEGURA TRANSACCIONAL DE VEHÍCULO
export async function eliminarVehiculoPorPlacaPostgres(placa: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const placaLimpia = placa.trim().toUpperCase();
    const vehiculoRes = await client.query('SELECT id, usuario_id FROM vehiculos WHERE placa = $1', [placaLimpia]);
    if (vehiculoRes.rows.length === 0) {
      return false;
    }
    const vehiculoId = vehiculoRes.rows[0].id;
    const usuarioId = vehiculoRes.rows[0].usuario_id;

    // Registrar en auditoría antes de eliminar
    await client.query(
      `INSERT INTO auditoria (id, tipo, entidad_id, usuario_id, vehiculo_id, detalles, timestamp)
       VALUES ($1, 'VEHICULO_ELIMINADO', $2, $3, $2, $4, NOW())`,
      [
        `aud-del-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        vehiculoId,
        usuarioId,
        JSON.stringify({ accion: 'ELIMINACION_ADMINISTRATIVA', placa: placaLimpia })
      ]
    );

    // Eliminar dependencias respetando claves foráneas ON DELETE RESTRICT
    await client.query('DELETE FROM notificaciones WHERE vehiculo_id = $1', [vehiculoId]);
    await client.query('DELETE FROM revisiones WHERE vehiculo_id = $1', [vehiculoId]);
    await client.query('DELETE FROM infracciones WHERE vehiculo_id = $1', [vehiculoId]);
    await client.query('DELETE FROM suscripciones WHERE vehiculo_id = $1', [vehiculoId]);
    await client.query('DELETE FROM auditoria WHERE vehiculo_id = $1', [vehiculoId]);
    await client.query('DELETE FROM vehiculos WHERE id = $1', [vehiculoId]);

    // Si el usuario no tiene otros vehículos registrados, limpiar también al usuario
    const otrosVehiculos = await client.query('SELECT id FROM vehiculos WHERE usuario_id = $1', [usuarioId]);
    if (otrosVehiculos.rows.length === 0) {
      await client.query('DELETE FROM auditoria WHERE usuario_id = $1', [usuarioId]);
      await client.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    }

    return true;
  });
}

// 10. REINICIO DE DATOS EN POSTGRESQL (SOLO CON AUTORIZACIÓN EXPRESA)
export async function reiniciarDatosPostgres(): Promise<void> {
  return withTransaction(async (client) => {
    await client.query('DELETE FROM notificaciones');
    await client.query('DELETE FROM revisiones');
    await client.query('DELETE FROM infracciones');
    await client.query('DELETE FROM suscripciones');
    await client.query('DELETE FROM auditoria');
    await client.query('DELETE FROM vehiculos');
    await client.query('DELETE FROM usuarios');
  });
}

