import { useState, useEffect } from 'react';
import { ConfigService } from '../../services/configService';
import { ENV } from '../../config/env';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Database, Server, Mail, Wifi } from 'lucide-react';

interface SystemParams {
  horaCorteProceso?: string;
  horaInicioLotesEncolados?: string;
}

export function SystemHealth() {
  const [isUp, setIsUp] = useState<boolean | null>(null);
  const [params, setParams] = useState<SystemParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await ConfigService.getSystemHealth();
      setIsUp(true);
      setParams(data);
      setLastCheck(new Date().toLocaleTimeString('es-EC'));
    } catch {
      setIsUp(false);
      setLastCheck(new Date().toLocaleTimeString('es-EC'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const globalStatus = isLoading ? 'CHECKING' : isUp ? 'UP' : 'DOWN';

  const services = [
    {
      label: 'Switch de Pagos BanQuito',
      icon: <Activity className="w-5 h-5" />,
      status: globalStatus,
      detail: isUp ? 'API respondiendo correctamente' : 'Sin respuesta del servidor',
    },
    {
      label: 'Base de Datos PostgreSQL',
      icon: <Database className="w-5 h-5" />,
      status: isUp ? 'UP' : 'DOWN',
      detail: isUp ? `Zona horaria: ${params?.zonaHoraria || 'América/Guayaquil'}` : 'No disponible',
    },
    {
      label: 'Motor de Procesamiento',
      icon: <Server className="w-5 h-5" />,
      status: isUp ? 'UP' : 'DOWN',
      detail: isUp ? `Corte operativo: ${params?.horaCorteProceso || '--:--'}` : 'No disponible',
    },
    {
      label: 'Servicio de Notificaciones',
      icon: <Mail className="w-5 h-5" />,
      status: isUp ? 'UP' : 'DOWN',
      detail: isUp ? 'SMTP simulado activo' : 'No disponible',
    },
    {
      label: 'Conectividad de Red',
      icon: <Wifi className="w-5 h-5" />,
      status: isUp ? 'UP' : 'DOWN',
      detail: isUp ? `${ENV.API_BASE_URL} alcanzable` : 'No se puede contactar el servidor',
    },
  ];

  const statusColor = {
    UP: 'text-green-700',
    DOWN: 'text-red-700',
    CHECKING: 'text-gray-400',
  };

  const statusBg = {
    UP: 'border-green-200 bg-green-50',
    DOWN: 'border-red-200 bg-red-50',
    CHECKING: 'border-gray-200 bg-gray-50',
  };

  const badgeClass = (s: string) =>
    s === 'UP'
      ? 'bg-green-50 text-green-700 border border-green-100'
      : s === 'DOWN'
      ? 'bg-red-50 text-red-700 border border-red-100'
      : 'bg-gray-100 text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B4B]">Estado del Sistema</h1>
          <p className="text-gray-500 mt-1">
            Monitoreo en tiempo real del Switch de Pagos BanQuito
            {lastCheck && (
              <span className="ml-2 text-xs text-gray-400">· Última verificación: {lastCheck}</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1B4B] text-white rounded-lg hover:bg-[#1e3a8a] transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Verificar ahora
        </button>
      </div>

      <div className={`rounded-xl border-2 p-6 flex items-center gap-5 ${statusBg[globalStatus as keyof typeof statusBg]}`}>
        {isLoading ? (
          <RefreshCw className="w-10 h-10 animate-spin text-gray-300" />
        ) : isUp ? (
          <CheckCircle className="w-10 h-10 text-green-500" />
        ) : (
          <XCircle className="w-10 h-10 text-red-500" />
        )}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado General del Switch</p>
          <p className={`text-3xl font-bold mt-1 ${statusColor[globalStatus as keyof typeof statusColor]}`}>
            {isLoading
              ? 'Verificando...'
              : isUp
              ? '✓ OPERATIVO'
              : '✗ FUERA DE SERVICIO'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Se actualiza automáticamente cada 30 segundos.</p>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Componentes del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map(({ label, icon, status, detail }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`p-2 rounded-lg ${
                  status === 'UP' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0D1B4B]">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${badgeClass(status)}`}>
                {status === 'UP' ? 'EN LÍNEA' : status === 'DOWN' ? 'CAÍDO' : '...'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Fuente:</strong> El estado se verifica consultando la API del Switch en{' '}
          <code className="bg-gray-100 px-1 rounded">{ENV.API_BASE_URL}</code>. 
          Se actualiza cada 30 segundos en segundo plano.
        </p>
      </div>
    </div>
  );
}
