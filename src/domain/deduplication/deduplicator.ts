import crypto from 'crypto';
import { InfraccionCanonica } from '../types';

export class MotorDeduplicacion {
  static generarHashIdentificador(
    vehiculoId: string,
    fuenteIdentificador: string,
    identificadorExterno: string
  ): string {
    const raw = `${vehiculoId.trim()}:${fuenteIdentificador.trim().toUpperCase()}:${identificadorExterno.trim().toUpperCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  static generarHashHechoMaterial(
    vehiculoId: string,
    fechaInfraccion: string,
    concepto: string
  ): string {
    const conceptoNorm = concepto
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 60);
    const raw = `${vehiculoId.trim()}:${fechaInfraccion.trim()}:${conceptoNorm}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  static detectarDuplicado(
    candidata: {
      vehiculoId: string;
      fuenteIdentificador: string;
      identificadorExterno: string;
      fechaInfraccion: string;
      concepto: string;
    },
    existentes: InfraccionCanonica[]
  ): { esDuplicado: boolean; motivo?: string; infraccionExistenteId?: string } {
    const matchIdentificador = existentes.find(
      (e) =>
        e.vehiculoId === candidata.vehiculoId &&
        e.fuenteIdentificador.toUpperCase() === candidata.fuenteIdentificador.toUpperCase() &&
        e.identificadorExterno.toUpperCase() === candidata.identificadorExterno.toUpperCase()
    );

    if (matchIdentificador) {
      return {
        esDuplicado: true,
        motivo: `Infracción con identificador '${candidata.identificadorExterno}' ya registrada en fuente '${candidata.fuenteIdentificador}'.`,
        infraccionExistenteId: matchIdentificador.idInterno
      };
    }

    const hashMaterialCandidato = this.generarHashHechoMaterial(
      candidata.vehiculoId,
      candidata.fechaInfraccion,
      candidata.concepto
    );

    const matchMaterial = existentes.find((e) => {
      const hashExistente = this.generarHashHechoMaterial(
        e.vehiculoId,
        e.fechaInfraccion,
        e.concepto
      );
      return hashExistente === hashMaterialCandidato;
    });

    if (matchMaterial) {
      return {
        esDuplicado: true,
        motivo: `Mismo hecho material en fecha ${candidata.fechaInfraccion}. Folio previo: '${matchMaterial.identificadorExterno}'.`,
        infraccionExistenteId: matchMaterial.idInterno
      };
    }

    return { esDuplicado: false };
  }
}

export const DeduplicationEngine = MotorDeduplicacion;
