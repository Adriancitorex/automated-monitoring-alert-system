/**
 * POLÍTICA Y REGLAS DE DESCUENTOS - JALISCO
 * 
 * Basado en la Ley de Movilidad, Seguridad Vial y Transporte del Estado de Jalisco.
 * - Descuento general del 50% por pronto pago en infracciones ordinarias y fotoinfracciones
 *   si se liquida dentro de los primeros 10 días hábiles de su notificación legal.
 * - Excepciones legales expresas (NO tienen descuento):
 *   * Conducir bajo influjo de alcohol o drogas.
 *   * Invasión o bloqueo de carriles exclusivos de transporte público masivo (ej: Mi Macro).
 * - Cuando la fecha límite no pueda calcularse con certeza, se marca como 'UNKNOWN'.
 */

import { TipoInfraccion } from '../types';

export interface EvaluacionDescuento {
  esElegible: boolean;
  porcentajeAplicable: number;
  razon: string;
  requiereConfirmacionManual: boolean;
  estatusCalculo: 'CERTEZA_PORTAL' | 'CERTEZA_LEGAL' | 'UNKNOWN';
}

export class JaliscoDiscountPolicy {
  /**
   * Evalúa la elegibilidad de descuento por pronto pago para una infracción
   */
  static evaluar(
    tipo: TipoInfraccion,
    montoOriginal: number,
    montoConDescuentoReportado?: number,
    fechaNotificacion?: string
  ): EvaluacionDescuento {
    // 1. Excepciones legales taxativas (Prohibición estricta de descuento)
    if (tipo === 'ALCOHOLIMETRIA') {
      return {
        esElegible: false,
        porcentajeAplicable: 0,
        razon: 'Por mandato legal expreso, las sanciones por alcoholemia o estupefacientes no gozan de beneficio de pronto pago.',
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_LEGAL'
      };
    }

    if (tipo === 'CARRIL_EXCLUSIVO_TRANSPORTE') {
      return {
        esElegible: false,
        porcentajeAplicable: 0,
        razon: 'La invasión de carriles exclusivos del sistema de transporte masivo carece de descuento legal por pronto pago.',
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_LEGAL'
      };
    }

    // 2. Si el portal oficial reportó expresamente un monto con descuento
    if (montoConDescuentoReportado !== undefined && montoConDescuentoReportado < montoOriginal) {
      const porcentaje = Math.round(((montoOriginal - montoConDescuentoReportado) / montoOriginal) * 100);
      return {
        esElegible: true,
        porcentajeAplicable: porcentaje,
        razon: `Monto liquidable con descuento reflejado directamente en el portal oficial (${porcentaje}%).`,
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_PORTAL'
      };
    }

    // 3. Regla general para fotoinfracciones de velocidad
    if (tipo === 'FOTOINFRACCION_VELOCIDAD') {
      if (fechaNotificacion) {
        return {
          esElegible: true,
          porcentajeAplicable: 50,
          razon: 'Aplica 50% de beneficio por pronto pago si se liquida en los primeros 10 días hábiles desde la notificación formal.',
          requiereConfirmacionManual: false,
          estatusCalculo: 'CERTEZA_LEGAL'
        };
      }

      return {
        esElegible: true,
        porcentajeAplicable: 50,
        razon: 'Fotoinfracción elegible preliminarmente para 50% de descuento. Fecha límite exacta sujeta a confirmación en portal.',
        requiereConfirmacionManual: true,
        estatusCalculo: 'UNKNOWN'
      };
    }

    // 4. Infracciones sin reglas predeterminadas
    return {
      esElegible: false,
      porcentajeAplicable: 0,
      razon: 'Tipo de infracción no catalogado para descuento automático. Consulte portal oficial.',
      requiereConfirmacionManual: true,
      estatusCalculo: 'UNKNOWN'
    };
  }
}
