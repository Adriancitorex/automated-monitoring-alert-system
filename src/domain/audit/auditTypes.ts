/**
 * TIPOS Y DEFINICIONES DE AUDITORÍA
 */

export type TipoEventoAuditoria =
  | 'USUARIO_CREADO'
  | 'VEHICULO_CREADO'
  | 'SUSCRIPCION_CREADA'
  | 'SUSCRIPCION_ACTUALIZADA'
  | 'REVISION_EJECUTADA'
  | 'INFRACCION_DETECTADA'
  | 'INFRACCION_DUPLICADA_BLOQUEADA'
  | 'NOTIFICACION_ENVIADA'
  | 'ERROR_SISTEMA'
  | 'ROLLBACK_TRANSACCION';

export interface EventoAuditoria {
  id: string;
  tipo: TipoEventoAuditoria;
  entidadId?: string;
  usuarioId?: string;
  vehiculoId?: string;
  ipOrigen?: string;
  detalles: Record<string, any>;
  timestamp: string;
}
