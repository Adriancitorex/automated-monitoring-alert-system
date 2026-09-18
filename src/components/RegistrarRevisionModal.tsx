import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ExternalLink, Calendar, DollarSign, FileText, Send } from 'lucide-react';

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

      alert(data.mensaje);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold">
            Operación Manual • Portal Oficial SHP Jalisco
          </span>
          <h3 className="text-lg font-black mt-1">Registrar Revisión de Vehículo</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded-md font-bold text-amber-300">
              Placa: {vehiculo.placa}
            </span>
            <span>Serie: *{vehiculo.numeroSerie5}</span>
            <span className="text-slate-400">({vehiculo.alias || 'Sin alias'})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Enlace directo para abrir el portal oficial y cotejar */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="text-amber-900 leading-snug">
              <strong>Paso previo:</strong> Abre el portal oficial de Jalisco e ingresa la placa <strong>{vehiculo.placa}</strong> y serie <strong>{vehiculo.numeroSerie5}</strong>.
            </div>
            <a
              href="https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 ml-2 hover:bg-slate-800"
            >
              Abrir Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Selector de resultado de la consulta */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 uppercase">
              Resultado de la Consulta en el Portal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHuboInfraccion(false)}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  !huboInfraccion
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✓ Sin Infracciones (Al corriente)
              </button>

              <button
                type="button"
                onClick={() => setHuboInfraccion(true)}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  huboInfraccion
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⚠️ Nueva Infracción Localizada
              </button>
            </div>
          </div>

          {/* Campos adicionales si se encontró una infracción */}
          {huboInfraccion && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                Datos de la Infracción en el Portal
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Folio Oficial
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FOL-JAL-84920"
                    value={folioOficial}
                    onChange={(e) => setFolioOficial(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Fecha de la Infracción
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInfraccion}
                    onChange={(e) => setFechaInfraccion(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Motivo / Concepto Oficial
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Exceso de velocidad detectado por cinemómetro en López Mateos"
                  value={motivoInfraccion}
                  onChange={(e) => setMotivoInfraccion(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Monto Oficial ($ MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoOficial}
                    onChange={(e) => setMontoOficial(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ¿Aplica Descuento Pronto Pago?
                  </label>
                  <select
                    value={tieneDescuento ? 'si' : 'no'}
                    onChange={(e) => setTieneDescuento(e.target.value === 'si')}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="si">Sí (Aplica pronto pago)</option>
                    <option value="no">No (Monto neto)</option>
                  </select>
                </div>
              </div>

              {tieneDescuento && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      % Descuento
                    </label>
                    <input
                      type="number"
                      value={porcentajeDescuento}
                      onChange={(e) => setPorcentajeDescuento(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Fecha Límite Estimada
                    </label>
                    <input
                      type="date"
                      value={fechaLimiteDescuento}
                      onChange={(e) => setFechaLimiteDescuento(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Observaciones de la Revisión (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Revisado a las 12:00 hrs. Todo en orden."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : huboInfraccion ? 'Guardar y Alertar por WhatsApp' : 'Guardar Revisión Sin Adeudos'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
