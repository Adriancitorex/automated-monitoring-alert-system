/**
 * SEMILLERO DE DATOS DE DEMOSTRACIÓN (AISLADO)
 * 
 * Se utiliza únicamente para poblar datos iniciales legibles en modo DEMO_MEMORY.
 */

import crypto from 'crypto';
import { MemoryStore } from '../memory/memoryRepositories';

export function seedDemoData(store: MemoryStore) {
  if (store.usuarios.length > 0) return;

  // 1. Alejandro Morales Silva
  store.usuarios.push({
    id: 'usr-demo-01',
    nombre: 'Alejandro Morales Silva',
    email: 'alejandro.morales@example.com',
    telefonoWhatsApp: '+523312984520',
    creadoEn: '2026-08-15T09:30:00Z'
  });

  // 2. Sofía Gómez Barba
  store.usuarios.push({
    id: 'usr-demo-02',
    nombre: 'Sofía Gómez Barba',
    email: 'sofia.gomez.b@example.com',
    telefonoWhatsApp: '+523318459012',
    creadoEn: '2026-08-18T14:15:00Z'
  });

  // 3. Roberto Navarro Cárdenas
  store.usuarios.push({
    id: 'usr-demo-03',
    nombre: 'Roberto Navarro Cárdenas',
    email: 'roberto.navarro@example.com',
    telefonoWhatsApp: '+523326710499',
    creadoEn: '2026-08-22T11:00:00Z'
  });

  // Vehículos con placas de Jalisco
  store.vehiculos.push({
    id: 'veh-demo-01',
    usuarioId: 'usr-demo-01',
    placa: 'JNZ-7890',
    numeroSerie5: '48219',
    alias: 'Mazda 3 Rojo',
    estadoSuscripcion: 'ACTIVA',
    plan: 'MENSUAL_BASICO',
    montoPlanMxn: 99.00,
    ultimaRevisionEn: '2026-09-17T10:30:00Z',
    proximaRevisionEstimadaEn: '2026-09-18T10:30:00Z',
    totalMultasRegistradas: 1,
    creadoEn: '2026-08-15T09:35:00Z'
  });

  store.vehiculos.push({
    id: 'veh-demo-02',
    usuarioId: 'usr-demo-02',
    placa: 'JPR-4512',
    numeroSerie5: '93104',
    alias: 'Honda CR-V Gris',
    estadoSuscripcion: 'ACTIVA',
    plan: 'ANUAL_AHORRO',
    montoPlanMxn: 990.00,
    ultimaRevisionEn: '2026-09-17T08:45:00Z',
    proximaRevisionEstimadaEn: '2026-09-18T08:45:00Z',
    totalMultasRegistradas: 0,
    creadoEn: '2026-08-18T14:20:00Z'
  });

  store.vehiculos.push({
    id: 'veh-demo-03',
    usuarioId: 'usr-demo-03',
    placa: 'JTC-6208',
    numeroSerie5: '71582',
    alias: 'VW Jetta Blanco',
    estadoSuscripcion: 'ACTIVA',
    plan: 'MENSUAL_BASICO',
    montoPlanMxn: 99.00,
    ultimaRevisionEn: '2026-09-16T19:10:00Z',
    proximaRevisionEstimadaEn: '2026-09-17T19:10:00Z',
    totalMultasRegistradas: 0,
    creadoEn: '2026-08-22T11:05:00Z'
  });

  // Suscripciones
  store.suscripciones.push({
    id: 'sub-demo-01',
    usuarioId: 'usr-demo-01',
    vehiculoId: 'veh-demo-01',
    plan: 'MENSUAL_BASICO',
    montoMxn: 99.00,
    estado: 'ACTIVA',
    periodoInicio: '2026-08-15T09:35:00Z',
    periodoFin: '2026-09-15T09:35:00Z',
    pasarelaPagoId: 'demo_stripe_morales_01',
    creadoEn: '2026-08-15T09:35:00Z',
    actualizadoEn: '2026-08-15T09:35:00Z'
  });

  store.suscripciones.push({
    id: 'sub-demo-02',
    usuarioId: 'usr-demo-02',
    vehiculoId: 'veh-demo-02',
    plan: 'ANUAL_AHORRO',
    montoMxn: 990.00,
    estado: 'ACTIVA',
    periodoInicio: '2026-08-18T14:20:00Z',
    periodoFin: '2027-08-18T14:20:00Z',
    pasarelaPagoId: 'demo_stripe_gomez_02',
    creadoEn: '2026-08-18T14:20:00Z',
    actualizadoEn: '2026-08-18T14:20:00Z'
  });

  store.suscripciones.push({
    id: 'sub-demo-03',
    usuarioId: 'usr-demo-03',
    vehiculoId: 'veh-demo-03',
    plan: 'MENSUAL_BASICO',
    montoMxn: 99.00,
    estado: 'ACTIVA',
    periodoInicio: '2026-08-22T11:05:00Z',
    periodoFin: '2026-09-22T11:05:00Z',
    pasarelaPagoId: 'demo_stripe_navarro_03',
    creadoEn: '2026-08-22T11:05:00Z',
    actualizadoEn: '2026-08-22T11:05:00Z'
  });

  // Infracción realista con folio de SHP Jalisco y 50% de pronto pago
  store.infracciones.push({
    idInterno: 'inf-demo-01',
    vehiculoId: 'veh-demo-01',
    placa: 'JNZ-7890',
    identificadorExterno: 'FOL-JAL-2026-8841',
    fuenteIdentificador: 'JALISCO_SHP_FOLIO',
    fechaInfraccion: '2026-09-12',
    fechaNotificacion: '2026-09-13',
    fechaConsulta: '2026-09-13T08:30:00Z',
    concepto: 'Exceso de velocidad detectado por cinemómetro fijo (Av. Adolfo López Mateos Sur y Periférico)',
    tipoInfraccion: 'FOTOINFRACCION_VELOCIDAD',
    autoridad: 'ESTATAL_POLICIA_VIAL',
    montoOriginalMxn: 1085.00,
    montoVigenteMxn: 542.50,
    recargosMxn: 0.00,
    gastosEjecucionMxn: 0.00,
    descuentoVigenteMxn: 542.50,
    porcentajeDescuento: 50.00,
    fechaLimiteDescuento: '2026-09-26',
    nivelConfianzaDescuento: 'CERTEZA_LEGAL',
    reglaDescuentoAplicada: 'Beneficio del 50% por liquidación oportuna dentro de los primeros 10 días hábiles.',
    urlOficialPago: 'https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares',
    fuenteDato: 'MANUAL',
    hashAuxiliar: crypto.createHash('sha256').update('veh-demo-01:JALISCO_SHP_FOLIO:FOL-JAL-2026-8841').digest('hex')
  });

  // Revisiones
  store.revisiones.push({
    id: 'rev-demo-01',
    vehiculoId: 'veh-demo-01',
    placa: 'JNZ-7890',
    resultado: 'NUEVA_INFRACCION_REGISTRADA',
    observaciones: 'Cotejo en portal SHP: Se detectó infracción FOL-JAL-2026-8841. Alerta WhatsApp despachada.',
    fechaRevision: '2026-09-13T08:30:00Z'
  });

  store.revisiones.push({
    id: 'rev-demo-02',
    vehiculoId: 'veh-demo-01',
    placa: 'JNZ-7890',
    resultado: 'SIN_INFRACCIONES',
    observaciones: 'Inspección de seguimiento en portal SHP Jalisco. Sin adeudos adicionales acumulados.',
    fechaRevision: '2026-09-17T10:30:00Z'
  });

  store.revisiones.push({
    id: 'rev-demo-03',
    vehiculoId: 'veh-demo-02',
    placa: 'JPR-4512',
    resultado: 'SIN_INFRACCIONES',
    observaciones: 'Inspección en portal oficial de la SHP Jalisco. Vehículo al corriente, sin multas ni adeudos.',
    fechaRevision: '2026-09-17T08:45:00Z'
  });

  store.revisiones.push({
    id: 'rev-demo-04',
    vehiculoId: 'veh-demo-03',
    placa: 'JTC-6208',
    resultado: 'SIN_INFRACCIONES',
    observaciones: 'Inspección en portal oficial de la SHP Jalisco. Sin sanciones pendientes.',
    fechaRevision: '2026-09-16T19:10:00Z'
  });

  // Notificación
  store.notificaciones.push({
    id: 'notif-demo-01',
    infraccionId: 'inf-demo-01',
    vehiculoId: 'veh-demo-01',
    placa: 'JNZ-7890',
    telefonoDestino: '+523312984520',
    canal: 'WHATSAPP',
    mensaje: 'Aviso AvisaMultas Jalisco: Se detectó una nueva fotoinfracción para tu Mazda 3 Rojo (Placa JNZ-7890). Folio FOL-JAL-2026-8841. Importe con 50% de descuento por pronto pago: $542.50 MXN (Vigente hasta el 26/09/2026).',
    estado: 'ENVIADO',
    proveedorMsgId: 'wamid.HBgLMzMxMjk4NDUyMBUCMRIA',
    enviadoEn: '2026-09-13T08:31:05Z'
  });
}

