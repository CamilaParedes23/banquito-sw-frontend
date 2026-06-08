import { BatchStatus, LineStatus, NotificationStatus, SettlementStatus } from '../../types';
import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: BatchStatus | LineStatus | NotificationStatus | SettlementStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = false }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'RECIBIDO':
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'RECIBIDO' };
      case 'VALIDANDO':
        return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'VALIDANDO' };
      case 'VALIDADO':
        return { color: 'bg-blue-500 text-white border-blue-600', label: 'VALIDADO' };
      case 'RECHAZADO':
      case 'RECHAZADA':
        return { color: 'bg-red-500 text-white border-red-600', label: status };
      case 'ENCOLADO':
        return { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'ENCOLADO' };
      case 'PROCESANDO':
        return {
          color: 'bg-blue-900 text-white border-blue-950',
          label: 'PROCESANDO',
          spinner: true,
        };
      case 'PROCESADO_PARCIAL':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: 'PROCESADO PARCIAL',
        };
      case 'PROCESADO_TOTAL':
        return { color: 'bg-green-500 text-white border-green-600', label: 'PROCESADO TOTAL' };
      case 'CERRADO':
        return { color: 'bg-green-700 text-white border-green-800', label: 'CERRADO' };
      case 'FALLIDO':
        return { color: 'bg-red-700 text-white border-red-800', label: 'FALLIDO' };
      case 'ANULADO':
        return {
          color: 'bg-gray-400 text-gray-800 border-gray-500 line-through',
          label: 'ANULADO',
        };
      case 'PENDIENTE':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'PENDIENTE' };
      case 'EXITOSA':
        return { color: 'bg-green-500 text-white border-green-600', label: 'EXITOSA' };
      case 'FALLIDA':
        return { color: 'bg-red-500 text-white border-red-600', label: 'FALLIDA' };
      case 'ENVIADA':
        return { color: 'bg-green-500 text-white border-green-600', label: 'ENVIADA' };
      case 'ERROR':
        return { color: 'bg-red-500 text-white border-red-600', label: 'ERROR' };
      case 'CANCELADA':
        return { color: 'bg-gray-400 text-gray-800 border-gray-500', label: 'CANCELADA' };
      case 'COMPLETADO':
        return { color: 'bg-green-500 text-white border-green-600', label: 'COMPLETADO' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: status };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.color} ${
        sizeClasses[size]
      } font-medium`}
    >
      {config.spinner && <Loader2 className="w-3 h-3 animate-spin" />}
      {config.label}
    </span>
  );
}
