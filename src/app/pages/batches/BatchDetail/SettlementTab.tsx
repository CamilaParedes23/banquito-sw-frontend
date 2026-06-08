import { CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import { LiquidarLoteResponse } from '../../../types/responses';

interface SettlementTabProps {
  liquidationResult: LiquidarLoteResponse | null;
  settlement: {
    rate: number;
    subtotal: number;
    iva: number;
    total: number;
  };
  successfulCount: number;
  feesCurrency?: string;
}

export function SettlementTab({ liquidationResult, settlement, successfulCount, feesCurrency }: SettlementTabProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {liquidationResult ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-green-700">Datos reales de liquidación registrados en el sistema</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Proyección estimada. Los valores finales se calcularán al liquidar.</span>
        </div>
      )}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h4 className="text-sm font-bold text-[#0D1B4B] mb-4 flex justify-between items-center">
          Resumen Financiero
          {feesCurrency && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Tarifa en {feesCurrency}</span>}
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Pagos Ejecutados Exitosamente</span>
            <span className="font-bold">{successfulCount}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Tarifa Unitaria (vía API)</span>
            <span className="font-bold">${settlement.rate.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
            <span>Comisión Neta</span>
            <span className="font-bold">${settlement.subtotal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>IVA Servicio (15%)</span>
            <span className="font-bold">${settlement.iva.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-[#0D1B4B] text-white p-5 rounded-lg flex justify-between items-center mt-6 shadow-lg">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-60">Total a Debitar de Cuenta</p>
              <p className="text-2xl font-black">${settlement.total.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
            </div>
            <Receipt className="w-8 h-8 opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
