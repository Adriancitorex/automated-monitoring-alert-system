import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getRepositories, obtenerEstadoConexion } from './src/db/repositoriesFactory';
import { InfraccionCanonica } from './src/domain/types';

dotenv.config();

const app = express();
const PORT = 3000;
const APP_VERSION = '1.0.0';

app.use(express.json());

// ==========================================
// SERVICIO DE NOTIFICACIONES WHATSAPP
// ==========================================
class WhatsAppService {
  static async enviarAlertaMulta(
    telefono: string,
    placa: string,
    alias: string,
    folio: string,
    monto: number,
    montoConDescuento: number,
    fechaLimite?: string
  ): Promise<{ exito: boolean; msgId: string; error?: string }> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const textoMensaje = `🚨 *Alerta AvisaMultas Jalisco*\n\nHemos completado la revisión de tu vehículo *${alias || placa}* (Placa: *${placa}*) en el portal oficial y localizamos una infracción reciente:\n\n📄 *Folio:* ${folio}\n💰 *Monto Oficial:* $${monto.toFixed(2)} MXN\n⚡ *Beneficio Pronto Pago:* $${montoConDescuento.toFixed(2)} MXN\n${fechaLimite ? `⏳ *Fecha límite pronto pago:* ${fechaLimite}\n` : ''}\n👉 Consulta y paga en el portal oficial de la Secretaría de la Hacienda Pública de Jalisco.`;

    if (token && phoneId) {
      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: telefono.replace(/\+/g, '').trim(),
            type: 'text',
            text: { body: textoMensaje }
          })
        });

        const resData: any = await response.json();
        if (response.ok && resData.messages?.[0]?.id) {
          return { exito: true, msgId: resData.messages[0].id };
        } else {
          return { exito: false, msgId: '', error: resData.error?.message || 'Error en Meta Cloud API' };
        }
      } catch (err: any) {
        return { exito: false, msgId: '', error: err.message };
      }
    }

    // Modo simulado para pruebas de desarrollo cuando no hay tokens en el entorno
    const mockId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { exito: true, msgId: mockId };
  }
}

// ==========================================
// ENDPOINTS PÚBLICOS DEL SAAS
// ==========================================

/**
 * 2 & 9. HEALTH CHECK EXPLICITO
 * Informa:
 * - modo actual (DEMO_MEMORY | POSTGRESQL)
 * - estado de PostgreSQL (POSTGRESQL_CONNECTED | POSTGRESQL_UNAVAILABLE | DEMO_MEMORY)
 * - cantidad de vehículos
 * - versión de aplicación
 * Sin exponer secretos ni DATABASE_URL.
 */
app.get('/api/health', async (req, res) => {
  try {
    const estadoConexion = await obtenerEstadoConexion();
    const repos = await getRepositories();

    let cantidadVehiculos = 0;
    try {
      const vehiculos = await repos.vehiculos.listarTodos();
      cantidadVehiculos = vehiculos.length;
    } catch {
      // Si la base está inaccesible
    }

    const esSaludable = estadoConexion.estado !== 'POSTGRESQL_UNAVAILABLE';

    res.status(esSaludable ? 200 : 503).json({
      status: esSaludable ? 'ok' : 'degraded',
      modo: repos.modo,
      estadoPostgres: estadoConexion.estado,
      cantidadVehiculos,
      version: APP_VERSION,
      servicio: 'AvisaMultas Jalisco - Monitoreo Vehicular',
      detalles: estadoConexion.detalles,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      estadoPostgres: 'POSTGRESQL_UNAVAILABLE',
      error: 'Fallo al verificar el estado de persistencia.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 4. ONBOARDING TRANSACCIONAL ATÓMICO (MANDATO EXPRESO)
 * Ejecuta usuario + vehículo + suscripción en una sola transacción atómica.
 * Si falla algo, revierte todo para evitar huérfanos.
 */
app.post('/api/onboarding', async (req, res) => {
  try {
    const { nombre, email, telefonoWhatsApp, placa, numeroSerie5, alias, plan } = req.body;

    if (!nombre || !email || !telefonoWhatsApp || !placa || !numeroSerie5) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
    }

    if (numeroSerie5.trim().length !== 5) {
      return res.status(400).json({ error: 'Debes proporcionar exactamente los últimos 5 dígitos del número de serie (VIN).' });
    }

    const ipOrigen = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const repos = await getRepositories();

    const resultado = await repos.ejecutarOnboardingTransaccional({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefonoWhatsApp: telefonoWhatsApp.trim(),
      placa: placa.trim(),
      numeroSerie5: numeroSerie5.trim(),
      alias: alias?.trim(),
      plan: plan === 'ANUAL_AHORRO' ? 'ANUAL_AHORRO' : 'MENSUAL_BASICO',
      ipOrigen
    });

    // PRIVACIDAD (Punto 8): No devolver número de serie ni IP en la respuesta
    const vehiculoPrivado = {
      id: resultado.vehiculo.id,
      placa: resultado.vehiculo.placa,
      alias: resultado.vehiculo.alias,
      estadoSuscripcion: resultado.vehiculo.estadoSuscripcion,
      plan: resultado.vehiculo.plan,
      montoPlanMxn: resultado.vehiculo.montoPlanMxn,
      creadoEn: resultado.vehiculo.creadoEn
    };

    res.json({
      exito: true,
      mensaje: 'Vehículo registrado y servicio activado con éxito.',
      usuario: {
        id: resultado.usuario.id,
        nombre: resultado.usuario.nombre,
        email: resultado.usuario.email
      },
      vehiculo: vehiculoPrivado,
      suscripcion: {
        id: resultado.suscripcion.id,
        plan: resultado.suscripcion.plan,
        estado: resultado.suscripcion.estado,
        montoMxn: resultado.suscripcion.montoMxn
      }
    });
  } catch (err: any) {
    if (err.message?.includes('ya se encuentra registrada')) {
      return res.status(409).json({ error: err.message });
    }
    if (err.message?.includes('POSTGRESQL_UNAVAILABLE')) {
      return res.status(503).json({ error: 'Infraestructura no disponible temporalmente. Intente más tarde.' });
    }
    res.status(500).json({ error: err.message || 'Error durante el onboarding' });
  }
});

/**
 * 8. PRIVACIDAD - CONSULTA DE ESTADO POR PLACA (PORTAL DEL CLIENTE)
 * Regla: No devolver innecesariamente número de serie, teléfono, IP ni consentimiento.
 */
app.get('/api/vehiculo/estado/:placa', async (req, res) => {
  try {
    const placa = req.params.placa.toUpperCase().trim();
    const repos = await getRepositories();

    const vehiculo = await repos.vehiculos.obtenerPorPlaca(placa);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no registrado en el sistema.' });
    }

    const usuario = await repos.usuarios.obtenerPorId(vehiculo.usuarioId);
    const multas = await repos.infracciones.listarPorVehiculoId(vehiculo.id);

    // FILTRO DE PRIVACIDAD: Sanitización estricta para endpoint de cliente
    res.json({
      vehiculo: {
        id: vehiculo.id,
        placa: vehiculo.placa,
        alias: vehiculo.alias,
        estadoSuscripcion: vehiculo.estadoSuscripcion,
        plan: vehiculo.plan,
        ultimaRevisionEn: vehiculo.ultimaRevisionEn,
        proximaRevisionEstimadaEn: vehiculo.proximaRevisionEstimadaEn,
        totalMultasRegistradas: vehiculo.totalMultasRegistradas
        // NOTA DE PRIVACIDAD: numeroSerie5 está intencionalmente OMITIDO aquí
      },
      usuario: {
        nombre: usuario?.nombre || 'Titular'
        // NOTA DE PRIVACIDAD: telefonoWhatsApp y email están intencionalmente OMITIDOS aquí
      },
      multas: multas.map((m) => ({
        id: m.idInterno,
        placa: m.placa,
        folioOficial: m.identificadorExterno,
        fuenteIdentificador: m.fuenteIdentificador,
        fechaInfraccion: m.fechaInfraccion,
        motivoInfraccion: m.concepto,
        montoOficialMxn: m.montoOriginalMxn,
        montoConDescuentoMxn: m.montoVigenteMxn,
        tieneDescuentoProntoPago: m.porcentajeDescuento > 0,
        porcentajeDescuento: m.porcentajeDescuento,
        fechaLimiteProntoPago: m.fechaLimiteDescuento,
        tipoInfraccion: m.tipoInfraccion,
        autoridad: m.autoridad,
        urlOficialPago: m.urlOficialPago
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al consultar estado del vehículo.' });
  }
});

// ==========================================
// PANEL ADMINISTRATIVO PRIVADO (SOLO TÚ)
// ==========================================

const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const claveRecibida = req.headers['x-admin-key'];

  if (!adminSecret || adminSecret.trim() === '') {
    return res.status(503).json({
      error: 'Acceso deshabilitado: La variable ADMIN_SECRET_KEY no está configurada en el entorno del servidor.'
    });
  }

  if (claveRecibida !== adminSecret) {
    return res.status(401).json({ error: 'Clave de administración incorrecta.' });
  }

  next();
};

// 1. Obtener datos del panel administrativo (Acceso completo autorizado)
app.get('/api/admin/datos', requireAdminAuth, async (req, res) => {
  try {
    const repos = await getRepositories();

    const [usuarios, vehiculos, infracciones, notificaciones, revisiones] = await Promise.all([
      repos.usuarios.listarTodos(),
      repos.vehiculos.listarTodos(),
      repos.infracciones.listarTodas(),
      repos.notificaciones.listarTodas(),
      repos.revisiones.listarRecientes(50)
    ]);

    // Adaptador de formato para compatibilidad con vistas de frontend existentes
    const multasFormateadas = infracciones.map((m) => ({
      id: m.idInterno,
      vehiculoId: m.vehiculoId,
      placa: m.placa,
      hashDeduplicacion: m.hashAuxiliar,
      folioOficial: m.identificadorExterno,
      fuenteIdentificador: m.fuenteIdentificador,
      fechaInfraccion: m.fechaInfraccion,
      motivoInfraccion: m.concepto,
      montoOficialMxn: m.montoOriginalMxn,
      tieneDescuentoProntoPago: m.porcentajeDescuento > 0,
      porcentajeDescuento: m.porcentajeDescuento,
      montoConDescuentoMxn: m.montoVigenteMxn,
      fechaLimiteProntoPago: m.fechaLimiteDescuento,
      notificadoWhatsApp: true,
      registradoPorAdminEn: m.fechaConsulta
    }));

    const metricas = {
      totalVehiculos: vehiculos.length,
      vehiculosActivos: vehiculos.filter((v) => v.estadoSuscripcion === 'ACTIVA').length,
      totalMultasRegistradas: infracciones.length,
      totalMensajesEnviados: notificaciones.filter((n) => n.estado === 'ENVIADO').length,
      ingresosRecurrentesMxn: vehiculos
        .filter((v) => v.estadoSuscripcion === 'ACTIVA')
        .reduce((acc, v) => acc + (v.montoPlanMxn || 99), 0)
    };

    res.json({
      modo: repos.modo,
      usuarios,
      vehiculos,
      multas: multasFormateadas,
      notificaciones,
      logsRevisiones: revisiones,
      metricas
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener datos administrativos.' });
  }
});

// 2. Registrar Revisión Manual de un Vehículo
app.post('/api/admin/registrar-revision', requireAdminAuth, async (req, res) => {
  try {
    const {
      vehiculoId,
      huboInfraccion,
      folioOficial,
      fuenteIdentificador,
      fechaInfraccion,
      motivoInfraccion,
      montoOficial,
      tieneDescuento,
      porcentajeDescuento,
      fechaLimiteDescuento,
      observaciones
    } = req.body;

    const repos = await getRepositories();
    const vehiculo = await repos.vehiculos.obtenerPorId(vehiculoId);

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    const fechaRevisionActual = new Date().toISOString();
    const proximaEstimada = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await repos.vehiculos.actualizarRevision(vehiculo.id, fechaRevisionActual, proximaEstimada);

    // Caso A: No se encontró infracción en el portal oficial
    if (!huboInfraccion) {
      await repos.revisiones.crear({
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        resultado: 'SIN_INFRACCIONES',
        observaciones: observaciones || 'Consulta manual en portal oficial de Jalisco sin adeudos pendientes.'
      });

      await repos.auditoria.registrar({
        tipo: 'REVISION_EJECUTADA',
        entidadId: vehiculo.id,
        vehiculoId: vehiculo.id,
        detalles: { resultado: 'SIN_INFRACCIONES', observaciones }
      });

      return res.json({
        exito: true,
        mensaje: `Revisión registrada para ${vehiculo.placa}. Vehículo al corriente sin infracciones.`
      });
    }

    // Caso B: Infracción detectada
    if (!folioOficial || !fechaInfraccion || !motivoInfraccion || !montoOficial) {
      return res.status(400).json({
        error: 'Para registrar una infracción debes capturar folio, fecha, motivo y monto oficial.'
      });
    }

    const folioLimpio = folioOficial.trim();
    const namespaceFuente = (fuenteIdentificador || 'JALISCO_SHP_FOLIO').trim().toUpperCase();
    const fechaLimpia = fechaInfraccion.trim();
    const montoNum = Number(montoOficial);
    const porcentajeDesc = tieneDescuento ? Number(porcentajeDescuento) || 50 : 0;
    const montoConDescuento = tieneDescuento ? montoNum * (1 - porcentajeDesc / 100) : montoNum;

    // 7. DEDUPLICACIÓN MULTIVARIADA DE EXTREMO A EXTREMO
    // Se delega al repositorio, que verifica (vehiculo_id, fuente_identificador, identificador_externo)
    // y también comprueba hecho material.
    const idInfraccion = `mul-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const nuevaInfraccion: InfraccionCanonica = {
      idInterno: idInfraccion,
      vehiculoId: vehiculo.id,
      placa: vehiculo.placa,
      identificadorExterno: folioLimpio,
      fuenteIdentificador: namespaceFuente,
      fechaInfraccion: fechaLimpia,
      fechaConsulta: fechaRevisionActual,
      concepto: motivoInfraccion.trim(),
      tipoInfraccion: 'FOTOINFRACCION_VELOCIDAD',
      autoridad: 'ESTATAL_POLICIA_VIAL',
      montoOriginalMxn: montoNum,
      montoVigenteMxn: montoConDescuento,
      recargosMxn: 0.00,
      gastosEjecucionMxn: 0.00,
      descuentoVigenteMxn: tieneDescuento ? montoNum - montoConDescuento : 0,
      porcentajeDescuento: porcentajeDesc,
      fechaLimiteDescuento: fechaLimiteDescuento || undefined,
      nivelConfianzaDescuento: tieneDescuento ? 'CERTEZA_LEGAL' : 'UNKNOWN',
      reglaDescuentoAplicada: tieneDescuento ? 'Beneficio por pronto pago' : undefined,
      fuenteDato: 'MANUAL',
      hashAuxiliar: `${vehiculo.id}:${namespaceFuente}:${folioLimpio}`
    };

    try {
      await repos.infracciones.crear(nuevaInfraccion);
    } catch (err: any) {
      if (err.message?.includes('unicidad') || err.message?.includes('duplicate key')) {
        await repos.auditoria.registrar({
          tipo: 'INFRACCION_DUPLICADA_BLOQUEADA',
          entidadId: vehiculo.id,
          vehiculoId: vehiculo.id,
          detalles: { folio: folioLimpio, fuente: namespaceFuente, motivo: err.message }
        });
        return res.status(409).json({
          error: `La infracción con folio ${folioLimpio} bajo la fuente ${namespaceFuente} ya estaba registrada en el sistema. Se evitó duplicidad.`
        });
      }
      throw err;
    }

    await repos.vehiculos.incrementarTotalMultas(vehiculo.id);

    // Disparar Notificación WhatsApp
    const usuario = await repos.usuarios.obtenerPorId(vehiculo.usuarioId);
    let resultadoEnvio: { exito: boolean; msgId: string; error?: string } = {
      exito: false,
      msgId: '',
      error: 'Usuario no encontrado'
    };

    if (usuario) {
      resultadoEnvio = await WhatsAppService.enviarAlertaMulta(
        usuario.telefonoWhatsApp,
        vehiculo.placa,
        vehiculo.alias || vehiculo.placa,
        nuevaInfraccion.identificadorExterno,
        nuevaInfraccion.montoOriginalMxn,
        nuevaInfraccion.montoVigenteMxn,
        nuevaInfraccion.fechaLimiteDescuento
      );

      await repos.notificaciones.crear({
        infraccionId: nuevaInfraccion.idInterno,
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        telefonoDestino: usuario.telefonoWhatsApp,
        canal: 'WHATSAPP',
        mensaje: `Alerta registrada para ${vehiculo.placa} - Folio ${nuevaInfraccion.identificadorExterno}`,
        estado: resultadoEnvio.exito ? 'ENVIADO' : 'FALLIDO',
        proveedorMsgId: resultadoEnvio.msgId
      });
    }

    await repos.revisiones.crear({
      vehiculoId: vehiculo.id,
      placa: vehiculo.placa,
      resultado: 'NUEVA_INFRACCION_REGISTRADA',
      observaciones: `Infracción ${folioLimpio} [${namespaceFuente}] registrada. Alerta WhatsApp ${resultadoEnvio.exito ? 'enviada' : 'falló'}. ${observaciones || ''}`
    });

    await repos.auditoria.registrar({
      tipo: 'INFRACCION_DETECTADA',
      entidadId: nuevaInfraccion.idInterno,
      usuarioId: usuario?.id,
      vehiculoId: vehiculo.id,
      detalles: {
        folio: folioLimpio,
        fuente: namespaceFuente,
        monto: nuevaInfraccion.montoOriginalMxn,
        notificacionExitosa: resultadoEnvio.exito
      }
    });

    res.json({
      exito: true,
      mensaje: `Infracción ${folioLimpio} registrada con éxito. Notificación enviada a ${usuario?.telefonoWhatsApp}.`,
      multa: nuevaInfraccion,
      notificacionWhatsApp: resultadoEnvio
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar infracción.' });
  }
});

// 3. Eliminar Vehículo y sus dependencias (Panel Administrativo)
app.delete('/api/admin/vehiculo/:placa', requireAdminAuth, async (req, res) => {
  try {
    const placa = req.params.placa;
    if (!placa) {
      return res.status(400).json({ error: 'Debes proporcionar la placa a eliminar.' });
    }

    const repos = await getRepositories();
    const eliminado = await repos.eliminarVehiculoPorPlaca(placa);

    if (!eliminado) {
      return res.status(404).json({ error: `Vehículo con placa ${placa} no encontrado.` });
    }

    res.json({
      exito: true,
      mensaje: `Vehículo ${placa.toUpperCase()} y todos sus registros asociados fueron eliminados correctamente.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar vehículo.' });
  }
});

// 4. Reinicio de Datos Demo (Protegido en Producción)
app.post('/api/admin/reset-demo', requireAdminAuth, async (req, res) => {
  try {
    const repos = await getRepositories();

    // PROTECCIÓN DE SEGURIDAD ESTRICTA:
    // En producción (cuando opera contra PostgreSQL real), resetear los datos borraría clientes reales
    // que están pagando. Por tanto, está estrictamente denegado a menos que se defina ALLOW_DEMO_RESET=true.
    if (repos.modo === 'POSTGRESQL') {
      const resetPermitido = process.env.ALLOW_DEMO_RESET === 'true';
      if (!resetPermitido) {
        return res.status(403).json({
          error: 'Operación denegada en producción: El reinicio de datos en PostgreSQL está desactivado por seguridad para proteger a los usuarios reales. Para habilitarlo en entornos de pruebas, define ALLOW_DEMO_RESET=true en las variables de entorno del servidor.'
        });
      }
    }

    await repos.reiniciarDatosDemo();

    res.json({
      exito: true,
      mensaje: `Datos ${repos.modo === 'POSTGRESQL' ? 'de PostgreSQL' : 'en memoria'} reiniciados exitosamente.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al reiniciar datos.' });
  }
});

// ==========================================
// VITE MIDDLEWARE Y ARRANQUE
// ==========================================
async function startServer() {
  const estadoConexion = await obtenerEstadoConexion();

  console.log('====================================================');
  console.log('       AVISAMULTAS JALISCO - MOTOR DE PERSISTENCIA  ');
  console.log('====================================================');
  if (estadoConexion.estado === 'POSTGRESQL_CONNECTED') {
    console.log('🟢 MODO ACTIVO: POSTGRESQL (Base de datos remota conectada)');
    console.log(`📡 DETALLES: ${estadoConexion.detalles}`);
  } else if (estadoConexion.estado === 'POSTGRESQL_UNAVAILABLE') {
    console.log('🔴 MODO ACTIVO: POSTGRESQL CONFIGURADO PERO NO ACCESIBLE');
    console.log(`⚠️ ERROR: ${estadoConexion.error || estadoConexion.detalles}`);
    console.log('🚫 REGLA DE ORO: Fallback a memoria BLOQUEADO para proteger la integridad.');
  } else {
    console.log('🟡 MODO ACTIVO: DEMO_MEMORY (Almacenamiento volátil en memoria)');
    console.log('ℹ️ DATABASE_URL no configurada. Operando en memoria para desarrollo local.');
  }
  console.log('====================================================');

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AvisaMultas Jalisco activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
