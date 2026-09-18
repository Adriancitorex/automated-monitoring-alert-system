import { MemoryStore, defaultMemoryStore, MemoryUsuarioRepository, MemoryVehiculoRepository, MemorySuscripcionRepository, MemoryInfraccionRepository, MemoryRevisionRepository, MemoryNotificacionRepository, MemoryAuditoriaRepository, ejecutarOnboardingTransaccionalMemoria, eliminarVehiculoPorPlacaMemoria, reiniciarDatosMemoria } from '../db/memory/memoryRepositories';
import { InfraccionCanonica } from '../domain/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function ejecutarTestsMemoria(): Promise<{ pasados: number; fallados: number; detalles: string[] }> {
  const store = new MemoryStore();
  const detalles: string[] = [];
  let pasados = 0;
  let fallados = 0;

  async function test(nombre: string, fn: () => Promise<void>) {
    try {
      await fn();
      pasados++;
      detalles.push(`  PASS [memoria] ${nombre}`);
    } catch (err: any) {
      fallados++;
      detalles.push(`  FAIL [memoria] ${nombre} -> ${err.message}`);
    }
  }

  console.log('[test] Ejecutando suite unitaria (memoria)');

  await test('Crear usuario con validación de email', async () => {
    const userRepo = new MemoryUsuarioRepository(store);
    const u = await userRepo.crear({
      nombre: 'Juan Pérez',
      email: 'juan.perez@example.com',
      telefonoWhatsApp: '+523311223344'
    });
    assert(Boolean(u.id), 'El usuario debe tener un ID asignado');
    assert(u.email === 'juan.perez@example.com', 'El email debe coincidir');
  });

  await test('FK usuario -> vehículo (rechazar si usuario no existe)', async () => {
    const vehRepo = new MemoryVehiculoRepository(store);
    let errorCapturado = false;
    try {
      await vehRepo.crear({
        usuarioId: 'usr-inexistente',
        placa: 'XYZ1234',
        numeroSerie5: '12345',
        alias: 'Auto Test',
        estadoSuscripcion: 'PENDIENTE_PAGO',
        plan: 'MENSUAL_BASICO',
        montoPlanMxn: 99.00
      });
    } catch (e: any) {
      errorCapturado = true;
      assert(e.message.includes('Foreign Key'), 'Debe reportar violación de FK');
    }
    assert(errorCapturado, 'Debió fallar por FK inexistente');
  });

  let usuarioIdValido = '';
  let vehiculoIdValido = '';
  await test('Crear vehículo vinculado a usuario existente', async () => {
    const userRepo = new MemoryUsuarioRepository(store);
    const u = await userRepo.crear({
      nombre: 'María López',
      email: 'maria.lopez@example.com',
      telefonoWhatsApp: '+523399887766'
    });
    usuarioIdValido = u.id;

    const vehRepo = new MemoryVehiculoRepository(store);
    const v = await vehRepo.crear({
      usuarioId: u.id,
      placa: 'JAL5555',
      numeroSerie5: '98765',
      alias: 'Nissan Kicks',
      estadoSuscripcion: 'PENDIENTE_PAGO',
      plan: 'MENSUAL_BASICO',
      montoPlanMxn: 99.00
    });
    vehiculoIdValido = v.id;
    assert(v.placa === 'JAL5555', 'La placa debe guardarse normalizada');
  });

  await test('Crear suscripción en estado PENDIENTE_PAGO', async () => {
    const subRepo = new MemorySuscripcionRepository(store);
    const s = await subRepo.crear({
      usuarioId: usuarioIdValido,
      vehiculoId: vehiculoIdValido,
      plan: 'MENSUAL_BASICO',
      montoMxn: 99.00,
      estado: 'PENDIENTE_PAGO',
      periodoInicio: new Date().toISOString()
    });
    assert(s.estado === 'PENDIENTE_PAGO', 'El estado inicial debe ser PENDIENTE_PAGO');
    assert(s.montoMxn === 99.00, 'El monto debe mantener precisión');
  });

  const infraccionDemo: InfraccionCanonica = {
    idInterno: 'mul-test-01',
    vehiculoId: vehiculoIdValido,
    placa: 'JAL5555',
    identificadorExterno: 'FOL-TEST-100',
    fuenteIdentificador: 'JALISCO_SHP_FOLIO',
    fechaInfraccion: '2026-08-25',
    fechaConsulta: new Date().toISOString(),
    concepto: 'Exceso de velocidad en Calzada Independencia',
    tipoInfraccion: 'FOTOINFRACCION_VELOCIDAD',
    autoridad: 'ESTATAL_POLICIA_VIAL',
    montoOriginalMxn: 1085.00,
    montoVigenteMxn: 542.50,
    recargosMxn: 0.00,
    gastosEjecucionMxn: 0.00,
    descuentoVigenteMxn: 542.50,
    porcentajeDescuento: 50.00,
    nivelConfianzaDescuento: 'CERTEZA_LEGAL',
    fuenteDato: 'MANUAL',
    hashAuxiliar: 'hash_test_100'
  };

  await test('Insertar infracción canónica con montos correctos', async () => {
    const infRepo = new MemoryInfraccionRepository(store);
    const creada = await infRepo.crear(infraccionDemo);
    assert(creada.identificadorExterno === 'FOL-TEST-100', 'Debe almacenar el folio');
    assert(creada.fuenteIdentificador === 'JALISCO_SHP_FOLIO', 'Debe almacenar el namespace');
  });

  await test('Impedir duplicado por identificador oficial unívoco', async () => {
    const infRepo = new MemoryInfraccionRepository(store);
    let duplicadoRechazado = false;
    try {
      await infRepo.crear({
        ...infraccionDemo,
        idInterno: 'mul-test-02'
      });
    } catch (e: any) {
      duplicadoRechazado = true;
      assert(e.message.includes('unicidad'), 'Debe notificar violación de unicidad');
    }
    assert(duplicadoRechazado, 'Debió rechazar el duplicado de folio');
  });

  await test('Impedir duplicado por hecho material', async () => {
    const infRepo = new MemoryInfraccionRepository(store);
    let duplicadoMaterial = false;
    try {
      await infRepo.crear({
        ...infraccionDemo,
        idInterno: 'mul-test-03',
        identificadorExterno: 'FOLIO-DISTINTO-999'
      });
    } catch (e: any) {
      duplicadoMaterial = true;
      assert(e.message.includes('Mismo hecho material') || e.message.includes('unicidad'), 'Debe detectar duplicidad material');
    }
    assert(duplicadoMaterial, 'Debió rechazar el duplicado por hecho material');
  });

  await test('Registrar revisión en bitácora', async () => {
    const revRepo = new MemoryRevisionRepository(store);
    const rev = await revRepo.crear({
      vehiculoId: vehiculoIdValido,
      placa: 'JAL5555',
      resultado: 'SIN_INFRACCIONES',
      observaciones: 'Revisión periódica ejecutada.'
    });
    assert(rev.resultado === 'SIN_INFRACCIONES', 'El resultado debe registrarse');
  });

  await test('Registrar notificación enviada', async () => {
    const notifRepo = new MemoryNotificacionRepository(store);
    const notif = await notifRepo.crear({
      vehiculoId: vehiculoIdValido,
      infraccionId: 'mul-test-01',
      placa: 'JAL5555',
      telefonoDestino: '+523399887766',
      canal: 'WHATSAPP',
      mensaje: 'Alerta de prueba',
      estado: 'ENVIADO',
      proveedorMsgId: 'msg_demo_01'
    });
    assert(notif.estado === 'ENVIADO', 'Estado debe ser ENVIADO');
  });

  await test('Registrar evento de auditoría inmutable', async () => {
    const audRepo = new MemoryAuditoriaRepository(store);
    const aud = await audRepo.registrar({
      tipo: 'INFRACCION_DETECTADA',
      vehiculoId: vehiculoIdValido,
      detalles: { folio: 'FOL-TEST-100', prueba: true }
    });
    assert(aud.tipo === 'INFRACCION_DETECTADA', 'Tipo de auditoría debe coincidir');
  });

  await test('Rollback transaccional de Onboarding ante error en proceso', async () => {
    const totalUsuariosAntes = store.usuarios.length;
    const totalVehiculosAntes = store.vehiculos.length;
    const totalSuscripcionesAntes = store.suscripciones.length;

    let falloEsperado = false;
    try {
      await ejecutarOnboardingTransaccionalMemoria(
        {
          nombre: 'Cliente Abortado',
          email: 'abortado@example.com',
          telefonoWhatsApp: '+523300000000',
          placa: 'JAL5555',
          numeroSerie5: '11111'
        },
        store
      );
    } catch (e: any) {
      falloEsperado = true;
    }

    assert(falloEsperado, 'Debió fallar el onboarding por placa duplicada');
    assert(store.usuarios.length === totalUsuariosAntes, 'El rollback debió revertir cualquier usuario creado');
    assert(store.vehiculos.length === totalVehiculosAntes, 'El número de vehículos no debe alterarse');
    assert(store.suscripciones.length === totalSuscripcionesAntes, 'El número de suscripciones no debe alterarse');
  });

  await test('Eliminar vehículo por placa y dependencias asociadas', async () => {
    const vehRepo = new MemoryVehiculoRepository(store);
    const v = await vehRepo.obtenerPorPlaca('JAL5555');
    assert(Boolean(v), 'El vehículo JAL5555 debe existir');
    const ok = eliminarVehiculoPorPlacaMemoria('JAL5555', store);
    assert(ok, 'La eliminación debe retornar true');
    const postDel = await vehRepo.obtenerPorPlaca('JAL5555');
    assert(postDel === null, 'El vehículo JAL5555 ya no debe existir');
  });

  await test('Reinicio de datos demo en memoria', async () => {
    reiniciarDatosMemoria(store);
    assert(store.vehiculos.length > 0, 'Deben existir vehículos sembrados tras el reset');
    assert(store.usuarios.length > 0, 'Deben existir usuarios tras el reset');
  });

  console.log(detalles.join('\n'));
  console.log(`\nResumen Tests Memoria: ${pasados} pasados, ${fallados} fallados`);
  return { pasados, fallados, detalles };
}

export const runMemoryTests = ejecutarTestsMemoria;

if (process.argv[1]?.endsWith('memoryRepositories.test.ts')) {
  ejecutarTestsMemoria()
    .then((r) => {
      if (r.fallados > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
