import { useState, useEffect } from 'react';
import { ConfigService } from '../../services/configService';
import { RefreshCw, Clock, Globe, CalendarRange, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SystemParams {
  horaCorteProceso?: string;
  horaInicioLotesEncolados?: string;
}

export function SystemParameters() {
  const [params, setParams] = useState<SystemParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParams = async () => {
    setIsLoading(true);
    try {
      const data = await ConfigService.getOperatingHours();
      setParams(data);
    } catch {
      toast.error('No se pudieron cargar los parámetros del sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchParams(); }, []);

  const paramCards = params ? [
    {
      icon: <Clock className="w-5 h-5 text-[#0D1B4B]" />,
      label: 'Hora de Corte de Procesos',
      value: params.horaCorteProceso,
      description: 'Lotes recibidos después de esta hora quedan en cola para el siguiente día hábil.',
      color: 'border-blue-200 bg-blue-50',
      valueColor: 'text-[#0D1B4B]',
    },
    {
      icon: <CalendarRange className="w-5 h-5 text-amber-600" />,
      label: 'Inicio de Procesamiento de Cola',
      value: params.horaInicioLotesEncolados,
      description: 'Hora en que el sistema libera automáticamente los lotes encolados para procesamiento.',
      color: 'border-amber-200 bg-amber-50',
      valueColor: 'text-amber-700',
    },
    {
      icon: <Info className="w-5 h-5 text-red-500" />,
      label: 'Ventana de Duplicidad',
      value: `${params.ventanaDuplicidadDias} día(s)`,
      description: 'Período en el que el sistema rechaza automáticamente lotes idénticos para evitar doble pago.',
      color: 'border-red-200 bg-red-50',
      valueColor: 'text-red-700',
    },
    {
      icon: <Globe className="w-5 h-5 text-green-600" />,
      label: 'Zona Horaria Operativa',
      value: params.zonaHoraria,
      description: 'Zona horaria base para el cálculo de todos los horarios del Switch de Pagos.',
      color: 'border-green-200 bg-green-50',
      valueColor: 'text-green-700',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B4B]">Parámetros Operativos</h1>
          <p className="text-gray-500 mt-1">Configuración del ciclo de operación del Switch de Pagos</p>
        </div>
        <button
          onClick={fetchParams}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1B4B] text-white rounded-lg hover:bg-[#1e3a8a] transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : !params ? (
        <div className="bg-white rounded-xl border border-gray-100 p-20 text-center text-gray-400 italic">
          No se pudo cargar la configuración del sistema.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paramCards.map((card, idx) => (
              <div key={idx} className={`rounded-xl border p-6 ${card.color}`}>
                <div className="flex items-center gap-2 mb-3">
                  {card.icon}
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{card.label}</span>
                </div>
                <p className={`text-2xl font-mono font-bold ${card.valueColor} mb-2`}>
                  {card.value || '—'}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {params.mensaje && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{params.mensaje}</p>
            </div>
          )}
        </>
      )}

      <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Fuente:</strong> Valores obtenidos mediante <code className="mx-1 bg-gray-100 px-1 rounded">GET /api/v1/pagos-masivos/horarios-corte</code>. 
          El backend los extrae de la configuración operativa vigente del Switch.
        </p>
      </div>
    </div>
  );
}
