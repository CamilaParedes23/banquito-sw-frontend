import { Clock } from 'lucide-react';
import { EstadoLoteResponse, ConsultaLoteResponse } from '../../../types/responses';

interface BatchHeaderProps {
  batch: Partial<EstadoLoteResponse & ConsultaLoteResponse>;
}

export function BatchHeader({ batch }: BatchHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entidad Emisora</p>
        <p className="font-bold text-gray-900 mt-1">{batch.rucEmpresa}</p>
        <p className="text-[10px] text-gray-500 italic truncate">{batch.nombreArchivo}</p>
      </div>
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Servicio</p>
        <p className="font-bold text-gray-900 mt-1">{batch.tipoServicio || '-'}</p>
      </div>
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cuenta de Cargo</p>
        <p className="font-mono text-sm font-bold text-blue-600 mt-1">
          {batch.cuentaMatrizCargo || sessionStorage.getItem(`account_${batch.uuidLote}`) || 'CTA-CORRIENTE-VINCULADA'}
        </p>
      </div>
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monto Declarado</p>
        <p className="text-xl font-black text-gray-900 mt-1">
          ${(batch.montoTotalDeclarado || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registros</p>
        <p className="text-xl font-black text-gray-900 mt-1">{batch.totalRegistrosDeclarado}</p>
      </div>
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Recepción</p>
        <p className="text-sm font-bold text-gray-900 mt-1">
          {batch.fechaRecepcion
            ? new Date(batch.fechaRecepcion).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
            : '-'}
        </p>
      </div>
    </div>
  );
}
