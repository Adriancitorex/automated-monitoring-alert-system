/**
 * SEMILLERO DE DATOS DE DEMOSTRACIÓN (AISLADO)
 * 
 * Se utiliza únicamente para poblar datos iniciales legibles en modo DEMO_MEMORY.
 */

import crypto from 'crypto';
import { MemoryStore } from '../memory/memoryRepositories';

export function seedDemoData(store: MemoryStore) {
  if (store.usuarios.length > 0) return;

  const usuarioId = 'usr-demo-01';
  const vehiculoId = 'veh-demo-01';
  const multaId = 'mul-001';

  store.usuarios.push({
    id: usuarioId,
    nombre: 'Alejandro Morales Silva',
    email: 'alejandro.morales@example.com',
    telefonoWhatsApp: '+523312984520',
    creadoEn: '2026-08-20T10:00:00Z'
  });

  store.vehiculos.push({
    id: vehiculoId,
    usuarioId,
    placa: 'JNZ7890',
    numeroSerie5: '48219',
    alias: 'Mazda 3 Rojo',
    estadoSuscripcion: 'ACTIVA',
    plan: 'MENSUAL_BASICO',
    montoPlanMxn: 99.00,
    ultimaRevisionEn: '2026-09-01T15:00:00Z',
    proximaRevisionEstimadaEn: '2026-09-02T03:00:00Z',
    totalMultasRegistradas: 1,
    creadoEn: '2026-08-20T10:05:00Z'
  });

  store.suscripciones.push({
    id: 'sub-demo-01',
    usuarioId,
    vehiculoId,
    plan: 'MENSUAL_BASICO',
    montoMxn: 99.00,
    estado: 'ACTIVA',
    periodoInicio: '2026-08-20T10:05:00Z',
    periodoFin: '2026-09-20T10:05:00Z',
    pasarelaPagoId: 'demo_sub_stripe_123',
    creadoEn: '2026-08-20T10:05:00Z',
    actualizadoEn: '2026-08-20T10:05:00Z'
  });

  store.infracciones.push({
    idInterno: multaId,
    vehiculoId,
    placa: 'JNZ7890',
    identificadorExterno: 'FOL-JAL-9921',
    fuenteIdentificador: 'JALISCO_SHP_FOLIO',
    fechaInfraccion: '2026-08-22',
    fechaNotificacion: '2026-08-23',
    fechaConsulta: '2026-08-23T08:14:00Z',
    concepto: 'Exceso de velocidad detectado por cinemómetro fijo (Av. López Mateos Sur)',
    tipoInfraccion: 'FOTOINFRACCION_VELOCIDAD',
    autoridad: 'ESTATAL_POLICIA_VIAL',
    montoOriginalMxn: 1085.00,
    montoVigenteMxn: 542.50,
    recargosMxn: 0.00,
    gastosEjecucionMxn: 0.00,
    descuentoVigenteMxn: 542.50,
    porcentajeDescuento: 50.00,
    fechaLimiteDescuento: '2026-09-05',
    nivelConfianzaDescuento: 'CERTEZA_LEGAL',
    reglaDescuentoAplicada: 'Beneficio 50% por liquidación en primeros 10 días hábiles.',
    urlOficialPago: 'https://hacienda.jalisco.gob.mx',
    fuenteDato: 'MANUAL',
    hashAuxiliar: crypto.createHash('sha256').update('veh-demo-01:JALISCO_SHP_FOLIO:FOL-JAL-9921').digest('hex')
  });

  store.revisiones.push({
    id: 'rev-001',
    vehiculoId,
    placa: 'JNZ7890',
    resultado: 'SIN_INFRACCIONES',
    observaciones: 'Revisión en portal oficial de la SHP. Sin adeudos nuevos.',
    fechaRevision: '2026-09-01T15:00:00Z'
  });

  store.notificaciones.push({
    id: 'notif-001',
    infraccionId: multaId,
    vehiculoId,
    placa: 'JNZ7890',
    telefonoDestino: '+523312984520',
    canal: 'WHATSAPP',
    mensaje: '🚨 Alerta AvisaMultas Jalisco: Se detectó una nueva fotoinfracción para tu Mazda 3 Rojo (Placa JNZ7890). Folio FOL-JAL-9921.',
    estado: 'ENVIADO',
    proveedorMsgId: 'wamid.HBgLM...DEMO',
    enviadoEn: '2026-08-23T08:15:00Z'
  });
}
