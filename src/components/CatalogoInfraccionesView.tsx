import React from 'react';
import { CATALOGO_INFRACCIONES } from '../mockData';
import { BookOpen, AlertOctagon, Scale, Shield } from 'lucide-react';

export const CatalogoInfraccionesView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Tabla de Infracciones y Sanciones</h3>
            <p className="text-xs text-slate-500">Codificación oficial, sanciones pecuniarias y acumulación de puntos</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Código</th>
              <th className="px-5 py-3">Descripción de la Infracción</th>
              <th className="px-5 py-3">Gravedad</th>
              <th className="px-5 py-3">Multa Base</th>
              <th className="px-5 py-3">Puntos</th>
              <th className="px-5 py-3">Medida Preventiva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {CATALOGO_INFRACCIONES.map(item => (
              <tr key={item.codigo} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                  {item.codigo}
                </td>
                <td className="px-5 py-3.5 text-slate-800 font-medium max-w-md">
                  {item.nombre}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    item.gravedad === 'Muy Grave'
                      ? 'bg-red-100 text-red-700'
                      : item.gravedad === 'Grave'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.gravedad}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                  ${item.montoBase.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                  +{item.puntos} pts
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {item.retencionLicencia ? (
                    <span className="text-red-700 font-semibold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> Retención de Licencia
                    </span>
                  ) : (
                    <span className="text-slate-400">Ninguna</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
