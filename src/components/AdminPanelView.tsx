import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Car, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  DollarSign, 
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
        throw new Error(data.error || 'Error al autenticar o cargar datos.');
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
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 bg-slate-900 text-amber-400 rounded-2xl mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Panel Administrativo</h2>
          <p className="text-xs text-slate-500">
            Control de operaciones semi-manuales y registro de revisiones asistidas.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Clave de Administrador (ADMIN_SECRET_KEY)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Ingresa tu clave secreta del servidor..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de cabecera del modo operativo */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-bold uppercase">
              Operación Semi-Manual Asistida
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              datos?.modo === 'POSTGRESQL' 
                ? 'bg-emerald-400 text-slate-950' 
                : 'bg-indigo-400 text-slate-950'
            }`}>
              Persistencia: {datos?.modo === 'POSTGRESQL' ? 'PostgreSQL Conectado' : 'Demo / Memoria'}
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1">Panel de Operaciones y Revisiones</h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            Las consultas se realizan de forma manual y responsable en el portal público de Jalisco bajo mandato expreso del usuario. Registra aquí los resultados de cada inspección para activar deduplicación y alertas por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarDatos(adminKey)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors text-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <a
            href="https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors"
          >
            Portal Oficial SHP <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Vehículos Activos</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {datos?.metricas?.vehiculosActivos || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Suscripciones pagadas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Multas Registradas</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {datos?.metricas?.totalMultasRegistradas || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Deduplicadas por SHA-256</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Alertas WhatsApp</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {datos?.metricas?.totalMensajesEnviados || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Enviadas al instante</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Ingresos Recurrentes</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${(datos?.metricas?.ingresosRecurrentesMxn || 0).toFixed(2)} MXN
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Facturación proyectada</div>
        </div>
      </div>

      {/* Tabla de Vehículos para Revisión */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Vehículos en Monitoreo (Mandato Activo)
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona un vehículo para cotejar en el portal oficial de Jalisco y registrar la revisión.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Total: {datos?.vehiculos?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-500 text-[10px]">
              <tr>
                <th className="px-5 py-3">Placa & Serie</th>
                <th className="px-5 py-3">Vehículo / Alias</th>
                <th className="px-5 py-3">Propietario & Contacto</th>
                <th className="px-5 py-3">Última Revisión</th>
                <th className="px-5 py-3">Historial Multas</th>
                <th className="px-5 py-3 text-right">Acción Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datos?.vehiculos?.map((v: any) => {
                const usuario = datos?.usuarios?.find((u: any) => u.id === v.usuarioId);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-black text-slate-900 text-sm">{v.placa}</div>
                      <div className="font-mono text-[10px] text-slate-400">Serie: *{v.numeroSerie5}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{v.alias || 'Sin alias'}</div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {v.estadoSuscripcion} • {v.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{usuario?.nombre || 'Desconocido'}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        {usuario?.telefonoWhatsApp}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {v.ultimaRevisionEn ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-700">
                            {new Date(v.ultimaRevisionEn).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(v.ultimaRevisionEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-bold">Pendiente de primera revisión</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        v.totalMultasRegistradas > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.totalMultasRegistradas} detectada(s)
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setVehiculoSeleccionado(v);
                          setShowRevisionModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[11px] shadow-2xs transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5" /> Registrar Revisión Manual
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Infracciones y Logs de Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Infracciones Registradas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
            Infracciones Recientes Registradas y Notificadas
          </h3>
          <div className="space-y-3">
            {datos?.multas?.slice(0, 5).map((m: any) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{m.placa}</span>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-sm text-slate-700">
                      {m.folioOficial}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.fechaInfraccion}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1 line-clamp-1">{m.motivoInfraccion}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono font-bold text-slate-900">${m.montoOficialMxn.toFixed(2)}</div>
                  {m.tieneDescuentoProntoPago && (
                    <div className="text-[10px] text-emerald-600 font-bold">
                      Pronto pago: ${m.montoConDescuentoMxn.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {datos?.multas?.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No hay infracciones registradas aún.
              </div>
            )}
          </div>
        </div>

        {/* Bitácora de Revisiones */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
            Bitácora de Inspecciones Manuales Realizadas
          </h3>
          <div className="space-y-2">
            {datos?.logsRevisiones?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    log.resultado === 'SIN_INFRACCIONES' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span className="font-mono font-bold text-slate-800">{log.placa}</span>
                  <span className="text-slate-600">{log.observaciones}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                  {new Date(log.fechaRevision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
