import React, { useState } from 'react';
import { Multa } from '../types';
import { Eye, CreditCard, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface MultasTableProps {
  multas: Multa[];
  onSelectMulta: (multa: Multa) => void;
}

export const MultasTable: React.FC<MultasTableProps> = ({ multas, onSelectMulta }) => {
  if (multas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="inline-flex p-3 bg-slate-100 rounded-full text-slate-500 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No se encontraron papeletas o infracciones</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No hay registros que coincidan con los filtros de búsqueda aplicados (placa, DNI, conductor o código).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">N° Acta / Infracción</th>
              <th className="px-5 py-3.5">Placa & Tipo</th>
              <th className="px-5 py-3.5">Conductor / DNI</th>
              <th className="px-5 py-3.5">Fecha & Lugar</th>
              <th className="px-5 py-3.5">Monto</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {multas.map((multa) => {
              const montoConDescuento = multa.descuentoProntoPago > 0 && multa.estado === 'Pendiente'
                ? multa.monto * (1 - multa.descuentoProntoPago / 100)
                : multa.monto;

              return (
                <tr 
                  key={multa.id}
                  onClick={() => onSelectMulta(multa)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 font-mono text-xs">{multa.id}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm text-[11px] font-bold">
                        {multa.codigoInfraccion}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                        multa.gravedad === 'Muy Grave' 
                          ? 'bg-red-50 text-red-700' 
                          : multa.gravedad === 'Grave'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {multa.gravedad}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-black text-slate-900 tracking-wider font-mono text-sm">{multa.placa}</div>
                    <div className="text-xs text-slate-400">{multa.tipoVehiculo}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900 text-xs truncate max-w-[180px]">{multa.conductor}</div>
                    <div className="text-[11px] font-mono text-slate-400">Doc: {multa.dniConductor}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-xs font-medium text-slate-700">{multa.fecha}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{multa.lugar}</div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 text-sm">
                      ${montoConDescuento.toFixed(2)}
                    </div>
                    {multa.descuentoProntoPago > 0 && multa.estado === 'Pendiente' && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        50% pronto pago
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      multa.estado === 'Pagada' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : multa.estado === 'Pendiente'
                        ? 'bg-amber-100 text-amber-800'
                        : multa.estado === 'En Apelación'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {multa.estado}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMulta(multa);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
