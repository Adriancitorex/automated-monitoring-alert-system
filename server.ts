import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { obtenerRepositorios, obtenerEstadoConexion } from './src/db/repositoriesFactory';
import { InfraccionCanonica } from './src/domain/types';

dotenv.config();

const app = express();
const PORT = 3000;
const APP_VERSION = '1.0.0';

app.use(express.json());

class ServicioWhatsApp {
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

    const mockId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { exito: true, msgId: mockId };
  }
}

const WhatsAppService = ServicioWhatsApp;

// Verificación de estado del servicio y capa de persistencia
app.get('/api/health', async (req, res) => {
  try {
    const estadoConexion = await obtenerEstadoConexion();
    const repos = await obtenerRepositorios();

    let cantidadVehiculos = 0;
    try {
      const vehiculos = await repos.vehiculos.listarTodos();
      cantidadVehiculos = vehiculos.length;
    } catch {
      // Base no disponible para lectura de métricas
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

// Registro inicial atómico de usuario, vehículo y suscripción
app.post('/api/onboarding', async (req, res) => {
  try {
    const { nombre, email, telefonoWhatsApp, placa, numeroSerie5, alias, plan } = req.body;

    if (!nombre || !email || !telefonoWhatsApp || !placa || !numeroSerie5) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, email, telefonoWhatsApp, placa, numeroSerie5.' });
    }

    if (numeroSerie5.trim().length !== 5) {
      return res.status(400).json({ error: 'El número de serie debe contener exactamente 5 caracteres.' });
    }

    const ipOrigen = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const repos = await obtenerRepositorios();

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
      mensaje: 'Vehículo registrado y servicio activado exitosamente.',
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
      return res.status(503).json({ error: 'Base de datos temporalmente no disponible.' });
    }
    res.status(500).json({ error: err.message || 'Error en proceso de onboarding.' });
  }
});

// Consulta de estado vehicular para el conductor (datos sanitizados)
app.get('/api/vehiculo/estado/:placa', async (req, res) => {
  try {
    const placa = req.params.placa.toUpperCase().trim();
    const repos = await obtenerRepositorios();

    const vehiculo = await repos.vehiculos.obtenerPorPlaca(placa);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    const usuario = await repos.usuarios.obtenerPorId(vehiculo.usuarioId);
    const multas = await repos.infracciones.listarPorVehiculoId(vehiculo.id);

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
      },
      usuario: {
        nombre: usuario?.nombre || 'Titular'
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

// Middleware de autorización para operaciones de administración
const requerirAutenticacionAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const claveRecibida = req.headers['x-admin-key'];

  if (!adminSecret || adminSecret.trim() === '') {
    return res.status(503).json({
      error: 'ADMIN_SECRET_KEY no configurada en el entorno.'
    });
  }

  if (claveRecibida !== adminSecret) {
    return res.status(401).json({ error: 'Clave de administración inválida.' });
  }

  next();
};

const requireAdminAuth = requerirAutenticacionAdmin;

// Consulta consolidada para panel de administración
app.get('/api/admin/datos', requerirAutenticacionAdmin, async (req, res) => {
  try {
    const repos = await obtenerRepositorios();

    const [usuarios, vehiculos, infracciones, notificaciones, revisiones] = await Promise.all([
      repos.usuarios.listarTodos(),
      repos.vehiculos.listarTodos(),
      repos.infracciones.listarTodas(),
      repos.notificaciones.listarTodas(),
      repos.revisiones.listarRecientes(50)
    ]);

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

// Registro de verificación periódica o hallazgo de infracción
app.post('/api/admin/registrar-revision', requerirAutenticacionAdmin, async (req, res) => {
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

    const repos = await obtenerRepositorios();
    const vehiculo = await repos.vehiculos.obtenerPorId(vehiculoId);

    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    const fechaRevisionActual = new Date().toISOString();
    const proximaEstimada = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await repos.vehiculos.actualizarRevision(vehiculo.id, fechaRevisionActual, proximaEstimada);

    if (!huboInfraccion) {
      await repos.revisiones.crear({
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        resultado: 'SIN_INFRACCIONES',
        observaciones: observaciones || 'Consulta manual en portal oficial sin adeudos pendientes.'
      });

      await repos.auditoria.registrar({
        tipo: 'REVISION_EJECUTADA',
        entidadId: vehiculo.id,
        vehiculoId: vehiculo.id,
        detalles: { resultado: 'SIN_INFRACCIONES', observaciones }
      });

      return res.json({
        exito: true,
        mensaje: `Revisión registrada para ${vehiculo.placa}. Vehículo al corriente.`
      });
    }

    if (!folioOficial || !fechaInfraccion || !motivoInfraccion || !montoOficial) {
      return res.status(400).json({
        error: 'Campos requeridos: folioOficial, fechaInfraccion, motivoInfraccion, montoOficial.'
      });
    }

    const folioLimpio = folioOficial.trim();
    const namespaceFuente = (fuenteIdentificador || 'JALISCO_SHP_FOLIO').trim().toUpperCase();
    const fechaLimpia = fechaInfraccion.trim();
    const montoNum = Number(montoOficial);
    const porcentajeDesc = tieneDescuento ? Number(porcentajeDescuento) || 50 : 0;
    const montoConDescuento = tieneDescuento ? montoNum * (1 - porcentajeDesc / 100) : montoNum;

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
          error: `Infracción con folio ${folioLimpio} en fuente ${namespaceFuente} ya registrada. Operación omitida por duplicidad.`
        });
      }
      throw err;
    }

    await repos.vehiculos.incrementarTotalMultas(vehiculo.id);

    const usuario = await repos.usuarios.obtenerPorId(vehiculo.usuarioId);
    let resultadoEnvio: { exito: boolean; msgId: string; error?: string } = {
      exito: false,
      msgId: '',
      error: 'Usuario no encontrado'
    };

    if (usuario) {
      resultadoEnvio = await ServicioWhatsApp.enviarAlertaMulta(
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
      observaciones: `Infracción ${folioLimpio} [${namespaceFuente}] registrada. Alerta WhatsApp: ${resultadoEnvio.exito ? 'enviada' : 'fallida'}. ${observaciones || ''}`
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
      mensaje: `Infracción ${folioLimpio} registrada. Notificación a ${usuario?.telefonoWhatsApp}.`,
      multa: nuevaInfraccion,
      notificacionWhatsApp: resultadoEnvio
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar infracción.' });
  }
});

// Eliminación de vehículo y registros asociados
app.delete('/api/admin/vehiculo/:placa', requerirAutenticacionAdmin, async (req, res) => {
  try {
    const placa = req.params.placa;
    if (!placa) {
      return res.status(400).json({ error: 'Placa requerida.' });
    }

    const repos = await obtenerRepositorios();
    const eliminado = await repos.eliminarVehiculoPorPlaca(placa);

    if (!eliminado) {
      return res.status(404).json({ error: `Vehículo con placa ${placa} no encontrado.` });
    }

    res.json({
      exito: true,
      mensaje: `Vehículo ${placa.toUpperCase()} y registros dependientes eliminados.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar vehículo.' });
  }
});

// Restablecimiento de datos de demostración
app.post('/api/admin/reset-demo', requerirAutenticacionAdmin, async (req, res) => {
  try {
    const repos = await obtenerRepositorios();

    if (repos.modo === 'POSTGRESQL') {
      const resetPermitido = process.env.ALLOW_DEMO_RESET === 'true';
      if (!resetPermitido) {
        return res.status(403).json({
          error: 'Reinicio denegado en producción. Requiere ALLOW_DEMO_RESET=true.'
        });
      }
    }

    await repos.reiniciarDatosDemo();

    res.json({
      exito: true,
      mensaje: `Datos ${repos.modo === 'POSTGRESQL' ? 'de PostgreSQL' : 'en memoria'} reiniciados.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al reiniciar datos.' });
  }
});

async function startServer() {
  const estadoConexion = await obtenerEstadoConexion();

  if (estadoConexion.estado === 'POSTGRESQL_CONNECTED') {
    console.log(`[db] Modo activo: PostgreSQL. ${estadoConexion.detalles}`);
  } else if (estadoConexion.estado === 'POSTGRESQL_UNAVAILABLE') {
    console.error(`[db] PostgreSQL configurado pero no accesible: ${estadoConexion.error || estadoConexion.detalles}`);
    console.error('[db] Fallback a memoria bloqueado por consistencia de datos.');
  } else {
    console.log('[db] Modo activo: Memoria volátil. DATABASE_URL no configurada.');
  }

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
    console.log(`AvisaMultas Jalisco en servicio: http://0.0.0.0:${PORT}`);
  });
}

startServer();
