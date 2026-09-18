import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ExternalLink, Calendar, DollarSign, FileText, Send, ShieldCheck } from 'lucide-react';

interface RegistrarRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculo: any | null;
  adminKey: string;
  onSuccess: () => void;
}

export const RegistrarRevisionModal: React.FC<RegistrarRevisionModalProps> = ({
  isOpen,
  onClose,
  vehiculo,
  adminKey,
  onSuccess
}) => {
  const [huboInfraccion, setHuboInfraccion] = useState(false);
  const [folioOficial, setFolioOficial] = useState('');
  const [fechaInfraccion, setFechaInfraccion] = useState(new Date().toISOString().split('T')[0]);
  const [motivoInfraccion, setMotivoInfraccion] = useState('');
  const [montoOficial, setMontoOficial] = useState('1085.00');
  const [tieneDescuento, setTieneDescuento] = useState(true);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('50');
  const [fechaLimiteDescuento, setFechaLimiteDescuento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehiculo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch('/api/admin/registrar-revision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          vehiculoId: vehiculo.id,
          huboInfraccion,
          folioOficial: huboInfraccion ? folioOficial.trim() : undefined,
          fechaInfraccion: huboInfraccion ? fechaInfraccion : undefined,
          motivoInfraccion: huboInfraccion ? motivoInfraccion.trim() : undefined,
          montoOficial: huboInfraccion ? Number(montoOficial) : undefined,
          tieneDescuento: huboInfraccion ? tieneDescuento : false,
          porcentajeDescuento: huboInfraccion && tieneDescuento ? Number(porcentajeDescuento) : 0,
          fechaLimiteDescuento: huboInfraccion && tieneDescuento ? fechaLimiteDescuento : undefined,
          observaciones: observaciones.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la revisión.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2A4A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-[#E2E5E8] w-full max-w-xl overflow-hidden shadow-lg text-left">
        
        {/* Cabecera Institucional */}
        <div className="bg-[#0F2A4A] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute right-4 top-4 p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300">
                Inspección Asistida • Portal SHP Jalisco
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Registrar Resultado de Revisión
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/15 text-xs text-slate-200">
            <span className="font-mono bg-white/15 px-2 py-0.5 rounded font-bold text-white">
              Placa: {vehiculo.placa}
            </span>
            <span className="font-mono text-slate-300">Serie: *{vehiculo.numeroSerie5}</span>
            {vehiculo.alias && (
              <span className="text-slate-400">({vehiculo.alias})</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded font-medium">
              {error}
            </div>
          )}

          {/* Enlace directo para abrir el portal oficial y cotejar */}
          <div className="p-3 bg-[#F0F4F8] border border-[#D5DCE4] rounded flex items-center justify-between">
            <div className="text-[#0F2A4A] leading-relaxed pr-2">
              <strong>Procedimiento:</strong> Abre el portal oficial de la Secretaría de la Hacienda Pública e ingresa la placa <strong>{vehiculo.placa}</strong> y serie <strong>{vehiculo.numeroSerie5}</strong>.
            </div>
            <a
              href="https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#0F2A4A] text-white font-semibold rounded flex items-center gap-1.5 shrink-0 hover:bg-[#163B66] transition-colors"
            >
              Abrir Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Selector de resultado de la consulta */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-[#111827]">
              Resultado del Cotejo Oficial
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHuboInfraccion(false)}
                className={`p-3 rounded border text-left font-semibold transition-colors ${
                  !huboInfraccion
                    ? 'border-[#166534] bg-[#F0FDF4] text-[#166534]'
                    : 'border-[#E2E5E8] text-[#4B5563] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                  <span>Sin Infracciones</span>
                </div>
                <div className="text-[11px] font-normal text-[#4B5563] mt-1">
                  Vehículo al corriente en el portal oficial.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHuboInfraccion(true)}
                className={`p-3 rounded border text-left font-semibold transition-colors ${
                  huboInfraccion
                    ? 'border-[#991B1B] bg-[#FEF2F2] text-[#991B1B]'
                    : 'border-[#E2E5E8] text-[#4B5563] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                  <span>Infracción Detectada</span>
                </div>
                <div className="text-[11px] font-normal text-[#4B5563] mt-1">
                  Registrar folio y activar deduplicación.
                </div>
              </button>
            </div>
          </div>

          {/* Campos adicionales si se encontró una infracción */}
          {huboInfraccion && (
            <div className="p-4 bg-[#F8F9FA] rounded border border-[#E2E5E8] space-y-3">
              <div className="font-bold text-[#111827] text-xs pb-1.5 border-b border-[#E2E5E8]">
                Datos de la Infracción Localizada
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Folio Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FOL-JAL-84920"
                    value={folioOficial}
                    onChange={(e) => setFolioOficial(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Fecha de la Infracción *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInfraccion}
                    onChange={(e) => setFechaInfraccion(e.target.value)}
                    className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#111827] mb-1">
                  Motivo o Concepto Oficial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Exceso de velocidad detectado por cinemómetro en Av. López Mateos"
                  value={motivoInfraccion}
                  onChange={(e) => setMotivoInfraccion(e.target.value)}
                  className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Importe Oficial ($ MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoOficial}
                    onChange={(e) => setMontoOficial(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    ¿Aplica Descuento Pronto Pago?
                  </label>
                  <select
                    value={tieneDescuento ? 'si' : 'no'}
                    onChange={(e) => setTieneDescuento(e.target.value === 'si')}
                    className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-white font-medium focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                  >
                    <option value="si">Sí (Aplica pronto pago)</option>
                    <option value="no">No (Importe neto regular)</option>
                  </select>
                </div>
              </div>

              {tieneDescuento && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E5E8]">
                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      % Descuento Otorgado
                    </label>
                    <input
                      type="number"
                      value={porcentajeDescuento}
                      onChange={(e) => setPorcentajeDescuento(e.target.value)}
                      className="w-full text-xs font-mono border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111827] mb-1">
                      Fecha Límite Estimada
                    </label>
                    <input
                      type="date"
                      value={fechaLimiteDescuento}
                      onChange={(e) => setFechaLimiteDescuento(e.target.value)}
                      className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Observaciones del Cotejo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Cotejado a las 10:30 hrs. Adeudo no refleja todavía pago en OXXO."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-[#F8F9FA] focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2E5E8] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2A4A] hover:bg-[#163B66] rounded transition-colors disabled:opacity-50"
            >
              {cargando 
                ? 'Registrando...' 
                : huboInfraccion 
                  ? 'Guardar y Alertar por WhatsApp' 
                  : 'Registrar Vehículo al Corriente'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

