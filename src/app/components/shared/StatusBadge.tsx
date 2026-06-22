import { BatchStatus, LineStatus, NotificationStatus, SettlementStatus } from '../../types';
import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: BatchStatus | LineStatus | NotificationStatus | SettlementStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    // Estados de lote (backend en inglés -> español)
    RECEIVED: 'Recibido',
    VALIDATING: 'Validando',
    VALIDATED: 'Validado',
    QUEUED: 'En cola',
    QUEUEING: 'Encolando',
    ENCOLADO: 'Encolado',
    PROCESSING: 'Procesando',
    PROCESSING_ON_US: 'Procesando On-Us',
    PROCESSING_OFF_US: 'Procesando Off-Us',
    PROCESSED_PARTIAL: 'Procesado parcial',
    PROCESSED_TOTAL: 'Procesado total',
    SETTLED: 'Liquidado',
    SETTLED_ON_US: 'Liquidado On-Us',
    SETTLED_OFF_US: 'Liquidado Off-Us',
    CLOSED: 'Cerrado',
    REJECTED: 'Rechazado',
    FAILED: 'Fallido',
    CANCELLED: 'Cancelado',
    DUPLICATE: 'Duplicado',
    // Estados de lote (frontend español)
    RECIBIDO: 'Recibido',
    VALIDANDO: 'Validando',
    VALIDADO: 'Validado',
    PROCESANDO: 'Procesando',
    PROCESADO_PARCIAL: 'Procesado parcial',
    PROCESADO_TOTAL: 'Procesado total',
    CERRADO: 'Cerrado',
    RECHAZADO: 'Rechazado',
    RECHAZADA: 'Rechazada',
    FALLIDO: 'Fallido',
    FALLIDA: 'Fallida',
    ANULADO: 'Anulado',
    // Estados de línea (backend inglés)
    PENDING: 'Pendiente',
    ACCEPTED: 'Aceptado',
    APPROVED: 'Aprobado',
    ACREDITADA_ON_US: 'Acreditada On-Us',
    COMPENSADA_OFF_US: 'Compensada Off-Us',
    REJECTED_LINE: 'Rechazada',
    FAILED_LINE: 'Fallida',
    // Estados de línea (frontend español)
    PENDIENTE: 'Pendiente',
    EXITOSA: 'Exitosa',
    ENVIADA: 'Enviada',
    ERROR: 'Error',
    CANCELADA: 'Cancelada',
  };
  return map[status] || status;
}

export function StatusBadge({ status, size = 'md', showIcon = false }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'RECIBIDO':
      case 'RECEIVED':
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: getStatusLabel(status) };
      case 'VALIDANDO':
      case 'VALIDATING':
        return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: getStatusLabel(status) };
      case 'VALIDADO':
      case 'VALIDATED':
        return { color: 'bg-blue-500 text-white border-blue-600', label: getStatusLabel(status) };
      case 'RECHAZADO':
      case 'RECHAZADA':
      case 'REJECTED':
        return { color: 'bg-red-500 text-white border-red-600', label: getStatusLabel(status) };
      case 'ENCOLADO':
      case 'QUEUED':
      case 'QUEUEING':
        return { color: 'bg-orange-100 text-orange-800 border-orange-300', label: getStatusLabel(status) };
      case 'PROCESANDO':
      case 'PROCESSING':
      case 'PROCESSING_ON_US':
      case 'PROCESSING_OFF_US':
        return {
          color: 'bg-blue-900 text-white border-blue-950',
          label: getStatusLabel(status),
          spinner: true,
        };
      case 'PROCESADO_PARCIAL':
      case 'PROCESSED_PARTIAL':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          label: getStatusLabel(status),
        };
      case 'PROCESADO_TOTAL':
      case 'PROCESSED_TOTAL':
        return { color: 'bg-green-500 text-white border-green-600', label: getStatusLabel(status) };
      case 'CERRADO':
      case 'CLOSED':
      case 'SETTLED':
      case 'SETTLED_ON_US':
      case 'SETTLED_OFF_US':
        return { color: 'bg-green-700 text-white border-green-800', label: getStatusLabel(status) };
      case 'FALLIDO':
      case 'FALLIDA':
      case 'FAILED':
        return { color: 'bg-red-700 text-white border-red-800', label: getStatusLabel(status) };
      case 'ANULADO':
      case 'CANCELLED':
        return {
          color: 'bg-gray-400 text-gray-800 border-gray-500 line-through',
          label: getStatusLabel(status),
        };
      case 'PENDIENTE':
      case 'PENDING':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: getStatusLabel(status) };
      case 'EXITOSA':
      case 'ACCEPTED':
      case 'APPROVED':
      case 'ACREDITADA_ON_US':
        return { color: 'bg-green-500 text-white border-green-600', label: getStatusLabel(status) };
      case 'ENVIADA':
        return { color: 'bg-green-500 text-white border-green-600', label: getStatusLabel(status) };
      case 'ERROR':
        return { color: 'bg-red-500 text-white border-red-600', label: getStatusLabel(status) };
      case 'CANCELADA':
        return { color: 'bg-gray-400 text-gray-800 border-gray-500', label: getStatusLabel(status) };
      case 'COMPENSADA_OFF_US':
        return { color: 'bg-blue-500 text-white border-blue-600', label: getStatusLabel(status) };
      case 'DUPLICATE':
        return { color: 'bg-purple-500 text-white border-purple-600', label: getStatusLabel(status) };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: getStatusLabel(status) };
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
