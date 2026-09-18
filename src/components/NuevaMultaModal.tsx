import React, { useState } from 'react';
import { Multa, InfraccionCatalogo } from '../types';
import { CATALOGO_INFRACCIONES } from '../mockData';
import { PlusCircle, X, Shield, AlertCircle } from 'lucide-react';

interface NuevaMultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrearMulta: (multa: Multa) => void;
}

export const NuevaMultaModal: React.FC<NuevaMultaModalProps> = ({
  isOpen,
  onClose,
  onCrearMulta,
}) => {
  const [codigoInfraccion, setCodigoInfraccion] = useState(CATALOGO_INFRACCIONES[1].codigo);
  const [placa, setPlaca] = useState('');
  const [conductor, setConductor] = useState('');
  const [dniConductor, setDniConductor] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState<Multa['tipoVehiculo']>('Automóvil');
  const [lugar, setLugar] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [agenteId, setAgenteId] = useState('POL-T-5012');

  if (!isOpen) return null;

  const infraccionSeleccionada = CATALOGO_INFRACCIONES.find(i => i.codigo === codigoInfraccion) || CATALOGO_INFRACCIONES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !conductor.trim() || !dniConductor.trim() || !lugar.trim()) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    const today = new Date();
    const fechaStr = today.toISOString().split('T')[0];
    const horaStr = today.toTimeString().split(' ')[0].substring(0, 5);

    // Fecha límite de pago en 15 días
    const fechaLimite = new Date(today);
    fechaLimite.setDate(fechaLimite.getDate() + 15);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const nuevaMulta: Multa = {
      id: `MUL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      codigoInfraccion: infraccionSeleccionada.codigo,
      placa: placa.toUpperCase().trim(),
      conductor: conductor.trim(),
      dniConductor: dniConductor.trim(),
      tipoVehiculo,
      fecha: fechaStr,
      hora: horaStr,
      lugar: lugar.trim(),
      descripcion: descripcion.trim() || infraccionSeleccionada.nombre,
      gravedad: infraccionSeleccionada.gravedad,
      monto: infraccionSeleccionada.montoBase,
      descuentoProntoPago: 50,
      estado: 'Pendiente',
      agenteId: agenteId.trim(),
      fechaLimitePago: fechaLimiteStr
    };

    onCrearMulta(nuevaMulta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Levantar Nueva Infracción (Papeleta)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tipo de infracción catálogo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Código de Infracción (Reglamento Nacional de Tránsito)
            </label>
            <select
              value={codigoInfraccion}
              onChange={(e) => setCodigoInfraccion(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
            >
              {CATALOGO_INFRACCIONES.map(inf => (
                <option key={inf.codigo} value={inf.codigo}>
                  [{inf.codigo}] - {inf.nombre} (${inf.montoBase.toFixed(2)} - {inf.gravedad})
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Gravedad: <strong className="text-slate-900">{infraccionSeleccionada.gravedad}</strong> | Puntos en récord: <strong className="text-slate-900">{infraccionSeleccionada.puntos} pts</strong>
              </span>
              <span className="text-slate-900 font-bold text-sm">
                Monto Base: ${infraccionSeleccionada.montoBase.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Placa y Vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Placa del Vehículo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. ABC-123"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full text-sm font-mono uppercase tracking-wider border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Tipo de Vehículo
              </label>
              <select
                value={tipoVehiculo}
                onChange={(e) => setTipoVehiculo(e.target.value as Multa['tipoVehiculo'])}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              >
                <option value="Automóvil">Automóvil</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Camión">Camión</option>
                <option value="Bus">Bus</option>
              </select>
            </div>
          </div>

          {/* Conductor y DNI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Nombre Completo del Conductor *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Manuel Pérez"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                DNI / Documento de Identidad *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 72819203"
                value={dniConductor}
                onChange={(e) => setDniConductor(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Lugar y Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Lugar / Dirección del Incidente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Av. Arequipa Cdra 14"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Código del Agente Interventor
              </label>
              <input
                type="text"
                value={agenteId}
                onChange={(e) => setAgenteId(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Observaciones adicionales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Observaciones o Detalle del Hecho
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre las circunstancias, instrumentos de medición utilizados, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Registrar Papeleta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
