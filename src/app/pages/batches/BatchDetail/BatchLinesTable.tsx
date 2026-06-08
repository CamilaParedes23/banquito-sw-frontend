import { CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { LineaPagoResponse } from '../../../types/responses';
import { LineStatus } from '../../../types';

interface BatchLinesTableProps {
  lines: LineaPagoResponse[];
}

export function BatchLinesTable({ lines }: BatchLinesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
            <th className="pb-3">Sec.</th>
            <th className="pb-3">Beneficiario</th>
            <th className="pb-3">Concepto</th>
            <th className="pb-3 text-right">Monto</th>
            <th className="pb-3 text-center">Estado</th>
            <th className="pb-3">Mensaje Motor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm">
          {lines.map((l) => (
            <tr key={l.uuidOperacionSwitch} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 text-gray-400 font-mono">{l.secuencial}</td>
              <td className="py-4">
                <p className="font-bold text-gray-900">{l.nombreBeneficiario}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {l.identificacionBeneficiario} | {l.cuentaDestino}
                </p>
              </td>
              <td className="py-4 text-xs text-gray-600 max-w-[200px] truncate" title={l.conceptoReferencia}>
                {l.conceptoReferencia || '-'}
              </td>
              <td className="py-4 text-right font-bold text-gray-900">
                ${l.monto.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 text-center">
                <StatusBadge status={l.estado as LineStatus} size="sm" />
              </td>
              <td className="py-4 text-xs">
                {l.mensajeError ? (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {l.mensajeError}
                  </span>
                ) : l.estado === 'EXITOSA' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
