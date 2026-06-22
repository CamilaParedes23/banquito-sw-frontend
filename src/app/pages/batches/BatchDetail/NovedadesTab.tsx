import { Download, FileSpreadsheet } from 'lucide-react';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { generateNovedadesPdf, reporteNovedadesToCsv, downloadTextFile } from '../../../utils/batchReportExport';

interface NovedadesLine {
  secuencial: number;
  nombreBeneficiario: string;
  cuentaDestino: string;
  monto: number;
  estado: string;
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
  batchId?: string;
}

function extractReadableMessage(errorMessage?: string): string {
  if (!errorMessage) return '—';

  // Extract "message" field from JSON in string
  const messageMatch = errorMessage.match(/"message"\s*:\s*"([^"]+)"/);
  if (messageMatch) {
    return messageMatch[1];
  }

  // Extract "code" field from JSON in string
  const codeMatch = errorMessage.match(/"code"\s*:\s*"([^"]+)"/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // Try to parse body={...} format
  const bodyMatch = errorMessage.match(/body=(\{[^}]*\})/);
  if (bodyMatch) {
    try {
      const parsed = JSON.parse(bodyMatch[1]);
      if (parsed.message) return parsed.message;
      if (parsed.code) return parsed.code;
    } catch {
      // ignore parse errors
    }
  }

  // Handle common error patterns
  if (errorMessage.includes('ADMIN_INSTITUTION_NOT_FOUND')) {
    return 'Institución financiera no encontrada';
  }
  if (errorMessage.includes('httpStatus=409')) {
    return 'Conflicto en el procesamiento';
  }
  if (errorMessage.includes('httpStatus=404')) {
    return 'Recurso no encontrado';
  }

  // Truncate long messages
  if (errorMessage.length > 60) {
    return errorMessage.substring(0, 60) + '...';
  }

  return errorMessage;
}

export function NovedadesTab({ isLoading, data, batchId }: NovedadesTabProps) {
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

      {/* Botones de descarga */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => generateNovedadesPdf(data as any)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1B4B] text-white rounded-xl text-sm font-bold hover:bg-[#1a2d5f] transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
        <button
          onClick={() => downloadTextFile(
            `Novedades_${batchId || 'lote'}.csv`,
            reporteNovedadesToCsv(data as any),
            'text/csv'
          )}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#0D1B4B] text-[#0D1B4B] rounded-xl text-sm font-bold hover:bg-[#0D1B4B]/5 transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Descargar CSV
        </button>
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
                  <StatusBadge status={l.estado} size="sm" />
                </td>
                <td className="py-3 text-xs text-gray-500" title={l.mensajeError}>
                  {extractReadableMessage(l.mensajeError)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
