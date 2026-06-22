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

  // Try to extract "message" from JSON embedded in the string
  const messageMatch = errorMessage.match(/"message"\s*:\s*"([^"]+)"/);
  if (messageMatch) {
    return messageMatch[1];
  }

  // Fallback: extract after "body=" if present
  const bodyMatch = errorMessage.match(/body=\{[^}]*\}/);
  if (bodyMatch) {
    try {
      const jsonStr = bodyMatch[0].replace('body=', '');
      const parsed = JSON.parse(jsonStr);
      if (parsed.message) return parsed.message;
      if (parsed.code) return parsed.code;
    } catch {
      // ignore parse errors
    }
  }

  // If too long, truncate
  if (errorMessage.length > 80) {
    return errorMessage.substring(0, 80) + '...';
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
