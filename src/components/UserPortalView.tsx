import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Car, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Sparkles,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { AvisoPrivacidadModal } from './AvisoPrivacidadModal';

interface UserPortalViewProps {
  onOpenRegister: () => void;
}

export const UserPortalView: React.FC<UserPortalViewProps> = ({ onOpenRegister }) => {
  const [placaBusqueda, setPlacaBusqueda] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvisoModal, setShowAvisoModal] = useState(false);

  const consultarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placaBusqueda.trim()) return;

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch(`/api/vehiculo/estado/${encodeURIComponent(placaBusqueda.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se encontró el vehículo en monitoreo.');
      }

      setResultado(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Servicio para Jalisco, México
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Revisamos periódicamente el estado de tu vehículo <span className="text-amber-500">con tu autorización</span>.
          </h2>

          <p className="text-slate-600 text-base leading-relaxed">
            Con tu mandato expreso, consultamos en tu nombre la información pública de tu placa y serie en el portal oficial de la Secretaría de la Hacienda Pública de Jalisco. Te alertamos por WhatsApp en cuanto se detecta una infracción para que aproveches los beneficios de <strong>pronto pago (hasta 50%)</strong> antes de que venzan los plazos legales.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-2xl shadow-sm transition-all"
            >
              <Car className="w-4 h-4" /> Registrar mi Vehículo
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Desde $99 MXN/mes • Sin plazos forzosos
            </span>
          </div>
        </div>

        {/* Notificación de WhatsApp de ejemplo */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-80 bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Oficial
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">EN VIVO</span>
          </div>
          <div className="mt-3 text-xs space-y-2 text-slate-200">
            <p className="font-bold text-amber-400">🚨 Alerta AvisaMultas Jalisco</p>
            <p className="text-[11px] leading-relaxed">
              Hemos revisado tu vehículo (Placa: <strong>JNZ7890</strong>) en el portal de la SHP y encontramos una infracción reciente:
            </p>
            <div className="bg-slate-800/80 p-2.5 rounded-lg text-[10px] font-mono space-y-1">
              <div>Folio: FOL-JAL-9921</div>
              <div>Monto Oficial: $1,085.00 MXN</div>
              <div className="text-emerald-400 font-bold">Pronto pago (50%): $542.50 MXN</div>
              <div className="text-amber-300">Límite: En los primeros 10 días</div>
            </div>
          </div>
        </div>
      </section>

      {/* Consulta de Estado de mi Vehículo */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            Portal del Conductor
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            Consultar Estado de Monitoreo de tu Auto
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tu placa registrada para verificar la última fecha de revisión y el historial de avisos recibidos.
          </p>

          <form onSubmit={consultarVehiculo} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej. JNZ7890"
                value={placaBusqueda}
                onChange={(e) => setPlacaBusqueda(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
            >
              {cargando ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={onOpenRegister}
                className="underline font-bold hover:text-amber-950 ml-2 shrink-0"
              >
                Registrarlo ahora
              </button>
            </div>
          )}
        </div>

        {/* Resultado del vehículo */}
        {resultado && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-slate-900">
                    {resultado.vehiculo.placa}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {resultado.vehiculo.estadoSuscripcion}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  <strong>{resultado.vehiculo.alias}</strong> • Registrado a nombre de {resultado.usuario.nombre}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {resultado.usuario.telefonoWhatsApp ? `WhatsApp vinculado: ${resultado.usuario.telefonoWhatsApp}` : 'Notificaciones activas por WhatsApp'}
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="text-xs text-slate-500">Última revisión realizada:</div>
                <div className="text-xs font-bold text-slate-800">
                  {new Date(resultado.vehiculo.ultimaRevisionEn).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  Revisión al día bajo mandato de consulta
                </div>
              </div>
            </div>

            {/* Multas registradas */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Infracciones Registradas ({resultado.multas.length})
              </h4>

              {resultado.multas.length === 0 ? (
                <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-emerald-950">¡Tu auto está al corriente!</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    No se han localizado adeudos ni fotoinfracciones pendientes en las revisiones del portal de Jalisco.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {resultado.multas.map((m: any) => (
                    <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-sm">
                            Folio: {m.folioOficial}
                          </span>
                          <span className="text-xs text-slate-500">{m.fechaInfraccion}</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {m.tieneDescuentoProntoPago ? `Descuento ${m.porcentajeDescuento}% Activo` : 'Monto Neto'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {m.motivoInfraccion}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="space-x-2">
                          <span className="text-slate-400 line-through">
                            ${m.montoOficialMxn.toFixed(2)} MXN
                          </span>
                          <span className="font-bold text-emerald-600 text-sm">
                            ${m.montoConDescuentoMxn.toFixed(2)} MXN
                          </span>
                        </div>
                        {m.fechaLimiteProntoPago && (
                          <span className="text-[11px] text-slate-500">
                            Pagar antes del: <strong>{m.fechaLimiteProntoPago}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Explicación del Mandato y Legalidad */}
      <section className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" /> Transparencia y Protección de Datos
        </h4>
        <p className="leading-relaxed">
          AvisaMultas Jalisco opera mediante el mandato expreso que cada conductor nos otorga para consultar exclusivamente la información pública de su vehículo en el portal de la Secretaría de la Hacienda Pública de Jalisco. No accedemos a bases de datos restringidas ni evadimos mecanismos de seguridad.
        </p>
        <button
          onClick={() => setShowAvisoModal(true)}
          className="text-amber-800 font-bold underline hover:text-amber-900 inline-flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" /> Ver Aviso de Privacidad y Términos de Servicio (LFPDPPP)
        </button>
      </section>

      <AvisoPrivacidadModal
        isOpen={showAvisoModal}
        onClose={() => setShowAvisoModal(false)}
      />
    </div>
  );
};
