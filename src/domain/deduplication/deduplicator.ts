/**
 * MOTOR DE DEDUPLICACIÓN DE INFRACCIONES
 * 
 * Reglas estrictas:
 * 1. Deduplicación Primaria por Identificador Oficial:
 *    (vehiculoId, fuenteIdentificador, identificadorExterno)
 *    Permite namespaces arbitrarios (ej. 'JALISCO_SHP_FOLIO', 'GDL_MOVILIDAD_FOLIO', 'FEDERAL_SICT').
 * 
 * 2. Deduplicación Secundaria por Hecho Material:
 *    (vehiculoId, placa, fechaInfraccion, conceptoNormalizado)
 *    Evita duplicar la misma infracción si la autoridad cambia el formato de folio o emite folios provisorios.
 */

import crypto from 'crypto';
import { InfraccionCanonica } from '../types';

export class DeduplicationEngine {
  /**
   * Genera el hash de deduplicación primario para namespace + folio externo
   */
  static generarHashIdentificador(
    vehiculoId: string,
    fuenteIdentificador: string,
    identificadorExterno: string
  ): string {
    const raw = `${vehiculoId.trim()}:${fuenteIdentificador.trim().toUpperCase()}:${identificadorExterno.trim().toUpperCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Genera el hash de hecho material (vehiculoId + fecha + concepto normalizado)
   */
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

  /**
   * Evalúa si una infracción candidata es un duplicado de alguna existente en la lista
   */
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
    // A. Comprobación por identificador unívoco
    const matchIdentificador = existentes.find(
      (e) =>
        e.vehiculoId === candidata.vehiculoId &&
        e.fuenteIdentificador.toUpperCase() === candidata.fuenteIdentificador.toUpperCase() &&
        e.identificadorExterno.toUpperCase() === candidata.identificadorExterno.toUpperCase()
    );

    if (matchIdentificador) {
      return {
        esDuplicado: true,
        motivo: `Infracción con identificador '${candidata.identificadorExterno}' ya registrada bajo fuente '${candidata.fuenteIdentificador}'.`,
        infraccionExistenteId: matchIdentificador.idInterno
      };
    }

    // B. Comprobación por hecho material
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
        motivo: `Mismo hecho material detectado en fecha ${candidata.fechaInfraccion} para el vehículo. Folio registrado previo: '${matchMaterial.identificadorExterno}'.`,
        infraccionExistenteId: matchMaterial.idInterno
      };
    }

    return { esDuplicado: false };
  }
}
