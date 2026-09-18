import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Car, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText,
  ArrowRight
} from 'lucide-react';
import { AvisoPrivacidadModal } from './AvisoPrivacidadModal';

interface UserPortalViewProps {
  onOpenRegister: () => void;
}

export const UserPortalView: React.FC<UserPortalViewProps> = ({ onOpenRegister }) => {
  const [placaBusqueda, setPlacaBusqueda] = useState('JNZ7890');
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvisoModal, setShowAvisoModal] = useState(false);

  const consultarVehiculo = async (placaAconsultar?: string) => {
    const placaFinal = (placaAconsultar || placaBusqueda).trim();
    if (!placaFinal) return;

    setCargando(true);
    setError(null);

    try {
      const res = await fetch(`/api/vehiculo/estado/${encodeURIComponent(placaFinal)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se encontró el vehículo en el padrón de monitoreo.');
      }

      setResultado(data);
    } catch (err: any) {
      setError(err.message);
      setResultado(null);
    } finally {
      setCargando(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultarVehiculo();
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. SECCIÓN PRINCIPAL: DICTAMEN DIRECTO ("¿Tengo una multa o no?") */}
      <section aria-label="Dictamen del vehículo" className="bg-white border border-[#E2E5E8] rounded-md p-6 sm:p-7">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E5E8]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                Estado de Monitoreo Vehicular
              </h2>
              <p className="text-xs text-[#4B5563] mt-1">
                Consulta y dictamen de infracciones en el portal oficial de Jalisco bajo mandato
              </p>
            </div>
            
            {/* Buscador Rápido de Placa */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={placaBusqueda}
                  onChange={(e) => setPlacaBusqueda(e.target.value.toUpperCase())}
                  placeholder="Ingresar placa..."
                  className="w-36 sm:w-44 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-[#D5DCE4] rounded focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A] bg-[#F8F9FA]"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="px-3.5 py-1.5 bg-[#0F2A4A] hover:bg-[#163B66] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
              >
                {cargando ? 'Buscando...' : 'Consultar'}
              </button>
            </form>
          </div>

          {error && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs rounded flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={onOpenRegister}
                className="font-bold underline ml-3 shrink-0 hover:text-[#7F1D1D]"
              >
                Registrar este vehículo
              </button>
            </div>
          )}

          {/* ESTADO DICTAMINADO INMEDIATO */}
          {resultado ? (
            <div className="space-y-4">
              {/* Dictamen Banner */}
              {resultado.multas.length === 0 ? (
                <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-md flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#166534]">
                      Vehículo al corriente. Sin infracciones vigentes.
                    </h3>
                    <p className="text-xs text-[#14532D] leading-relaxed">
                      El vehículo con placa <strong>{resultado.vehiculo.placa}</strong> no presenta adeudos ni fotoinfracciones pendientes en la plataforma de la Secretaría de la Hacienda Pública de Jalisco.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-md flex items-start gap-3.5">
                  <AlertCircle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#991B1B]">
                      Atención requerida: Se localizó {resultado.multas.length} infracción pendiente
                    </h3>
                    <p className="text-xs text-[#7F1D1D] leading-relaxed">
                      Hay un adeudo registrado para la placa <strong>{resultado.vehiculo.placa}</strong>. Consulta el desglose para aprovechar el descuento por pronto pago antes de su vencimiento legal.
                    </p>
                  </div>
                </div>
              )}

              {/* Ficha técnica del vehículo monitoreado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F8F9FA] border border-[#E2E5E8] rounded-md text-xs">
                <div>
                  <span className="text-[11px] text-[#6B7280]">Placa Registrada</span>
                  <div className="font-mono font-bold text-[#111827] text-sm mt-0.5">
                    {resultado.vehiculo.placa}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Titular y Alias</span>
                  <div className="font-semibold text-[#111827] mt-0.5 truncate">
                    {resultado.usuario.nombre}
                  </div>
                  <div className="text-[11px] text-[#4B5563] truncate">
                    {resultado.vehiculo.alias || 'Sin alias'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Última Revisión Oficial</span>
                  <div className="font-medium text-[#111827] mt-0.5">
                    {new Date(resultado.vehiculo.ultimaRevisionEn).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-[10px] text-[#4B5563]">
                    {new Date(resultado.vehiculo.ultimaRevisionEn).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} hrs
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Notificación WhatsApp</span>
                  <div className="font-mono font-semibold text-[#166534] mt-0.5 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {resultado.usuario.telefonoWhatsApp ? 'Vinculado' : 'Activo'}
                  </div>
                  <div className="text-[10px] text-[#4B5563]">
                    {resultado.usuario.telefonoWhatsApp || 'Alertas listas'}
                  </div>
                </div>
              </div>

              {/* Detalle de Infracciones Si Existen */}
              {resultado.multas.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#111827]">
                    Detalle de Infracciones Oficiales ({resultado.multas.length})
                  </h4>

                  <div className="space-y-2.5">
                    {resultado.multas.map((m: any) => (
                      <div 
                        key={m.id} 
                        className="border border-[#E2E5E8] bg-white rounded-md p-4 space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0F2F5]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#111827] bg-[#EEF2F6] px-2 py-0.5 rounded border border-[#D5DCE4]">
                              Folio: {m.folioOficial}
                            </span>
                            <span className="text-[#6B7280]">
                              Fecha de infracción: {m.fechaInfraccion}
                            </span>
                          </div>
                          {m.tieneDescuentoProntoPago && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#166534] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0] text-[11px]">
                              Beneficio: {m.porcentajeDescuento}% de descuento por pronto pago
                            </span>
                          )}
                        </div>

                        <p className="text-[#111827] leading-relaxed">
                          {m.motivoInfraccion}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 bg-[#F8F9FA] p-3 rounded border border-[#E2E5E8]">
                          <div className="space-x-3">
                            <span className="text-[#6B7280] line-through">
                              ${m.montoOficialMxn.toFixed(2)} MXN
                            </span>
                            <span className="font-bold text-[#166534] text-sm font-mono">
                              ${m.montoConDescuentoMxn.toFixed(2)} MXN
                            </span>
                            <span className="text-[11px] text-[#4B5563]">
                              (Ahorro de ${(m.montoOficialMxn - m.montoConDescuentoMxn).toFixed(2)} MXN)
                            </span>
                          </div>
                          {m.fechaLimiteProntoPago && (
                            <div className="text-[11px] text-[#991B1B] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Límite de descuento: {m.fechaLimiteProntoPago}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Estado Inicial: Explicación directa con botón para consultar demo o registrarse */
            <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E8] rounded-md space-y-3">
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Ingresa una placa registrada para consultar su estatus en tiempo real. Si aún no cuentas con el servicio, registra tu vehículo para autorizar la consulta periódica en la Secretaría de la Hacienda Pública de Jalisco.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => consultarVehiculo('JNZ7890')}
                  className="px-3 py-1.5 bg-[#0F2A4A] text-white text-xs font-semibold rounded hover:bg-[#163B66] transition-colors"
                >
                  Consultar placa de prueba (JNZ7890)
                </button>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="px-3 py-1.5 bg-white border border-[#D5DCE4] text-[#111827] text-xs font-semibold rounded hover:bg-[#F0F2F5] transition-colors"
                >
                  Registrar mi vehículo
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. CÓMO FUNCIONA EL SERVICIO (EXPLICACIÓN INSTITUCIONAL DIRECTA) */}
      <section className="bg-white border border-[#E2E5E8] rounded-md p-6 sm:p-7">
        <div className="max-w-3xl space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#4B5563]">Proceso de Operación</span>
            <h3 className="text-base font-bold text-[#111827] mt-0.5">
              Monitoreo y Alertas en Tres Pasos
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="border border-[#E2E5E8] p-4 rounded-md bg-[#F8F9FA] space-y-2">
              <span className="text-xs font-bold text-[#0F2A4A] block">01. Registro y Mandato</span>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Proporcionas la placa y los últimos 5 dígitos del número de serie requeridos por la Secretaría de la Hacienda Pública, otorgando mandato expreso de consulta.
              </p>
            </div>

            <div className="border border-[#E2E5E8] p-4 rounded-md bg-[#F8F9FA] space-y-2">
              <span className="text-xs font-bold text-[#0F2A4A] block">02. Revisión Periódica</span>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Revisamos de forma programada el portal oficial de Jalisco para verificar si existe alguna infracción o adeudo vehicular asignado a tu placa.
              </p>
            </div>

            <div className="border border-[#E2E5E8] p-4 rounded-md bg-[#F8F9FA] space-y-2">
              <span className="text-xs font-bold text-[#0F2A4A] block">03. Alerta y Descuento</span>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Recibes una notificación en WhatsApp al instante para aprovechar hasta el 50% de descuento por pronto pago antes de que venza el plazo de ley.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRANSPARENCIA LEGAL Y MARCO REGULATORIO */}
      <section className="bg-white border border-[#E2E5E8] rounded-md p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
            <ShieldCheck className="w-4 h-4 text-[#0F2A4A]" strokeWidth={2} />
            Marco Legal y Protección de Datos Personales
          </div>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            AvisaMultas Jalisco opera mediante el mandato expreso que cada titular registral confiere. No empleamos vulnerabilidades ni evasión de protecciones de seguridad. Cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAvisoModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F2A4A] bg-[#EEF2F6] hover:bg-[#E2E5E8] rounded border border-[#D5DCE4] transition-colors shrink-0"
        >
          <FileText className="w-3.5 h-3.5" /> Consultar Aviso de Privacidad
        </button>
      </section>

      <AvisoPrivacidadModal
        isOpen={showAvisoModal}
        onClose={() => setShowAvisoModal(false)}
      />
    </div>
  );
};

