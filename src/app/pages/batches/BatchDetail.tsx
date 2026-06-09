import { useState } from 'react';

import { useParams, useNavigate } from 'react-router';

import { ArrowLeft, Download, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

import { BatchService } from '../../services/batchService';

import {

  comprobanteLiquidacionToCsv,

  downloadTextFile,

  reporteNovedadesToCsv,

  generateComprobantePdf,

  generateNovedadesPdf,

} from '../../utils/batchReportExport';

import { StatusBadge } from '../../components/shared/StatusBadge';

import { ConfirmModal } from '../../components/shared/ConfirmModal';

import { toast } from 'sonner';

import { useBatchDetail } from '../../hooks/useBatchDetail';

import { useAuth } from '../../context/AuthContext';

import { BatchHeader } from './BatchDetail/BatchHeader';

import { BatchActions } from './BatchDetail/BatchActions';

import { BatchLinesTable } from './BatchDetail/BatchLinesTable';

import { SettlementTab } from './BatchDetail/SettlementTab';

import { NovedadesTab } from './BatchDetail/NovedadesTab';

import { ComprobanteTab } from './BatchDetail/ComprobanteTab';



export function BatchDetail() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { user } = useAuth();



  const {

    batch,

    lines,

    fees,

    liquidationResult,

    setLiquidationResult,

    novedades,

    comprobante,

    isLoadingReports,

    settlement,

    successfulLines,

    fetchData,

  } = useBatchDetail(id);



  const [activeTab, setActiveTab] = useState<'lines' | 'settlement' | 'novedades' | 'comprobante'>('lines');

  const [showActionModal, setShowActionModal] = useState<{ type: 'ANNUL' | null }>({ type: null });

  const [annulReason, setAnnulReason] = useState('');

  const [novedadesFormat, setNovedadesFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const [comprobanteFormat, setComprobanteFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const [isActionLoading, setIsActionLoading] = useState(false);



  const handleAction = async () => {

    if (!id || isActionLoading) return;

    console.log('handleAction - id:', id, 'type:', showActionModal.type);

    setIsActionLoading(true);

    try {

      if (showActionModal.type === 'ANNUL') await BatchService.annulBatch(id, annulReason);



      toast.success('Petición procesada por el Switch.');

      setShowActionModal({ type: null });

      fetchData();

    } catch (error: unknown) {

      const errorMessage = error instanceof Error ? error.message : 'Error en la operación bancaria.';



      // Manejo de errores amigables para doble click y conflictos

      if (errorMessage.includes('409') || errorMessage.includes('conflict') || errorMessage.includes('ya está en proceso')) {

        toast.error('La operación ya está en proceso. Por favor espere a que termine.');

      } else if (errorMessage.includes('500') || errorMessage.includes('internal server') || errorMessage.includes('error del servidor')) {

        toast.error('El servidor está procesando la solicitud. Por favor espere unos segundos.');

      } else if (errorMessage.includes('404') || errorMessage.includes('no encontrado')) {

        toast.error('Lote no encontrado. Por favor recargue la página.');

      } else if (errorMessage.includes('400') || errorMessage.includes('solicitud')) {

        toast.error('La solicitud no es válida. Verifique el estado del lote.');

      } else {

        toast.error(errorMessage);

      }

    } finally {

      setIsActionLoading(false);

    }

  };



  const handleDownloadReport = async (type: 'NOVEDADES' | 'COMPROBANTE', format: 'csv' | 'json' | 'pdf') => {

    try {

      const data = type === 'NOVEDADES'

        ? await BatchService.getBatchNovedades(id!)

        : await BatchService.getBatchComprobante(id!);



      const shortId = id?.substring(0, 8) ?? 'lote';

      if (format === 'pdf') {

        if (type === 'NOVEDADES') {

          generateNovedadesPdf(data);

        } else {

          generateComprobantePdf(data);

        }

        toast.success(`Descarga PDF lista.`);

      } else if (format === 'json') {

        downloadTextFile(`Reporte_${type}_${shortId}.json`, JSON.stringify(data, null, 2), 'application/json');

        toast.success(`Descarga JSON lista.`);

      } else {

        if (type === 'NOVEDADES') {

          downloadTextFile(`Reporte_NOVEDADES_${shortId}.csv`, reporteNovedadesToCsv(data), 'text/csv;charset=utf-8');

        } else {

          downloadTextFile(`Comprobante_LIQUIDACION_${shortId}.csv`, comprobanteLiquidacionToCsv(data), 'text/csv;charset=utf-8');

        }

        toast.success(`Descarga CSV lista.`);

      }

    } catch {

      toast.error('Reporte no disponible para este estado.');

    }

  };



  if (!batch.uuidLote) return <div className="p-20 text-center italic text-gray-400">Consultando PostgreSQL...</div>;





  return (

    <div className="space-y-8">

      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">

        <div className="flex items-center gap-6 mb-6">

          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border-2 border-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1">

            <div className="flex items-center gap-4 mb-2">

              <h1 className="text-4xl font-bold">Detalle del Lote</h1>

              {batch.estado && <StatusBadge status={batch.estado} size="lg" />}

            </div>

            <p className="text-blue-200 text-lg">Gestión y seguimiento de operaciones</p>

          </div>

        </div>

        {/* Botones de descarga */}
        {batch.estado === 'CERRADO' && (

          <div className="flex flex-wrap gap-3">

            <div className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm p-2">

              <select

                value={novedadesFormat}

                onChange={(e) => setNovedadesFormat(e.target.value as 'csv' | 'json' | 'pdf')}

                className="px-3 py-2 text-sm font-semibold text-white bg-white/20 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors"

              >

                <option value="csv" className="text-gray-900">CSV</option>

                <option value="json" className="text-gray-900">JSON</option>

                <option value="pdf" className="text-gray-900">PDF</option>

              </select>

              <button

                type="button"

                onClick={() => handleDownloadReport('NOVEDADES', novedadesFormat)}

                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#C9A84C] to-[#d4b962] hover:from-[#d4b962] hover:to-[#C9A84C] rounded-lg shadow-lg hover:shadow-xl transition-all"

              >

                <Download className="w-4 h-4" /> Novedades

              </button>

            </div>

            <div className="flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm p-2">

              <select

                value={comprobanteFormat}

                onChange={(e) => setComprobanteFormat(e.target.value as 'csv' | 'json' | 'pdf')}

                className="px-3 py-2 text-sm font-semibold text-white bg-white/20 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors"

              >

                <option value="csv" className="text-gray-900">CSV</option>

                <option value="json" className="text-gray-900">JSON</option>

                <option value="pdf" className="text-gray-900">PDF</option>

              </select>

              <button

                type="button"

                onClick={() => handleDownloadReport('COMPROBANTE', comprobanteFormat)}

                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#C9A84C] to-[#d4b962] hover:from-[#d4b962] hover:to-[#C9A84C] rounded-lg shadow-lg hover:shadow-xl transition-all"

              >

                <Download className="w-4 h-4" /> Comprobante

              </button>

            </div>

          </div>

        )}

      </div>



      <BatchHeader batch={batch} />



      {batch.motivoRechazoGlobal && (

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-lg">

          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <div>

            <h4 className="text-base font-bold text-red-800 mb-1">Lote Rechazado</h4>

            <p className="text-sm text-red-700">{batch.motivoRechazoGlobal}</p>

          </div>

        </div>

      )}



      {batch.fechas && (

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">

          <h3 className="text-lg font-bold text-[#0D1B4B] mb-6">Trazabilidad del Lote</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {[

              { label: 'Recepción', value: batch.fechas.fechaRecepcion },

              { label: 'Inicio Validación', value: batch.fechas.fechaInicioValidacion },

              { label: 'Fin Validación', value: batch.fechas.fechaFinValidacion },

              { label: 'Inicio Proceso', value: batch.fechas.fechaInicioProceso },

              { label: 'Fin Proceso', value: batch.fechas.fechaFinProceso },

              { label: 'Cierre', value: batch.fechas.fechaCierre },

            ].map((f) => (

              <div key={f.label} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">

                <p className="text-xs font-semibold text-gray-500 mb-2">{f.label}</p>

                <p className="text-sm font-bold text-gray-900">

                  {f.value ? new Date(f.value).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : '—'}

                </p>

              </div>

            ))}

          </div>

        </div>

      )}



      <BatchActions

        estado={batch.estado}

        userRole={user?.role}

        isLoading={isActionLoading}

        successfulLinesCount={successfulLines || 0}

        onAnnul={() => setShowActionModal({ type: 'ANNUL' })}

      />



      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

        <div className="flex border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">

          <button 
            onClick={() => setActiveTab('lines')} 
            className={`px-8 py-4 text-sm font-semibold transition-all ${activeTab === 'lines' ? 'bg-white border-b-4 border-[#10b981] text-[#0D1B4B]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Detalle de Pagos
          </button>

          <button 
            onClick={() => setActiveTab('settlement')} 
            className={`px-8 py-4 text-sm font-semibold transition-all ${activeTab === 'settlement' ? 'bg-white border-b-4 border-[#10b981] text-[#0D1B4B]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Resumen de Comisiones
          </button>

          {batch.estado === 'CERRADO' && (

            <>

              <button 
                onClick={() => setActiveTab('novedades')} 
                className={`px-8 py-4 text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'novedades' ? 'bg-white border-b-4 border-[#10b981] text-[#0D1B4B]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="w-4 h-4"/> Novedades
              </button>

              <button 
                onClick={() => setActiveTab('comprobante')} 
                className={`px-8 py-4 text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'comprobante' ? 'bg-white border-b-4 border-[#10b981] text-[#0D1B4B]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <TrendingUp className="w-4 h-4"/> Comprobante
              </button>

            </>

          )}

        </div>



        <div className="p-6">

          {activeTab === 'lines' && <BatchLinesTable lines={lines} />}

          {activeTab === 'settlement' && (

            <SettlementTab

              liquidationResult={liquidationResult}

              settlement={settlement}

              successfulCount={successfulLines}

              feesCurrency={fees?.moneda}

            />

          )}

          {activeTab === 'novedades' && <NovedadesTab isLoading={isLoadingReports} data={novedades} />}

          {activeTab === 'comprobante' && <ComprobanteTab isLoading={isLoadingReports} data={comprobante} />}

        </div>

      </div>



      <ConfirmModal

        isOpen={showActionModal.type !== null}

        title="Confirmar Anulación"

        variant="danger"

        confirmText="Confirmar"

        message={

          <div className="space-y-4 text-gray-600">

            {showActionModal.type === 'ANNUL' && "Ingrese el motivo de anulación para el registro oficial de auditoría:"}

            {showActionModal.type === 'ANNUL' && (

              <textarea className="w-full p-3 border rounded-lg text-sm font-sans" rows={3} value={annulReason} onChange={(e) => setAnnulReason(e.target.value)} placeholder="Motivo de la anulación..." />

            )}

          </div>

        }

        onConfirm={handleAction}

        onCancel={() => setShowActionModal({ type: null })}

      />

    </div>

  );

}

