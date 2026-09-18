import { TipoInfraccion } from '../types';

export interface EvaluacionDescuento {
  esElegible: boolean;
  porcentajeAplicable: number;
  razon: string;
  requiereConfirmacionManual: boolean;
  estatusCalculo: 'CERTEZA_PORTAL' | 'CERTEZA_LEGAL' | 'UNKNOWN';
}

export class PoliticaDescuentosJalisco {
  static evaluar(
    tipo: TipoInfraccion,
    montoOriginal: number,
    montoConDescuentoReportado?: number,
    fechaNotificacion?: string
  ): EvaluacionDescuento {
    if (tipo === 'ALCOHOLIMETRIA') {
      return {
        esElegible: false,
        porcentajeAplicable: 0,
        razon: 'Infracción sin descuento por disposición legal en materia de alcoholimetría.',
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_LEGAL'
      };
    }

    if (tipo === 'CARRIL_EXCLUSIVO_TRANSPORTE') {
      return {
        esElegible: false,
        porcentajeAplicable: 0,
        razon: 'Invasión de carril exclusivo no elegible para descuento.',
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_LEGAL'
      };
    }

    if (montoConDescuentoReportado !== undefined && montoConDescuentoReportado < montoOriginal) {
      const porcentaje = Math.round(((montoOriginal - montoConDescuentoReportado) / montoOriginal) * 100);
      return {
        esElegible: true,
        porcentajeAplicable: porcentaje,
        razon: `Descuento reportado por portal oficial (${porcentaje}%).`,
        requiereConfirmacionManual: false,
        estatusCalculo: 'CERTEZA_PORTAL'
      };
    }

    if (tipo === 'FOTOINFRACCION_VELOCIDAD') {
      if (fechaNotificacion) {
        return {
          esElegible: true,
          porcentajeAplicable: 50,
          razon: 'Aplica 50% por pronto pago en periodo hábil legal.',
          requiereConfirmacionManual: false,
          estatusCalculo: 'CERTEZA_LEGAL'
        };
      }

      return {
        esElegible: true,
        porcentajeAplicable: 50,
        razon: 'Fotoinfracción preliminarmente elegible para 50% de descuento.',
        requiereConfirmacionManual: true,
        estatusCalculo: 'UNKNOWN'
      };
    }

    return {
      esElegible: false,
      porcentajeAplicable: 0,
      razon: 'Infracción sin regla de descuento automática configurada.',
      requiereConfirmacionManual: true,
      estatusCalculo: 'UNKNOWN'
    };
  }
}

export const JaliscoDiscountPolicy = PoliticaDescuentosJalisco;
