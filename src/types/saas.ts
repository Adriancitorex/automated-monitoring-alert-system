export interface UsuarioSaaS {
  id: string;
  nombre: string;
  email: string;
  telefonoWhatsApp: string; // Formato E.164: +521...
  creadoEn: string;
}

export interface VehiculoSaaS {
  id: string;
  usuarioId: string;
  placa: string;
  numeroSerie5: string; // Requerido por el portal de Jalisco
  alias?: string;
  estadoSuscripcion: 'ACTIVA' | 'PENDIENTE_PAGO' | 'CANCELADA';
  plan: 'MENSUAL_BASICO' | 'ANUAL_AHORRO';
  montoPlanMxn: number;
  ultimaRevisionEn?: string;
  proximaRevisionEstimadaEn?: string;
  totalMultasRegistradas: number;
  creadoEn: string;
}

export interface MultaRegistrada {
  id: string;
  vehiculoId: string;
  placa: string;
  hashDeduplicacion: string; // SHA256(placa + folio + fecha)
  folioOficial: string;
  fechaInfraccion: string;
  motivoInfraccion: string;
  montoOficialMxn: number;
  tieneDescuentoProntoPago: boolean;
  porcentajeDescuento: number; // 50 o 25
  montoConDescuentoMxn: number;
  fechaLimiteProntoPago?: string;
  notificadoWhatsApp: boolean;
  fechaNotificacionWhatsApp?: string;
  registradoPorAdminEn: string;
}

export interface RegistroWhatsApp {
  id: string;
  multaId: string;
  placa: string;
  telefonoDestino: string;
  mensaje: string;
  estado: 'ENVIADO' | 'FALLIDO';
  proveedorMsgId: string;
  enviadoEn: string;
}

export interface LogRevisionManual {
  id: string;
  vehiculoId: string;
  placa: string;
  resultado: 'SIN_INFRACCIONES' | 'NUEVA_INFRACCION_REGISTRADA';
  observaciones?: string;
  fechaRevision: string;
}
