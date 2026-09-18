import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Car, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  RefreshCw,
  Search,
  CheckSquare
} from 'lucide-react';
import { RegistrarRevisionModal } from './RegistrarRevisionModal';

export const AdminPanelView: React.FC = () => {
  const [adminKey, setAdminKey] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<any>(null);

  // Modal para registrar la revisión manual
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const cargarDatos = async (clave: string) => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/datos', {
        headers: {
          'x-admin-key': clave
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Clave de administración incorrecta o no autorizada.');
      }

      setDatos(data);
      setAutenticado(true);
    } catch (err: any) {
      setError(err.message);
      setAutenticado(false);
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    cargarDatos(adminKey.trim());
  };

  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-md border border-[#E2E5E8] p-6 sm:p-7 text-left shadow-xs">
        <div className="space-y-2 mb-6">
          <div className="inline-flex p-2 bg-[#0F2A4A] text-white rounded mb-1">
            <ShieldCheck className="w-5 h-5" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-bold text-[#111827]">Acceso Administrativo</h2>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Consola técnica para control de inspecciones manuales y envío de alertas bajo mandato.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Clave de Acceso del Servidor (ADMIN_SECRET_KEY)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Clave de seguridad..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D5DCE4] rounded focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A] bg-[#F8F9FA]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2 bg-[#0F2A4A] hover:bg-[#163B66] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Autenticar y Entrar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Barra de control operativo */}
      <div className="bg-[#0F2A4A] text-white rounded-md p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono font-semibold">
              Consola Operativa de Jalisco
            </span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-mono">
              Persistencia: {datos?.modo === 'POSTGRESQL' ? 'PostgreSQL Conectado' : 'Almacenamiento Local'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mt-1">Bitácora de Inspecciones y Monitoreo</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            Cotejo responsable en el portal de la Secretaría de la Hacienda Pública de Jalisco. Registro manual con deduplicación criptográfica (SHA-256) y alerta automática por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => cargarDatos(adminKey)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <a
            href="https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-[#0F2A4A] text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
          >
            Portal Oficial SHP <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Resumen Compacto de Operaciones (En línea, no tarjetas idénticas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-[#E2E5E8] rounded-md p-4 text-xs">
        <div className="border-r border-[#E2E5E8] last:border-r-0 pr-3">
          <span className="text-[#6B7280] text-[11px] block">Vehículos Monitoreados</span>
          <span className="text-lg font-bold text-[#111827] font-mono mt-0.5 block">
            {datos?.metricas?.vehiculosActivos || 0}
          </span>
          <span className="text-[10px] text-[#4B5563]">Suscripción con mandato</span>
        </div>

        <div className="border-r border-[#E2E5E8] last:border-r-0 pr-3">
          <span className="text-[#6B7280] text-[11px] block">Infracciones Registradas</span>
          <span className="text-lg font-bold text-[#991B1B] font-mono mt-0.5 block">
            {datos?.metricas?.totalMultasRegistradas || 0}
          </span>
          <span className="text-[10px] text-[#4B5563]">Folios deduplicados</span>
        </div>

        <div className="border-r border-[#E2E5E8] last:border-r-0 pr-3">
          <span className="text-[#6B7280] text-[11px] block">Alertas Enviadas WhatsApp</span>
          <span className="text-lg font-bold text-[#166534] font-mono mt-0.5 block">
            {datos?.metricas?.totalMensajesEnviados || 0}
          </span>
          <span className="text-[10px] text-[#4B5563]">Notificación en plazo</span>
        </div>

        <div>
          <span className="text-[#6B7280] text-[11px] block">Facturación Estimada</span>
          <span className="text-lg font-bold text-[#111827] font-mono mt-0.5 block">
            ${(datos?.metricas?.ingresosRecurrentesMxn || 0).toFixed(2)} MXN
          </span>
          <span className="text-[10px] text-[#4B5563]">Ingresos recurrentes</span>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE MONITOREO VEHICULAR */}
      <div className="bg-white border border-[#E2E5E8] rounded-md overflow-hidden">
        <div className="p-4 border-b border-[#E2E5E8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-[#111827]">
              Padrón de Vehículos Activos para Revisión Oficial
            </h3>
            <p className="text-[11px] text-[#4B5563]">
              Coteja la placa y los 5 dígitos en el portal oficial y registra el resultado.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#4B5563] bg-[#F8F9FA] px-2.5 py-1 rounded border border-[#E2E5E8]">
            {datos?.vehiculos?.length || 0} vehículo(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] border-b border-[#E2E5E8] text-[#4B5563] font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Placa & VIN (5 dígitos)</th>
                <th className="px-4 py-2.5">Titular / Contacto</th>
                <th className="px-4 py-2.5">Suscripción</th>
                <th className="px-4 py-2.5">Última Revisión Oficial</th>
                <th className="px-4 py-2.5">Infracciones</th>
                <th className="px-4 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5E8]">
              {datos?.vehiculos?.map((v: any) => {
                const usuario = datos?.usuarios?.find((u: any) => u.id === v.usuarioId);
                return (
                  <tr key={v.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#111827] text-sm">{v.placa}</div>
                      <div className="font-mono text-[11px] text-[#6B7280]">Serie: *{v.numeroSerie5}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#111827]">{usuario?.nombre || 'Desconocido'}</div>
                      <div className="text-[11px] text-[#4B5563] font-mono flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-[#166534]" />
                        {usuario?.telefonoWhatsApp || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                        {v.estadoSuscripcion}
                      </span>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">{v.plan}</div>
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {v.ultimaRevisionEn ? (
                        <div>
                          <div className="font-medium text-[#111827]">
                            {new Date(v.ultimaRevisionEn).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-[10px] text-[#6B7280]">
                            {new Date(v.ultimaRevisionEn).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} hrs
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#991B1B] font-semibold text-[11px]">
                          Pendiente de primera revisión
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        v.totalMultasRegistradas > 0 
                          ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' 
                          : 'bg-[#F8F9FA] text-[#4B5563] border border-[#E2E5E8]'
                      }`}>
                        {v.totalMultasRegistradas} localizada(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setVehiculoSeleccionado(v);
                          setShowRevisionModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#163B66] text-white font-semibold rounded text-xs transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Registrar Revisión
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial Técnico: Infracciones Recientes y Bitácora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Infracciones Recientes */}
        <div className="bg-white border border-[#E2E5E8] rounded-md p-4">
          <h4 className="text-xs font-bold text-[#111827] pb-2 border-b border-[#E2E5E8]">
            Infracciones Notificadas Recientes
          </h4>
          <div className="space-y-2 mt-3">
            {datos?.multas?.slice(0, 5).map((m: any) => (
              <div key={m.id} className="p-2.5 bg-[#F8F9FA] rounded border border-[#E2E5E8] text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111827]">{m.placa}</span>
                    <span className="font-mono text-[10px] bg-[#EEF2F6] px-1.5 py-0.2 rounded text-[#0F2A4A] border border-[#D5DCE4]">
                      {m.folioOficial}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">{m.fechaInfraccion}</span>
                  </div>
                  <div className="text-[#4B5563] text-[11px] mt-0.5 line-clamp-1">{m.motivoInfraccion}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono font-bold text-[#111827]">${m.montoOficialMxn.toFixed(2)}</div>
                  {m.tieneDescuentoProntoPago && (
                    <div className="text-[10px] text-[#166534] font-semibold">
                      Pronto pago: ${m.montoConDescuentoMxn.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {datos?.multas?.length === 0 && (
              <div className="py-4 text-center text-[#6B7280] text-xs">
                No hay infracciones registradas en la base de datos.
              </div>
            )}
          </div>
        </div>

        {/* Bitácora de Inspecciones */}
        <div className="bg-white border border-[#E2E5E8] rounded-md p-4">
          <h4 className="text-xs font-bold text-[#111827] pb-2 border-b border-[#E2E5E8]">
            Bitácora de Cotejos en Portal Oficial
          </h4>
          <div className="space-y-2 mt-3">
            {datos?.logsRevisiones?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="p-2 bg-[#F8F9FA] rounded border border-[#E2E5E8] text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    log.resultado === 'SIN_INFRACCIONES' ? 'bg-[#166534]' : 'bg-[#991B1B]'
                  }`} />
                  <span className="font-mono font-bold text-[#111827]">{log.placa}</span>
                  <span className="text-[#4B5563] truncate">{log.observaciones}</span>
                </div>
                <span className="text-[10px] text-[#6B7280] font-mono shrink-0 ml-2">
                  {new Date(log.fechaRevision).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Registro Manual */}
      <RegistrarRevisionModal
        isOpen={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setVehiculoSeleccionado(null);
        }}
        vehiculo={vehiculoSeleccionado}
        adminKey={adminKey}
        onSuccess={() => cargarDatos(adminKey)}
      />
    </div>
  );
};

