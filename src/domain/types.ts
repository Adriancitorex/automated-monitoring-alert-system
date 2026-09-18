/**
 * MODELO CANÓNICO DE DATOS - AVISAMULTAS JALISCO
 * 
 * Define la representación normalizada e interna de infracciones,
 * vehículos, usuarios y estados, totalmente independiente de la fuente.
 */

export type OrigenDato = 'MANUAL' | 'OFICIAL_PORTAL' | 'OFICIAL_FLOTILLAS' | 'OFICIAL_API' | 'DEMO';

export type EstadoRevision = 'SIN_NOVEDAD' | 'INFRACCION_DETECTADA' | 'ERROR_CONSULTA' | 'PENDIENTE';

export type TipoInfraccion = 
  | 'FOTOINFRACCION_VELOCIDAD'
  | 'CARRIL_EXCLUSIVO_TRANSPORTE'
  | 'ALCOHOLIMETRIA'
  | 'ESTACIONOMETRO_MUNICIPAL'
  | 'FALTA_VERIFICACION'
  | 'FALTA_SEGURO_DANOS'
  | 'OTRA_INFRACCION_VIAL';

export type AutoridadInfraccion = 
  | 'ESTATAL_POLICIA_VIAL' 
  | 'MUNICIPAL_GUADALAJARA' 
  | 'MUNICIPAL_ZAPOPAN' 
  | 'MUNICIPAL_OTRO'
  | 'DESCONOCIDA';

/**
 * Infracción canónica normalizada
 */
export interface InfraccionCanonica {
  idInterno: string;                   // UUID interno del sistema
  vehiculoId: string;                  // Referencia al vehículo en AvisaMultas
  placa: string;                       // Placa normalizada (mayúsculas, sin espacios ni guiones)
  identificadorExterno: string;        // Folio oficial o ID provisto por la autoridad/fuente
  fuenteIdentificador: string;         // Namespace del emisor (ej: 'JALISCO_SHP_FOLIO', 'GDL_PARQUIMETRO', etc.)
  
  fechaInfraccion: string;             // ISO-8601 YYYY-MM-DD
  fechaNotificacion?: string;          // ISO-8601 YYYY-MM-DD si fue notificada formalmente
  fechaConsulta: string;               // ISO-8601 cuándo se obtuvo
  
  concepto: string;                    // Descripción textual oficial
  tipoInfraccion: TipoInfraccion;
  autoridad: AutoridadInfraccion;
  
  montoOriginalMxn: number;            // Importe base determinado
  montoVigenteMxn: number;             // Importe neto a pagar en portal
  recargosMxn: number;                 // Recargos acumulados por mora
  gastosEjecucionMxn?: number;         // Gastos de notificación si aplican
  
  descuentoVigenteMxn: number;         // Importe descontado
  porcentajeDescuento: number;         // 0, 50, etc.
  fechaLimiteDescuento?: string;       // ISO-8601 si es determinable
  nivelConfianzaDescuento: string;     // 'CERTEZA_PORTAL' | 'CERTEZA_LEGAL' | 'UNKNOWN'
  reglaDescuentoAplicada?: string;     // Motivo o fundamento
  
  urlOficialPago?: string;             // Enlace a la pasarela oficial del Estado
  fuenteDato: OrigenDato;              // MANUAL, OFICIAL_PORTAL, etc.
  hashAuxiliar: string;                // Hash auxiliar para búsquedas rápidas
}

export interface VehiculoCanonico {
  id: string;
  usuarioId: string;
  placa: string;
  numeroSerie5: string;
  alias?: string;
  datosConsulta?: Record<string, any>;
  estadoSuscripcion: 'PENDIENTE_PAGO' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  plan: 'MENSUAL_BASICO' | 'ANUAL_AHORRO';
  montoPlanMxn: number;
  creadoEn: string;
  ultimaRevisionEn?: string;
  totalMultasRegistradas: number;
}

export interface ConsultaVehicularParams {
  placa: string;
  numeroSerie5: string;
  usuarioId?: string;
  vehiculoId?: string;
  datosAdicionales?: Record<string, any>;
}

export interface ResultadoConsultaVehicular {
  exito: boolean;
  fuente: OrigenDato;
  fechaConsulta: string;
  placa: string;
  infracciones: InfraccionCanonica[];
  observaciones?: string;
  error?: string;
}
