import { useState, useEffect } from 'react';

import { Link } from 'react-router';

import { RefreshCw, Calendar, Building2, FilterX, ClipboardList, ArrowUpDown } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import { BatchService } from '../../services/batchService';

import { StatusBadge } from '../../components/shared/StatusBadge';

import { toast } from 'sonner';

import { useFetchData } from '../../hooks/useFetchData';

import { ConsultaLoteResponse, PaginaResponse } from '../../types/responses';

import { DEFAULT_PAGE_SIZE } from '../../constants';


const CHANNEL_LABELS: Record<string, string> = {
  PORTAL_WEB: 'Portal Web',
  WEB: 'Portal Web',
  SFTP: 'SFTP',
};


function formatChannel(channel?: string) {
  return CHANNEL_LABELS[channel?.trim().toUpperCase() || ''] || 'Desconocido';
}



export function BatchList() {

  const { user } = useAuth();

  const { data: response, isLoading, execute } = useFetchData<PaginaResponse<ConsultaLoteResponse>>();



  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');

  const [statusFilter, setStatusFilter] = useState('ALL');

  const [rucFilter, setRucFilter] = useState(user?.role === 'EMPRESA' ? user.companyRuc || '' : '');

  const [fechaDesde, setFechaDesde] = useState('');

  const [fechaHasta, setFechaHasta] = useState('');



  const fetchBatches = async (page = 0) => {

    const params: Record<string, string> = {

      page: String(page),

      size: String(DEFAULT_PAGE_SIZE),

    };



    if (rucFilter) params.companyRuc = rucFilter;

    if (serviceTypeFilter !== 'ALL') params.tipoServicio = serviceTypeFilter;

    if (statusFilter !== 'ALL') params.estado = statusFilter;

    if (fechaDesde) params.fechaDesde = `${fechaDesde}T00:00:00-05:00`;

    if (fechaHasta) params.fechaHasta = `${fechaHasta}T23:59:59-05:00`;



    try {

      await execute(() => BatchService.getBatches(params));

    } catch {

      toast.error('Error al consultar la base de datos.');

    }

  };



  useEffect(() => {

    if (user?.role === 'EMPRESA') {

      setRucFilter(user.companyRuc || '');

    } else {

      setRucFilter('');

    }

  }, [user?.role]);



  useEffect(() => {

    fetchBatches();

  }, [serviceTypeFilter, statusFilter, rucFilter, fechaDesde, fechaHasta]);



  const clearFilters = () => {

    setServiceTypeFilter('ALL');

    setStatusFilter('ALL');

    setRucFilter(user?.role === 'EMPRESA' ? user.companyRuc || '' : '');

    setFechaDesde('');

    setFechaHasta('');

  };



  // Ordenar lotes SIEMPRE por fecha de recepción (más recientes primero)
  const batches = (response?.content || []).sort((a, b) => {
    const dateA = new Date(a.receivedAt).getTime();
    const dateB = new Date(b.receivedAt).getTime();
    return dateB - dateA; // Descendente: más recientes primero
  });

  const pagination = {

    pagina: response?.currentPage || 0,

    totalPaginas: response?.totalPages || 1,

    totalElementos: response?.totalElements || 0,

  };



  return (

    <div className="space-y-8">

      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold mb-2">

              {user?.role === 'EMPRESA' ? 'Mis Lotes de Pagos' : 'Consulta de Lotes'}

            </h1>

            <p className="text-blue-200 text-lg">Consulta y gestión de lotes de pagos masivos</p>

          </div>

          <div className="flex gap-3">

            <button 

              onClick={clearFilters}

              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-white/20 border-2 border-white/30 rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm"

            >

              <FilterX className="w-5 h-5" />

              Limpiar Filtros

            </button>

            <button 

              onClick={() => fetchBatches(pagination.pagina)}

              disabled={isLoading}

              className="p-3 text-white bg-white/20 border-2 border-white/30 rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all backdrop-blur-sm"

            >

              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />

            </button>

          </div>

        </div>

      </div>



      {/* Panel de filtros mejorado */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

        <h3 className="text-lg font-bold text-[#0D1B4B] mb-6">Filtros de Búsqueda</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          <div>

            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RUC Entidad</label>

            <div className="relative">

              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input

                type="text"

                value={rucFilter}

                onChange={(e) => setRucFilter(e.target.value)}

                placeholder="RUC Empresa..."

                disabled={user?.role === 'EMPRESA'}

                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0D1B4B] focus:border-[#0D1B4B] text-sm disabled:bg-gray-50"

              />

            </div>

          </div>

          

          <div>

            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Servicio</label>

            <select

              value={serviceTypeFilter}

              onChange={(e) => setServiceTypeFilter(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0D1B4B] text-sm"

            >

              <option value="ALL">Todos los servicios</option>

              <option value="NOM">NOM - Nómina</option>

              <option value="PRV">PRV - Proveedores</option>

            </select>

          </div>



          <div>

            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estado Lote</label>

            <select

              value={statusFilter}

              onChange={(e) => setStatusFilter(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0D1B4B] text-sm"

            >

              <option value="ALL">Todos los estados</option>

              <option value="RECIBIDO">Recibido</option>

              <option value="ENCOLADO">En cola</option>

              <option value="VALIDANDO">Validando</option>

              <option value="VALIDADO">Validado</option>

              <option value="PROCESANDO">Procesando</option>

              <option value="PROCESADO_TOTAL">Procesado total</option>

              <option value="PROCESADO_PARCIAL">Procesado parcial</option>

              <option value="CERRADO">Cerrado</option>

              <option value="RECHAZADO">Rechazado</option>

              <option value="FALLIDO">Fallido</option>

              <option value="ANULADO">Anulado</option>

            </select>

          </div>



          <div>

            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha Desde</label>

            <div className="relative">

              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input

                type="date"

                value={fechaDesde}

                onChange={(e) => setFechaDesde(e.target.value)}

                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0D1B4B] text-sm"

              />

            </div>

          </div>



          <div>

            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha Hasta</label>

            <div className="relative">

              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input

                type="date"

                value={fechaHasta}

                onChange={(e) => setFechaHasta(e.target.value)}

                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0D1B4B] text-sm"

              />

            </div>

          </div>

        </div>

      </div>



      {/* Tabla mejorada */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">

              <tr>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Archivo</th>

                {user?.role !== 'EMPRESA' && <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">RUC</th>}

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Canal</th>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-right">Monto Total</th>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-center">Registros</th>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-center">Estado</th>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Fecha</th>

                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-center">Detalle</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {isLoading ? (

                <tr>

                  <td colSpan={8} className="px-6 py-20 text-center">

                    <RefreshCw className="w-10 h-10 animate-spin text-[#0D1B4B] mx-auto opacity-20" />

                  </td>

                </tr>

              ) : batches.length === 0 ? (

                <tr>

                  <td colSpan={8} className="px-6 py-20 text-center text-gray-400 italic font-light">

                    No se encontraron lotes para los filtros seleccionados.

                  </td>

                </tr>

              ) : (

                batches.map((batch) => (

                  <tr key={batch.batchId} className="hover:bg-gray-50 transition-colors group">

                    <td className="px-6 py-4 text-sm font-semibold text-[#0D1B4B]">

                      {batch.fileName}

                    </td>

                    {user?.role !== 'EMPRESA' && (

                      <td className="px-6 py-4 text-xs text-gray-500">

                        {batch.companyRuc}

                      </td>

                    )}

                    <td className="px-6 py-4 text-xs text-gray-500">

                      {formatChannel(batch.channel)}

                    </td>

                    <td className="px-6 py-4 text-sm font-mono font-bold text-right text-gray-900">

                      ${batch.controlAmount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}

                    </td>

                    <td className="px-6 py-4 text-sm text-center text-gray-600">

                      {batch.totalRecords}

                    </td>

                    <td className="px-6 py-4 text-center">

                      {batch.status && <StatusBadge status={batch.status} />}

                    </td>

                    <td className="px-6 py-4 text-[11px] text-gray-500">

                      {new Date(batch.receivedAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}

                    </td>

                    <td className="px-6 py-4 text-center">

                      <Link

                        to={`/batches/${batch.batchId}`}

                        state={{ batch }}

                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] transition-all shadow-md hover:shadow-lg text-xs font-semibold"

                      >

                        <ClipboardList className="w-4 h-4 mr-1" />

                        Ver

                      </Link>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">

          <p className="text-sm text-gray-600 font-semibold">

            Página {pagination.pagina + 1} de {pagination.totalPaginas} · {pagination.totalElementos} registros totales

          </p>

          <div className="flex gap-3">

            <button 

              onClick={() => fetchBatches(pagination.pagina - 1)}

              disabled={pagination.pagina === 0 || isLoading}

              className="px-6 py-2.5 text-sm font-semibold bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-[#0D1B4B] hover:text-white hover:border-[#0D1B4B] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"

            >

              Anterior

            </button>

            <button 

              onClick={() => fetchBatches(pagination.pagina + 1)}

              disabled={pagination.pagina + 1 >= pagination.totalPaginas || isLoading}

              className="px-6 py-2.5 text-sm font-semibold bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-[#0D1B4B] hover:text-white hover:border-[#0D1B4B] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"

            >

              Siguiente

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}

