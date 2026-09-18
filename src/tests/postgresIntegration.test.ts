/**
 * TESTS DE INTEGRACIÓN REALES CONTRA POSTGRESQL - AVISAMULTAS JALISCO
 * 
 * Verifica las tablas reales, llaves foráneas, restricciones de unicidad compuestas,
 * tipos NUMERIC y rollback en transacciones.
 * 
 * REGLA ESTRICTA:
 * Si DATABASE_URL no está configurada o PostgreSQL no está disponible,
 * esta suite se marca como OMITIDA (SKIPPED), NUNCA como exitosa.
 */

import dotenv from 'dotenv';
import { checkPostgresHealth, initPool, closePool, withTransaction } from '../db/postgres/pool';
import {
  PostgresUsuarioRepository,
  PostgresVehiculoRepository,
  PostgresSuscripcionRepository,
  PostgresInfraccionRepository,
  PostgresRevisionRepository,
  PostgresNotificacionRepository,
  PostgresAuditoriaRepository,
  ejecutarOnboardingTransaccionalPostgres,
  eliminarVehiculoPorPlacaPostgres
} from '../db/postgres/postgresRepositories';
import { InfraccionCanonica } from '../domain/types';

dotenv.config();

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runPostgresIntegrationTests(): Promise<{
  omitido: boolean;
  motivoOmision?: string;
  pasados: number;
  fallados: number;
  detalles: string[];
}> {
  console.log('\n--- EJECUTANDO TESTS DE INTEGRACIÓN (POSTGRESQL REAL) ---');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    const mensaje = 'DATABASE_URL no está configurada en las variables de entorno.';
    console.log(`⚠️  [OMITIDO / SKIPPED] ${mensaje}`);
    return {
      omitido: true,
      motivoOmision: mensaje,
      pasados: 0,
      fallados: 0,
      detalles: [`⚠️  [POSTGRESQL OMITIDO] ${mensaje}`]
    };
  }

  const health = await checkPostgresHealth();
  if (!health.conectado) {
    const mensaje = `DATABASE_URL está configurada pero PostgreSQL no está accesible: ${health.error}`;
    console.log(`⚠️  [OMITIDO / SKIPPED] ${mensaje}`);
    return {
      omitido: true,
      motivoOmision: mensaje,
      pasados: 0,
      fallados: 0,
      detalles: [`⚠️  [POSTGRESQL OMITIDO] ${mensaje}`]
    };
  }

  console.log(`✅ Conexión establecida con PostgreSQL (${health.latenciaMs}ms). Ejecutando suite de integración...`);

  const detalles: string[] = [];
  let pasados = 0;
  let fallados = 0;

  async function test(nombre: string, fn: () => Promise<void>) {
    try {
      await fn();
      pasados++;
      detalles.push(`  ✅ [PG] ${nombre}`);
    } catch (err: any) {
      fallados++;
      detalles.push(`  ❌ [PG] ${nombre} -> ${err.message}`);
    }
  }

  const randomHex = Math.random().toString(36).substring(2, 6).toLowerCase();
  const sufijoUnico = `${Date.now()}_${randomHex}`;
  const emailTest = `test_${sufijoUnico}@example.com`;
  const placaTest = `T${randomHex.toUpperCase()}${Math.floor(Math.random() * 10)}`;
  let usuarioId = '';
  let vehiculoId = '';

  try {
    // 1. Crear usuario
    await test('Crear usuario en PostgreSQL', async () => {
      const userRepo = new PostgresUsuarioRepository();
      const u = await userRepo.crear({
        nombre: 'Usuario Integración Postgres',
        email: emailTest,
        telefonoWhatsApp: '+523311002200'
      });
      assert(Boolean(u.id), 'Debe devolver el id generado');
      assert(u.email === emailTest, 'Debe coincidir el email');
      usuarioId = u.id;
    });

    // 2. FK Usuario -> Vehículo
    await test('FK usuario -> vehículo (rechaza si usuario no existe)', async () => {
      const vehRepo = new PostgresVehiculoRepository();
      let errorFK = false;
      try {
        await vehRepo.crear({
          usuarioId: 'usr-id-que-no-existe-en-db',
          placa: `FK${sufijoUnico.substring(0, 3)}`,
          numeroSerie5: '99999',
          estadoSuscripcion: 'PENDIENTE_PAGO',
          plan: 'MENSUAL_BASICO',
          montoPlanMxn: 99.00
        });
      } catch (e: any) {
        errorFK = true;
        assert(e.message.includes('violates foreign key') || e.code === '23503', 'Debe arrojar violación de FK');
      }
      assert(errorFK, 'Debió fallar la creación de vehículo con usuario inexistente');
    });

    // 3. Crear vehículo válido vinculado
    await test('Crear vehículo con clave foránea correcta', async () => {
      const vehRepo = new PostgresVehiculoRepository();
      const v = await vehRepo.crear({
        usuarioId,
        placa: placaTest,
        numeroSerie5: '54321',
        alias: 'Vehículo Integración',
        estadoSuscripcion: 'PENDIENTE_PAGO',
        plan: 'MENSUAL_BASICO',
        montoPlanMxn: 99.00
      });
      assert(v.placa === placaTest, 'La placa debe coincidir');
      vehiculoId = v.id;
    });

    // 4. Crear suscripción y validar estado PENDIENTE_PAGO
    await test('Crear suscripción en estado PENDIENTE_PAGO con NUMERIC(12,2)', async () => {
      const subRepo = new PostgresSuscripcionRepository();
      const sub = await subRepo.crear({
        usuarioId,
        vehiculoId,
        plan: 'MENSUAL_BASICO',
        montoMxn: 99.00,
        estado: 'PENDIENTE_PAGO',
        periodoInicio: new Date().toISOString()
      });
      assert(sub.estado === 'PENDIENTE_PAGO', 'Estado debe ser PENDIENTE_PAGO');
      assert(sub.montoMxn === 99.00, 'Monto debe preservar precisión decimal');
    });

    // 5. Insertar infracción con NUMERIC y claves
    const folioUnico = `FOL-${sufijoUnico}`;
    const infraccionTest: InfraccionCanonica = {
      idInterno: `mul-${sufijoUnico}`,
      vehiculoId,
      placa: placaTest,
      identificadorExterno: folioUnico,
      fuenteIdentificador: 'JALISCO_SHP_FOLIO',
      fechaInfraccion: '2026-08-28',
      fechaConsulta: new Date().toISOString(),
      concepto: 'Fotoinfracción de prueba en Periférico Sur',
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
      hashAuxiliar: `hash_${sufijoUnico}`
    };

    await test('Insertar infracción en PostgreSQL', async () => {
      const infRepo = new PostgresInfraccionRepository();
      const creada = await infRepo.crear(infraccionTest);
      assert(creada.identificadorExterno === folioUnico, 'Debe guardar folio externo');
      assert(creada.fuenteIdentificador === 'JALISCO_SHP_FOLIO', 'Debe guardar namespace');
    });

    // 6. Impedir duplicado por identificador
    await test('Impedir duplicado por restricción UNIQUE(vehiculo_id, fuente, folio)', async () => {
      const infRepo = new PostgresInfraccionRepository();
      let errorDuplicado = false;
      try {
        await infRepo.crear({
          ...infraccionTest,
          idInterno: `mul-${sufijoUnico}-dup`
        });
      } catch (e: any) {
        errorDuplicado = true;
        assert(e.message.includes('duplicate key') || e.code === '23505', 'Debe arrojar restricción de unicidad');
      }
      assert(errorDuplicado, 'Debió rechazar duplicado de infracción');
    });

    // 7. Impedir duplicado por hecho material
    await test('Impedir duplicado por hecho material en PostgreSQL', async () => {
      const infRepo = new PostgresInfraccionRepository();
      const existeMaterial = await infRepo.obtenerPorHechoMaterial(
        vehiculoId,
        infraccionTest.fechaInfraccion,
        infraccionTest.concepto
      );
      assert(Boolean(existeMaterial), 'Debe detectar que el hecho material ya existe');
    });

    // 8. Registrar revisión
    await test('Registrar revisión en tabla revisiones', async () => {
      const revRepo = new PostgresRevisionRepository();
      const rev = await revRepo.crear({
        vehiculoId,
        placa: placaTest,
        resultado: 'SIN_INFRACCIONES',
        observaciones: 'Consulta de integración exitosa.'
      });
      assert(rev.resultado === 'SIN_INFRACCIONES', 'Debe registrar resultado');
    });

    // 9. Registrar notificación
    await test('Registrar notificación en tabla notificaciones', async () => {
      const notifRepo = new PostgresNotificacionRepository();
      const notif = await notifRepo.crear({
        vehiculoId,
        infraccionId: `mul-${sufijoUnico}`,
        placa: placaTest,
        telefonoDestino: '+523311002200',
        canal: 'WHATSAPP',
        mensaje: 'Notificación de prueba PostgreSQL',
        estado: 'ENVIADO',
        proveedorMsgId: `msg_${sufijoUnico}`
      });
      assert(notif.estado === 'ENVIADO', 'Estado debe ser ENVIADO');
    });

    // 10. Registrar auditoría
    await test('Registrar evento en tabla auditoria', async () => {
      const audRepo = new PostgresAuditoriaRepository();
      const aud = await audRepo.registrar({
        tipo: 'INFRACCION_DETECTADA',
        vehiculoId,
        detalles: { pruebaPostgres: true, sufijo: sufijoUnico }
      });
      assert(aud.tipo === 'INFRACCION_DETECTADA', 'Tipo de auditoría registrado');
    });

    // 11. Rollback de una transacción
    await test('Rollback explícito de transacción en PostgreSQL ante fallo', async () => {
      let capturoFallo = false;
      const placaRollback = `RBK${sufijoUnico.substring(0, 3)}`;

      try {
        await withTransaction(async (client) => {
          const vehRepo = new PostgresVehiculoRepository(client);
          await vehRepo.crear({
            usuarioId,
            placa: placaRollback,
            numeroSerie5: '00000',
            montoPlanMxn: 99.00
          });

          // Provocamos un error forzado para gatillar ROLLBACK
          throw new Error('FALLO_FORZADO_PARA_PROBAR_ROLLBACK');
        });
      } catch (e: any) {
        if (e.message.includes('FALLO_FORZADO_PARA_PROBAR_ROLLBACK')) {
          capturoFallo = true;
        }
      }

      assert(capturoFallo, 'Debió capturar el fallo provocado');

      // Verificar que el vehículo NO existe en la base de datos
      const vehRepo = new PostgresVehiculoRepository();
      const vehiculoNoCreado = await vehRepo.obtenerPorPlaca(placaRollback);
      assert(vehiculoNoCreado === null, 'El vehículo NO debe existir debido al ROLLBACK');
    });

    // 12. Eliminar vehículo y sus dependencias en PostgreSQL respetando integridad referencial
    await test('Eliminar vehículo y sus registros relacionados en PostgreSQL', async () => {
      const vehRepo = new PostgresVehiculoRepository();
      const vehiculoAntes = await vehRepo.obtenerPorPlaca(placaTest);
      assert(Boolean(vehiculoAntes), 'El vehículo de prueba debe existir antes de la eliminación');

      const ok = await eliminarVehiculoPorPlacaPostgres(placaTest);
      assert(ok, 'La eliminación debe retornar true');

      const vehiculoDespues = await vehRepo.obtenerPorPlaca(placaTest);
      assert(vehiculoDespues === null, 'El vehículo debe haber sido eliminado de la base de datos');
    });

    // 13. Seguridad: RLS activado en las 7 tablas y bloqueo de acceso público (anon/authenticated)
    await test('RLS activo en las 7 tablas y bloqueo de rol público anon', async () => {
      const pool = initPool();
      const client = await pool.connect();
      try {
        const tablas = ['usuarios', 'vehiculos', 'suscripciones', 'infracciones', 'revisiones', 'notificaciones', 'auditoria'];
        const rlsRes = await client.query(`
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = ANY($1::text[]);
        `, [tablas]);

        for (const t of tablas) {
          const row = rlsRes.rows.find((r) => r.tablename === t);
          assert(Boolean(row && row.rowsecurity === true), `La tabla ${t} DEBE tener rowsecurity (RLS) = true`);
        }

        // Comprobar si existe el rol anon en la base de datos para validar bloqueo estricto
        const roleRes = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'anon'");
        if (roleRes.rows.length > 0) {
          for (const t of tablas) {
            let bloqueado = false;
            try {
              await client.query('BEGIN;');
              await client.query('SET ROLE anon;');
              await client.query(`SELECT * FROM ${t} LIMIT 1;`);
              await client.query('ROLLBACK;');
            } catch (err: any) {
              await client.query('ROLLBACK;');
              bloqueado = true;
            }
            assert(bloqueado, `El rol público 'anon' DEBE tener acceso denegado a la tabla ${t}`);
          }
        }
      } finally {
        client.release();
      }
    });
  } finally {
    await closePool();
  }

  console.log(detalles.join('\n'));
  console.log(`\nResumen Tests PostgreSQL: ${pasados} Pasados, ${fallados} Fallados`);
  return { omitido: false, pasados, fallados, detalles };
}

if (process.argv[1]?.endsWith('postgresIntegration.test.ts')) {
  runPostgresIntegrationTests()
    .then((r) => {
      if (r.fallados > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
