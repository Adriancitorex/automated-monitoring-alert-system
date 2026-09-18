import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, Car, CreditCard, RotateCcw, X } from 'lucide-react';

interface FiltrosBusquedaProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (val: string) => void;
  filtroGravedad: string;
  onFiltroGravedadChange: (val: string) => void;
  onReset: () => void;
}

export const FiltrosBusqueda: React.FC<FiltrosBusquedaProps> = ({
  busqueda,
  onBusquedaChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtroGravedad,
  onFiltroGravedadChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-5 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por placa (ej: ABC-123), DNI, conductor o N° de papeleta..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder-slate-400 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filtroEstado}
            onChange={(e) => onFiltroEstadoChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Pagada">Pagadas</option>
            <option value="En Apelación">En Apelación</option>
            <option value="Vencida">Vencidas</option>
          </select>

          <select
            value={filtroGravedad}
            onChange={(e) => onFiltroGravedadChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
          >
            <option value="Todas">Toda Gravedad</option>
            <option value="Leve">Leve</option>
            <option value="Grave">Grave</option>
            <option value="Muy Grave">Muy Grave</option>
          </select>

          {(busqueda || filtroEstado !== 'Todos' || filtroGravedad !== 'Todas') && (
            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Quick vehicle pill filters */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Car className="w-3.5 h-3.5" /> Placas de prueba:
        </span>
        {['ABC-123', 'XYZ-789', 'MOT-456', 'BUS-990'].map(p => (
          <button
            key={p}
            onClick={() => onBusquedaChange(p)}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-colors ${
              busqueda === p 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
