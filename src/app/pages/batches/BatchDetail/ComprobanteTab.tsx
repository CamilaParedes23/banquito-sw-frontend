import { Receipt } from 'lucide-react';

interface ComprobanteEmpresa {
  rucEmpresa: string;
  cuentaMatrizCargo: string;
}

interface ComprobanteResumenPagos {
  transaccionesExitosas: number;
  transaccionesRechazadas: number;
  montoTotalDispersado: number;
}

interface ComprobanteLiquidacionServicio {
  tarifaUnitariaAplicada: number;
  subtotalComision: number;
  ivaPorcentajeAplicado: number;
  montoIva: number;
  totalDebitado: number;
}

interface ComprobanteData {
  uuidLote: string;
  tipoReporte: string;
  empresa?: ComprobanteEmpresa;
  resumenPagos?: ComprobanteResumenPagos;
  liquidacionServicio?: ComprobanteLiquidacionServicio;
  fechaGeneracion?: string;
}

interface ComprobanteTabProps {
  isLoading: boolean;
  data: ComprobanteData | null;
}

export function ComprobanteTab({ isLoading, data }: ComprobanteTabProps) {
  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando comprobante...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">Comprobante no disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0D1B4B]">Comprobante de Liquidación</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">{data.uuidLote}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
              {data.tipoReporte}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">RUC Empresa</p>
              <p className="font-bold text-gray-900">{data.empresa?.rucEmpresa}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Cuenta Matriz</p>
              <p className="font-mono text-gray-900">{data.empresa?.cuentaMatrizCargo}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resumen de Pagos</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transacciones Exitosas</span>
              <span className="font-bold text-green-700">{data.resumenPagos?.transaccionesExitosas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transacciones Rechazadas</span>
              <span className="font-bold text-red-700">{data.resumenPagos?.transaccionesRechazadas}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-900 font-bold">Monto Total Dispersado</span>
              <span className="font-black text-[#0D1B4B]">
                ${Number(data.resumenPagos?.montoTotalDispersado).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Liquidación del Servicio</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tarifa Unitaria</span>
              <span className="font-bold">${Number(data.liquidacionServicio?.tarifaUnitariaAplicada).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal Comisión</span>
              <span className="font-bold">
                ${Number(data.liquidacionServicio?.subtotalComision).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA ({Number(data.liquidacionServicio?.ivaPorcentajeAplicado || 0.15) * 100}%)</span>
              <span className="font-bold">
                ${Number(data.liquidacionServicio?.montoIva).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-[#0D1B4B] text-white p-4 rounded-lg flex justify-between items-center mt-4">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60">Total Debitado por Servicios</p>
                <p className="text-xl font-black">
                  ${Number(data.liquidacionServicio?.totalDebitado).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Receipt className="w-8 h-8 opacity-20" />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Generado: {data.fechaGeneracion ? new Date(data.fechaGeneracion).toLocaleString('es-EC') : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
