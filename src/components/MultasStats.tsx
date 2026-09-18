import React from 'react';
import { Multa } from '../types';
import { FileText, Clock, CheckCircle2, AlertCircle, AlertTriangle, DollarSign } from 'lucide-react';

interface MultasStatsProps {
  multas: Multa[];
}

export const MultasStats: React.FC<MultasStatsProps> = ({ multas }) => {
  const totalMultas = multas.length;
  const pendientes = multas.filter(m => m.estado === 'Pendiente').length;
  const pagadas = multas.filter(m => m.estado === 'Pagada').length;
  const vencidas = multas.filter(m => m.estado === 'Vencida').length;
  const enApelacion = multas.filter(m => m.estado === 'En Apelación').length;

  const totalRecaudado = multas
    .filter(m => m.estado === 'Pagada')
    .reduce((acc, m) => {
      const desc = m.descuentoProntoPago > 0 ? m.monto * (1 - m.descuentoProntoPago / 100) : m.monto;
      return acc + desc;
    }, 0);

  const deudaPendiente = multas
    .filter(m => m.estado === 'Pendiente' || m.estado === 'Vencida')
    .reduce((acc, m) => acc + m.monto, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Total Registradas */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Infracciones</span>
          <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
            <FileText className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{totalMultas}</span>
          <span className="text-xs text-slate-500 font-medium">actas totales</span>
        </div>
      </div>

      {/* Pendientes de Pago */}
      <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pendientes</span>
          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-amber-900">{pendientes}</span>
          <span className="text-xs text-amber-700 font-medium">{enApelacion > 0 ? `(${enApelacion} en apelación)` : 'por regularizar'}</span>
        </div>
      </div>

      {/* Pagadas y Recaudación */}
      <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Pagadas</span>
          <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-900">{pagadas}</span>
          <span className="text-xs text-emerald-700 font-medium">${totalRecaudado.toFixed(0)} cobrado</span>
        </div>
      </div>

      {/* Vencidas / Por cobrar */}
      <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Vencidas</span>
          <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-900">{vencidas}</span>
          <span className="text-xs text-rose-700 font-medium">${deudaPendiente.toFixed(0)} deuda activa</span>
        </div>
      </div>
    </div>
  );
};
