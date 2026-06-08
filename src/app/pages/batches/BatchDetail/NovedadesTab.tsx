import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { LineStatus } from '../../../types';

interface NovedadesLine {
  secuencial: number;
  nombreBeneficiario: string;
  cuentaDestino: string;
  monto: number;
  estado: LineStatus;
  mensajeError?: string;
}

interface NovedadesData {
  resumen?: {
    totalLineas: number;
    exitosas: number;
    rechazadas: number;
    fallidas: number;
  };
  lineas?: NovedadesLine[];
}

interface NovedadesTabProps {
  isLoading: boolean;
  data: NovedadesData | null;
}

export function NovedadesTab({ isLoading, data }: NovedadesTabProps) {
  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando reporte de novedades...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">Reporte de novedades no disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Líneas</p>
          <p className="text-xl font-black text-gray-900 mt-1">{data.resumen?.totalLineas ?? '-'}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-[10px] font-bold text-green-600 uppercase">Exitosas</p>
          <p className="text-xl font-black text-green-700 mt-1">{data.resumen?.exitosas ?? '-'}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-[10px] font-bold text-red-600 uppercase">Rechazadas</p>
          <p className="text-xl font-black text-red-700 mt-1">{data.resumen?.rechazadas ?? '-'}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="text-[10px] font-bold text-orange-600 uppercase">Fallidas</p>
          <p className="text-xl font-black text-orange-700 mt-1">{data.resumen?.fallidas ?? '-'}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
              <th className="pb-3">Sec.</th>
              <th className="pb-3">Beneficiario</th>
              <th className="pb-3">Cuenta</th>
              <th className="pb-3 text-right">Monto</th>
              <th className="pb-3 text-center">Estado</th>
              <th className="pb-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {(data.lineas || []).map((l: NovedadesLine) => (
              <tr key={l.secuencial} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 text-gray-400 font-mono">{l.secuencial}</td>
                <td className="py-3 font-bold text-gray-900">{l.nombreBeneficiario}</td>
                <td className="py-3 font-mono text-[11px] text-gray-500">{l.cuentaDestino}</td>
                <td className="py-3 text-right font-bold text-gray-900">
                  ${Number(l.monto).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 text-center">
                  {l.estado === 'EXITOSA' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Exitosa
                    </span>
                  ) : l.estado === 'RECHAZADA' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                      <XCircle className="w-3 h-3" /> Rechazada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" /> {l.estado}
                    </span>
                  )}
                </td>
                <td className="py-3 text-xs text-gray-500">{l.mensajeError || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
