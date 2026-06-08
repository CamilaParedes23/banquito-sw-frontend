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

    <div className="space-y-6">

      <div className="flex items-center gap-4">

        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#0D1B4B]"><ArrowLeft /></button>

        <div className="flex-1">

          <div className="flex items-center gap-4">

            <h1 className="text-3xl font-bold text-[#0D1B4B]">Gestión Operativa</h1>

            {batch.estado && <StatusBadge status={batch.estado} size="lg" />}

          </div>

        </div>

        <div className="flex flex-wrap gap-3 justify-end">

          {batch.estado === 'CERRADO' && (

            <>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">

                <select

                  value={novedadesFormat}

                  onChange={(e) => setNovedadesFormat(e.target.value as 'csv' | 'json' | 'pdf')}

                  className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D1B4B] cursor-pointer hover:bg-gray-100 transition-colors"

                >

                  <option value="csv">CSV</option>

                  <option value="json">JSON</option>

                  <option value="pdf">PDF</option>

                </select>

                <button

                  type="button"

                  onClick={() => handleDownloadReport('NOVEDADES', novedadesFormat)}

                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0D1B4B] rounded-md shadow-md hover:bg-[#1e3a8a] transition-all"

                >

                  <Download className="w-4 h-4" /> Novedades

                </button>

              </div>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">

                <select

                  value={comprobanteFormat}

                  onChange={(e) => setComprobanteFormat(e.target.value as 'csv' | 'json' | 'pdf')}

                  className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D1B4B] cursor-pointer hover:bg-gray-100 transition-colors"

                >

                  <option value="csv">CSV</option>

                  <option value="json">JSON</option>

                  <option value="pdf">PDF</option>

                </select>

                <button

                  type="button"

                  onClick={() => handleDownloadReport('COMPROBANTE', comprobanteFormat)}

                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0D1B4B] rounded-md shadow-md hover:bg-[#1e3a8a] transition-all"

                >

                  <Download className="w-4 h-4" /> Comprobante

                </button>

              </div>

            </>

          )}

        </div>

      </div>



      <BatchHeader batch={batch} />



      {batch.motivoRechazoGlobal && (

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">

          <div className="w-5 h-5 text-red-600 mt-0.5 shrink-0">!</div>

          <div>

            <h4 className="text-sm font-bold text-red-800">Lote Rechazado</h4>

            <p className="text-sm text-red-700 mt-1">{batch.motivoRechazoGlobal}</p>

          </div>

        </div>

      )}



      {batch.fechas && (

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trazabilidad del Lote</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

            {[

              { label: 'Recepción', value: batch.fechas.fechaRecepcion },

              { label: 'Inicio Validación', value: batch.fechas.fechaInicioValidacion },

              { label: 'Fin Validación', value: batch.fechas.fechaFinValidacion },

              { label: 'Inicio Proceso', value: batch.fechas.fechaInicioProceso },

              { label: 'Fin Proceso', value: batch.fechas.fechaFinProceso },

              { label: 'Cierre', value: batch.fechas.fechaCierre },

            ].map((f) => (

              <div key={f.label} className="bg-gray-50 rounded-lg p-3">

                <p className="text-[10px] font-bold text-gray-400 uppercase">{f.label}</p>

                <p className="text-xs font-bold text-gray-900 mt-1">

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



      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        <div className="flex border-b border-gray-100 bg-gray-50">

          <button onClick={() => setActiveTab('lines')} className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'lines' ? 'bg-white border-t-2 border-[#C9A84C] text-[#0D1B4B]' : 'text-gray-400'}`}>Detalle de Pagos</button>

          <button onClick={() => setActiveTab('settlement')} className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'settlement' ? 'bg-white border-t-2 border-[#C9A84C] text-[#0D1B4B]' : 'text-gray-400'}`}>Resumen de Comisiones</button>

          {batch.estado === 'CERRADO' && (

            <>

              <button onClick={() => setActiveTab('novedades')} className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'novedades' ? 'bg-white border-t-2 border-[#C9A84C] text-[#0D1B4B]' : 'text-gray-400'}`}><FileText className="w-4 h-4"/> Novedades</button>

              <button onClick={() => setActiveTab('comprobante')} className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'comprobante' ? 'bg-white border-t-2 border-[#C9A84C] text-[#0D1B4B]' : 'text-gray-400'}`}><TrendingUp className="w-4 h-4"/> Comprobante</button>

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

