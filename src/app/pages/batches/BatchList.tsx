import { useState, useEffect } from 'react';

import { Link } from 'react-router';

import { RefreshCw, Calendar, Building2, FilterX, ClipboardList } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import { BatchService } from '../../services/batchService';

import { StatusBadge } from '../../components/shared/StatusBadge';

import { toast } from 'sonner';

import { useFetchData } from '../../hooks/useFetchData';

import { ConsultaLoteResponse, PaginaResponse } from '../../types/responses';

import { DEFAULT_PAGE_SIZE } from '../../constants';



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



    if (rucFilter) params.rucEmpresa = rucFilter;

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



  const batches = response?.contenido || [];

  const pagination = {

    pagina: response?.pagina || 0,

    totalPaginas: response?.totalPaginas || 1,

    totalElementos: response?.totalElementos || 0,

  };



  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-[#0D1B4B]">

            {user?.role === 'EMPRESA' ? 'Lotes de Pagos' : 'Consulta de Lotes'}

          </h1>

          <p className="text-gray-600 mt-1">Consulta y gestión de lotes de pagos masivos</p>

        </div>

        <div className="flex gap-2">

          <button 

            onClick={clearFilters}

            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"

          >

            <FilterX className="w-4 h-4" />

            Reiniciar

          </button>

          <button 

            onClick={() => fetchBatches(pagination.pagina)}

            disabled={isLoading}

            className="p-2 text-white bg-[#0D1B4B] rounded-lg hover:bg-[#1e3a8a] disabled:opacity-50 transition-all"

          >

            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />

          </button>

        </div>

      </div>



      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

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

              <option value="RECIBIDO">RECIBIDO</option>

              <option value="ENCOLADO">ENCOLADO</option>

              <option value="VALIDANDO">VALIDANDO</option>

              <option value="VALIDADO">VALIDADO</option>

              <option value="PROCESANDO">PROCESANDO</option>

              <option value="PROCESADO_TOTAL">PROCESADO TOTAL</option>

              <option value="PROCESADO_PARCIAL">PROCESADO PARCIAL</option>

              <option value="CERRADO">CERRADO</option>

              <option value="RECHAZADO">RECHAZADO</option>

              <option value="FALLIDO">FALLIDO</option>

              <option value="ANULADO">ANULADO</option>

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



      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead className="bg-[#F8FAFC] border-b border-gray-200">

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

                  <tr key={batch.uuidLote} className="hover:bg-gray-50 transition-colors group">

                    <td className="px-6 py-4 text-sm font-semibold text-[#0D1B4B]">

                      {batch.nombreArchivo}

                    </td>

                    {user?.role !== 'EMPRESA' && (

                      <td className="px-6 py-4 text-xs text-gray-500">

                        {batch.rucEmpresa}

                      </td>

                    )}

                    <td className="px-6 py-4 text-xs text-gray-500">

                      <span className="uppercase">{batch.canalIngreso}</span>

                    </td>

                    <td className="px-6 py-4 text-sm font-mono font-bold text-right text-gray-900">

                      ${batch.montoTotalDeclarado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}

                    </td>

                    <td className="px-6 py-4 text-sm text-center text-gray-600">

                      {batch.totalRegistrosDeclarado}

                    </td>

                    <td className="px-6 py-4 text-center">

                      {batch.estado && <StatusBadge status={batch.estado} />}

                    </td>

                    <td className="px-6 py-4 text-[11px] text-gray-500">

                      {new Date(batch.fechaRecepcion).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}

                    </td>

                    <td className="px-6 py-4 text-center">

                      <Link

                        to={`/batches/${batch.uuidLote}`}

                        state={{ batch }}

                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 group-hover:bg-[#C9A84C] group-hover:text-white transition-all shadow-sm"

                      >

                        <ClipboardList className="w-4 h-4" />

                      </Link>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">

          <p className="text-xs text-gray-400 font-medium">

            PÁGINA {pagination.pagina + 1} DE {pagination.totalPaginas} | {pagination.totalElementos} REGISTROS TOTALES

          </p>

          <div className="flex gap-1">

            <button 

              onClick={() => fetchBatches(pagination.pagina - 1)}

              disabled={pagination.pagina === 0 || isLoading}

              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded text-gray-400 hover:text-[#0D1B4B] hover:border-[#0D1B4B] disabled:opacity-30 transition-all"

            >

              Anterior

            </button>

            <button 

              onClick={() => fetchBatches(pagination.pagina + 1)}

              disabled={pagination.pagina + 1 >= pagination.totalPaginas || isLoading}

              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded text-gray-400 hover:text-[#0D1B4B] hover:border-[#0D1B4B] disabled:opacity-30 transition-all"

            >

              Siguiente

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}

