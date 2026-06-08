import { useState, useEffect } from 'react';
import { ConfigService } from '../../services/configService';
import { RefreshCw, CalendarCheck, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { TarifaServicioResponse } from '../../types/responses';

export function Tariffs() {
  const [tariffs, setTariffs] = useState<TarifaServicioResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTariffs = async () => {
    setIsLoading(true);
    try {
      const data = await ConfigService.getPricingRules();
      setTariffs(Array.isArray(data) ? data : [data]);
    } catch {
      toast.error('No se pudo cargar el tarifario.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTariffs(); }, []);

  const serviceLabel = (code: string) => {
    if (code === 'NOM') return 'Pago de Nómina';
    if (code === 'PRV') return 'Pago a Proveedores';
    return code;
  };

  const serviceColor = (code: string) => {
    if (code === 'NOM') return 'bg-blue-600';
    if (code === 'PRV') return 'bg-[#C9A84C]';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B4B]">Tarifario Oficial</h1>
          <p className="text-gray-500 mt-1">Esquema de comisiones vigente por tipo de servicio</p>
        </div>
        <button
          onClick={fetchTariffs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1B4B] text-white rounded-lg hover:bg-[#1e3a8a] transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-20 text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#0D1B4B] opacity-20" />
          <p className="mt-4 text-gray-400 font-medium">Cargando tarifario...</p>
        </div>
      ) : tariffs.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-20 text-center text-gray-400 italic">
          No hay tarifas activas configuradas en el sistema.
        </div>
      ) : (
        tariffs.map((serviceTariff, sIdx) => (
          <div key={`${serviceTariff.tipoServicio}-${sIdx}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${serviceColor(serviceTariff.tipoServicio)}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <span className="text-base font-bold text-[#0D1B4B]">
                      {serviceLabel(serviceTariff.tipoServicio)}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {serviceTariff.tipoServicio}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Divisa: <strong>{serviceTariff.moneda || 'USD'}</strong> · 
                    {' '}{serviceTariff.rangos?.length || 0} rangos configurados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <CalendarCheck className="w-4 h-4 text-amber-600" />
                <div className="text-right">
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Vigente desde</p>
                  <p className="text-sm font-mono font-bold text-amber-700">
                    {serviceTariff.vigenteDesde || 'Sin fecha'}
                  </p>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tramo</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transacciones Desde</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transacciones Hasta</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Costo por Transacción</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(serviceTariff.rangos || []).map((range: { rangoDesde: number; rangoHasta: number | null; tarifaUnitaria: number }, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-400">
                      TRAMO {rIdx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {range.rangoDesde?.toLocaleString()} transacciones
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {range.rangoHasta ? `${range.rangoHasta?.toLocaleString()} transacciones` : 'Sin límite'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-mono font-bold text-[#C9A84C]">
                        ${(range.tarifaUnitaria || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">c/u</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
                        ACTIVO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {!isLoading && tariffs.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-[#0D1B4B] p-4 rounded-r-lg">
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>Nota de Auditoría:</strong> La fecha "Vigente desde" aplica al esquema completo de rangos del servicio. 
            Una modificación en el tarifario afecta automáticamente el cálculo de comisiones en todos los lotes posteriores a esa fecha.
          </p>
        </div>
      )}
    </div>
  );
}
