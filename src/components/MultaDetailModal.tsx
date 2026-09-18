import React, { useState } from 'react';
import { Multa } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Printer, 
  X, 
  MapPin, 
  Calendar, 
  User, 
  ShieldAlert,
  Percent,
  Download
} from 'lucide-react';

interface MultaDetailModalProps {
  multa: Multa | null;
  onClose: () => void;
  onPagar: (id: string, metodo: string) => void;
  onApelar: (id: string, motivo: string) => void;
}

export const MultaDetailModal: React.FC<MultaDetailModalProps> = ({
  multa,
  onClose,
  onPagar,
  onApelar
}) => {
  const [showPayForm, setShowPayForm] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Tarjeta de Débito / Crédito');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [motivoApelacion, setMotivoApelacion] = useState('');

  if (!multa) return null;

  const montoConDescuento = multa.descuentoProntoPago > 0
    ? multa.monto * (1 - multa.descuentoProntoPago / 100)
    : multa.monto;

  const handlePagarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPagar(multa.id, metodoPago);
    setShowPayForm(false);
  };

  const handleApelarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoApelacion.trim()) return;
    onApelar(multa.id, motivoApelacion);
    setShowAppealForm(false);
  };

  const printRecibo = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Acta de Infracción</span>
              <h3 className="text-lg font-bold">{multa.id}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status badge and infraction code */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Infracción</span>
              <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-slate-800 text-white text-xs px-2.5 py-0.5 rounded-md font-mono">{multa.codigoInfraccion}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  multa.gravedad === 'Muy Grave' 
                    ? 'bg-red-100 text-red-700' 
                    : multa.gravedad === 'Grave'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {multa.gravedad}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase">Estado Actual</span>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  multa.estado === 'Pagada' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : multa.estado === 'Pendiente'
                    ? 'bg-amber-100 text-amber-800'
                    : multa.estado === 'En Apelación'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {multa.estado === 'Pagada' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {multa.estado === 'Pendiente' && <Clock className="w-3.5 h-3.5" />}
                  {multa.estado === 'Vencida' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {multa.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Conductor Infractor</div>
                  <div className="font-semibold text-slate-800">{multa.conductor}</div>
                  <div className="text-xs text-slate-500 font-mono">DNI/Doc: {multa.dniConductor}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Lugar del Incidente</div>
                  <div className="font-medium text-slate-800">{multa.lugar}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Fecha y Hora de Intervención</div>
                  <div className="font-medium text-slate-800">{multa.fecha} a las {multa.hora} hrs</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Placa del Vehículo</div>
                <div className="text-lg font-black tracking-wider text-slate-900 font-mono">{multa.placa}</div>
                <div className="text-xs text-slate-500">Tipo: {multa.tipoVehiculo}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Efectivo Policial / Agente</div>
                <div className="font-medium text-slate-700 font-mono text-xs">{multa.agenteId}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Fecha Límite de Pago</div>
                <div className="font-semibold text-slate-800">{multa.fechaLimitePago}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Descripción de la Infracción:</span>
            <p className="text-slate-700 leading-relaxed">{multa.descripcion}</p>
          </div>

          {/* Payment summary box */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-indigo-700 font-medium">Monto Ordinario: ${multa.monto.toFixed(2)}</div>
              {multa.descuentoProntoPago > 0 && multa.estado === 'Pendiente' && (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <Percent className="w-3.5 h-3.5" /> Descuento pronto pago ({multa.descuentoProntoPago}%): -${(multa.monto * (multa.descuentoProntoPago / 100)).toFixed(2)}
                </div>
              )}
              {multa.fechaPago && (
                <div className="text-xs text-slate-600 mt-1">
                  Pagado el: <span className="font-semibold">{multa.fechaPago}</span> ({multa.metodoPago})
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs uppercase text-slate-500 font-semibold">Total a Pagar</span>
              <div className="text-2xl font-black text-slate-900">
                ${montoConDescuento.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Pay Form Section */}
          {showPayForm && multa.estado !== 'Pagada' && (
            <form onSubmit={handlePagarSubmit} className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <h4 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Pasarela de Pago Seguro de Infracción
              </h4>
              <p className="text-xs text-emerald-700">
                Selecciona la modalidad de pago para abonar ${montoConDescuento.toFixed(2)}.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Método de pago:</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                >
                  <option value="Tarjeta de Débito / Crédito (Visa / Mastercard)">Tarjeta de Débito / Crédito (Visa / Mastercard)</option>
                  <option value="Banca por Internet / Transferencia">Banca por Internet / Transferencia</option>
                  <option value="Billetera Móvil (Yape / Plin / Pago Móvil)">Billetera Móvil (Yape / Plin / Pago Móvil)</option>
                  <option value="Caja Municipal / Agencias Presenciales">Caja Municipal / Agencias Presenciales</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Confirmar Pago (${montoConDescuento.toFixed(2)})
                </button>
              </div>
            </form>
          )}

          {/* Appeal Form Section */}
          {showAppealForm && multa.estado !== 'Pagada' && (
            <form onSubmit={handleApelarSubmit} className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
              <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Presentar Recurso de Apelación
              </h4>
              <p className="text-xs text-blue-700">
                Sustenta los fundamentos de hecho o de derecho para solicitar la anulación o reconsideración.
              </p>
              <textarea
                rows={3}
                required
                value={motivoApelacion}
                onChange={(e) => setMotivoApelacion(e.target.value)}
                placeholder="Explica detalladamente las pruebas o descargos..."
                className="w-full text-sm border border-blue-300 rounded-lg p-2.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAppealForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Enviar Apelación
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={printRecibo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-2xs hover:bg-slate-100"
          >
            <Printer className="w-4 h-4" /> Imprimir Comprobante
          </button>

          <div className="flex items-center gap-2">
            {multa.estado !== 'Pagada' && !showPayForm && (
              <>
                <button
                  onClick={() => { setShowAppealForm(!showAppealForm); setShowPayForm(false); }}
                  className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  Apelar Infracción
                </button>
                <button
                  onClick={() => { setShowPayForm(true); setShowAppealForm(false); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pagar Multa (${montoConDescuento.toFixed(2)})
                </button>
              </>
            )}

            {multa.estado === 'Pagada' && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Esta infracción se encuentra cancelada
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
