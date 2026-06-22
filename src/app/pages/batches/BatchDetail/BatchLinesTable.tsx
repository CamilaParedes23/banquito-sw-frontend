import { StatusBadge } from '../../../components/shared/StatusBadge';

interface NovedadesLine {
  sequenceNumber: number;
  beneficiaryName: string;
  destinationAccountNumber: string;
  amount: number;
  finalStatus: string;
  errorMessage?: string;
  processedAt?: string;
}

interface BatchLinesTableProps {
  lines: NovedadesLine[];
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

export function BatchLinesTable({ lines }: BatchLinesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
            <th className="pb-3">Sec.</th>
            <th className="pb-3">Beneficiario</th>
            <th className="pb-3">Cuenta Destino</th>
            <th className="pb-3 text-right">Monto</th>
            <th className="pb-3 text-center">Estado</th>
            <th className="pb-3">Mensaje Motor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm">
          {lines.map((l, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 text-gray-400 font-mono">{l.sequenceNumber}</td>
              <td className="py-4">
                <p className="font-bold text-gray-900">{l.beneficiaryName}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {l.destinationAccountNumber}
                </p>
              </td>
              <td className="py-4 text-gray-600">{l.destinationAccountNumber}</td>
              <td className="py-4 text-right font-mono font-bold text-gray-900">
                ${l.amount.toFixed(2)}
              </td>
              <td className="py-4 text-center">
                <StatusBadge status={l.finalStatus} />
              </td>
              <td className="py-4 text-gray-600 text-xs max-w-xs truncate" title={l.errorMessage}>
                {extractReadableMessage(l.errorMessage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
