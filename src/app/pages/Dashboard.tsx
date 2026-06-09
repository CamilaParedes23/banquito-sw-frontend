import { useEffect } from 'react';

import { Link } from 'react-router';

import {

  FileText,

  DollarSign,

  AlertTriangle,

  CheckCircle,

  Clock,

  TrendingUp,

  Upload,

  RefreshCw,

  Ban,

  Lock

} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import { BatchService } from '../services/batchService';

import { StatusBadge } from '../components/shared/StatusBadge';

import { useFetchData } from '../hooks/useFetchData';

import { ConsultaLoteResponse, PaginaResponse } from '../types/responses';

import { MAX_PAGE_SIZE } from '../constants';



interface DashboardStats {
  totalLotes: number;
  montoTotal: number;
  pendientes: number;
  enProceso: number;
  anulados: number;
  cerrados: number;
  rechazados: number;
}



function calculateDashboardStats(batches: ConsultaLoteResponse[]): DashboardStats {
  return batches.reduce(
    (acc, b) => {
      acc.totalLotes++;
      acc.montoTotal += b.montoTotalDeclarado || 0;
      if (['RECIBIDO', 'VALIDADO', 'ENCOLADO'].includes(b.estado)) acc.pendientes++;
      if (['VALIDANDO', 'PROCESANDO'].includes(b.estado)) acc.enProceso++;
      if (b.estado === 'ANULADO') acc.anulados++;
      if (b.estado === 'CERRADO') acc.cerrados++;
      if (b.estado === 'RECHAZADO' || b.estado === 'FALLIDO') acc.rechazados++;
      return acc;
    },
    { totalLotes: 0, montoTotal: 0, pendientes: 0, enProceso: 0, anulados: 0, cerrados: 0, rechazados: 0 }
  );
}



export function Dashboard() {

  const { user } = useAuth();

  const { data: response, isLoading, execute } = useFetchData<PaginaResponse<ConsultaLoteResponse>>();



  useEffect(() => {

    const params: Record<string, string> = { page: '0', size: String(MAX_PAGE_SIZE) };

    if (user?.role === 'EMPRESA' && user.companyRuc) params.rucEmpresa = user.companyRuc;

    execute(() => BatchService.getBatches(params));

  }, [user, execute]);



  const batches = (response?.contenido || []).slice(0, 5);

  const stats = calculateDashboardStats(response?.contenido || []);



  if (isLoading) {

    return (

      <div className="flex flex-col items-center justify-center py-20">

        <RefreshCw className="w-10 h-10 animate-spin text-[#0D1B4B] mb-4 opacity-20" />

        <p className="text-gray-400 italic">Cargando tablero operativo...</p>

      </div>

    );

  }



  return (

    <div className="space-y-8">

      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold mb-2">Bienvenido de nuevo</h1>

            <p className="text-blue-200 text-lg">

              {user?.role === 'EMPRESA'

                ? `${user.companyName}`

                : 'Panel de Control - Switch de Pagos Masivos'}

            </p>

          </div>

          {user?.role === 'EMPRESA' && (

            <Link

              to="/batches/upload"

              className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-8 py-4 rounded-xl flex items-center gap-3 shadow-2xl transition-all font-semibold text-lg"

            >

              <Upload className="w-6 h-6" />

              Cargar Nuevo Lote

            </Link>

          )}

        </div>

      </div>



      {/* Tarjetas de estadísticas modernas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Lotes Totales */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">Total de Lotes</p>

              <h3 className="text-4xl font-bold tracking-tight">{stats.totalLotes}</h3>

              <p className="text-xs opacity-75 mt-2">Lotes procesados</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <FileText className="w-8 h-8" />

            </div>

          </div>

        </div>



        {/* Card 2: Volumen Total */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">Volumen Total</p>

              <h3 className="text-3xl font-bold tracking-tight">

                ${stats.montoTotal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}

              </h3>

              <p className="text-xs opacity-75 mt-2">Monto procesado</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <DollarSign className="w-8 h-8" />

            </div>

          </div>

        </div>

        {/* Card 3: Exitosos */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">Lotes Cerrados</p>

              <h3 className="text-4xl font-bold tracking-tight">{stats.cerrados}</h3>

              <p className="text-xs opacity-75 mt-2">Completados exitosamente</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <CheckCircle className="w-8 h-8" />

            </div>

          </div>

        </div>

        {/* Card 4: Pendientes */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">Por Atender</p>

              <h3 className="text-4xl font-bold tracking-tight">{stats.pendientes}</h3>

              <p className="text-xs opacity-75 mt-2">Requieren atención</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <Clock className="w-8 h-8" />

            </div>

          </div>

        </div>

        {/* Card 5: En Proceso */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">En Proceso</p>

              <h3 className="text-4xl font-bold tracking-tight">{stats.enProceso}</h3>

              <p className="text-xs opacity-75 mt-2">Procesando ahora</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <TrendingUp className="w-8 h-8" />

            </div>

          </div>

        </div>

        {/* Card 6: Rechazados */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">

          <div className="flex items-start justify-between mb-4">

            <div className="flex-1">

              <p className="text-sm font-medium opacity-90 mb-1">Rechazados</p>

              <h3 className="text-4xl font-bold tracking-tight">{stats.rechazados}</h3>

              <p className="text-xs opacity-75 mt-2">Con errores</p>

            </div>

            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">

              <AlertTriangle className="w-8 h-8" />

            </div>

          </div>

        </div>

      </div>



      {/* Tabla de actividad reciente mejorada */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">

          <div>
            <h2 className="text-2xl font-bold text-[#0D1B4B]">Actividad Reciente</h2>
            <p className="text-sm text-gray-600 mt-1">Últimos lotes procesados</p>
          </div>

          <Link to="/batches" className="text-sm font-semibold text-[#10b981] hover:text-[#059669] flex items-center gap-2 transition-colors">
            Ver Historial Completo 
            <TrendingUp className="w-4 h-4" />
          </Link>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-50/50">

              <tr>

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Empresa</th>

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Monto</th>

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Estado</th>

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Gestión</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {batches.map((batch) => (

                <tr key={batch.uuidLote} className="hover:bg-gray-50/50 transition-colors">

                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{batch.rucEmpresa}</td>

                  <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">

                    ${batch.montoTotalDeclarado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}

                  </td>

                  <td className="px-6 py-4 text-center">

                    {batch.estado && <StatusBadge status={batch.estado} size="sm" />}

                  </td>

                  <td className="px-6 py-4 text-center">

                    <Link

                      to={`/batches/${batch.uuidLote}`}

                      state={{ batch }}

                      className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg hover:from-[#059669] hover:to-[#047857] transition-all shadow-md hover:shadow-lg"

                    >

                      Ver Detalles

                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

