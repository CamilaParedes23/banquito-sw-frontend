import { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router';

import { ArrowLeft, AlertTriangle, FileText, AlertCircle, BarChart3, Activity, Clock, RefreshCw } from 'lucide-react';

import { StatusBadge } from '../../components/shared/StatusBadge';
import { Progress } from '../../components/ui/progress';

import { useBatchDetail } from '../../hooks/useBatchDetail';

import { BatchHeader } from './BatchDetail/BatchHeader';

import { BatchLinesTable } from './BatchDetail/BatchLinesTable';

import { ComprobanteTab } from './BatchDetail/ComprobanteTab';

import { NovedadesTab } from './BatchDetail/NovedadesTab';

import { SettlementTab } from './BatchDetail/SettlementTab';

import { BatchService } from '../../services/batchService';
import {
  getDisplayErrorCode,
  getFriendlyFieldName,
  mapBatchRejectionMessage,
  mapValidationErrorMessage,
  UNKNOWN_ERROR_MESSAGE,
} from '../../utils/batchErrorMessages';

function parseDateMs(value?: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDuration(ms: number): string {
  const safeSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}



export function BatchDetail() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { batch, novedades, validationErrors, progress, fetchData } = useBatchDetail(id);

  const [activeTab, setActiveTab] = useState<'lines' | 'novedades' | 'comprobante' | 'settlement'>('lines');
  const [clockTick, setClockTick] = useState(Date.now());
  const [isRefreshingDetail, setIsRefreshingDetail] = useState(false);

  const [comprobanteData, setComprobanteData] = useState<any>(null);

  const [comprobanteLoading, setComprobanteLoading] = useState(false);

  const [settlementData, setSettlementData] = useState<any>(null);

  const [settlementLoading, setSettlementLoading] = useState(false);



  const fetchComprobante = async (force = false) => {
    if ((!force && comprobanteData) || !id) return;
    setComprobanteLoading(true);
    try {
      const data = await BatchService.getBatchComprobante(id);
      // Mapear respuesta del backend al formato del frontend
      const mappedData = {
        uuidLote: data.batchId,
        tipoReporte: 'COMPROBANTE_CORPORATIVO',
        empresa: {
          rucEmpresa: data.companyRuc,
          cuentaMatrizCargo: data.sourceAccountNumber || 'N/A',
        },
        resumenPagos: {
          transaccionesExitosas: data.successfulOnUsLines || data.billableLines || 0,
          transaccionesRechazadas: (data.totalRecords || data.totalReceivedLines || 0) - (data.successfulOnUsLines || data.billableLines || 0),
          montoTotalDispersado: data.totalProcessedAmount || data.totalControlAmount || 0,
        },
        liquidacionServicio: {
          tarifaUnitariaAplicada: data.unitFee || 0,
          subtotalComision: data.commissionSubtotal || 0,
          ivaPorcentajeAplicado: 0.15,
          montoIva: data.taxAmount || 0,
          totalDebitado: data.totalChargedAmount || 0,
        },
        fechaGeneracion: data.generatedAt,
      };
      setComprobanteData(mappedData);
    } catch (error: any) {
      console.error('Error al cargar comprobante:', error);
      if (error.message?.includes('404') || error.message?.includes('No existe')) {
        setComprobanteData({ error: 'El comprobante no está disponible. El lote debe estar completamente procesado y facturado.' });
      } else {
        setComprobanteData({ error: 'Error al cargar el comprobante.' });
      }
    } finally {
      setComprobanteLoading(false);
    }
  };



  const fetchSettlement = async (force = false) => {
    if ((!force && settlementData && !(settlementData as any)?.error) || !id) return;
    setSettlementLoading(true);
    try {
      const [commissionResult, clearingResult] = await Promise.allSettled([
        BatchService.getBatchCommission(id),
        BatchService.getBatchClearingFile(id)
      ]);

      // Si la comisión falla, mostrar error
      if (commissionResult.status === 'rejected') {
        const errorMsg = commissionResult.reason?.message || '';
        if (errorMsg.includes('404') || errorMsg.includes('No existe')) {
          setSettlementData({ error: 'La liquidación no está disponible. El lote debe estar completamente procesado y facturado.' });
        } else {
          setSettlementData({ error: 'Error al cargar la liquidación.' });
        }
        return;
      }

      const commission = commissionResult.value;
      const clearing = clearingResult.status === 'fulfilled' ? clearingResult.value : null;

      // Mapear respuesta del backend al formato del frontend
      const mappedSettlement = {
        rate: commission?.unitFee || 0,
        subtotal: commission?.commissionSubtotal || 0,
        iva: commission?.taxAmount || 0,
        total: commission?.totalCommission || commission?.totalChargedAmount || 0,
      };
      setSettlementData({ commission: mappedSettlement, clearing });
    } catch (error: any) {
      console.error('Error al cargar liquidación:', error);
      setSettlementData({ error: 'Error al cargar la liquidación.' });
    } finally {
      setSettlementLoading(false);
    }
  };



  const handleTabChange = (tab: 'lines' | 'novedades' | 'comprobante' | 'settlement') => {
    setActiveTab(tab);
    if (tab === 'comprobante') fetchComprobante();
    if (tab === 'settlement') fetchSettlement();
  };

  const shouldShowProgress =
    Boolean(progress?.isAvailable) &&
    !['RECHAZADO', 'FALLIDO', 'ANULADO'].includes(batch.status || '');

  useEffect(() => {
    if (!shouldShowProgress || !progress || progress.percent >= 100) return;
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [shouldShowProgress, progress?.percent]);

  const processingStartedAt = parseDateMs(batch.receivedAt);
  const processingFinishedAt = progress?.percent && progress.percent >= 100
    ? parseDateMs(progress.completedAt) ?? parseDateMs(progress.generatedAt) ?? parseDateMs(progress.updatedAt)
    : null;
  const processingElapsedMs = processingStartedAt
    ? (processingFinishedAt ?? clockTick) - processingStartedAt
    : null;
  const processingTimeLabel = processingElapsedMs === null ? '--' : formatDuration(processingElapsedMs);

  const handleRefreshDetail = async () => {
    setIsRefreshingDetail(true);
    setComprobanteData(null);
    setSettlementData(null);
    try {
      await fetchData();
      if (activeTab === 'comprobante') {
        await fetchComprobante(true);
      }
      if (activeTab === 'settlement') {
        await fetchSettlement(true);
      }
      setClockTick(Date.now());
    } finally {
      setIsRefreshingDetail(false);
    }
  };



  if (!batch.batchId) return <div className="p-20 text-center italic text-gray-400">Consultando PostgreSQL...</div>;

  const batchRejectionMessage = batch.message ? mapBatchRejectionMessage(batch.message) : null;
  const shouldShowBatchRejectionMessage =
    Boolean(batchRejectionMessage) &&
    (batchRejectionMessage !== UNKNOWN_ERROR_MESSAGE || validationErrors.length === 0);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border-2 border-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold">Detalle del Lote</h1>
              {batch.status && <StatusBadge status={batch.status} size="lg" />}
            </div>
            <p className="text-blue-200 text-lg">Gestión y seguimiento de operaciones</p>
          </div>
        </div>
      </div>

      <BatchHeader batch={batch} />

      {shouldShowProgress && progress && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0D1B4B]">Progreso de procesamiento</h3>
                  <p className="text-sm text-gray-500">
                    {progress.finalResultLines} de {progress.expectedTotalLines} líneas procesadas
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-emerald-700">{progress.percent}%</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {progress.percent >= 100 ? 'Procesamiento completo' : 'En ejecución'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">
                    {progress.percent >= 100 ? 'Tiempo total de procesamiento' : 'Tiempo transcurrido'}
                  </p>
                  <p className="text-xl font-bold text-emerald-900">{processingTimeLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefreshDetail}
                disabled={isRefreshingDetail}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingDetail ? 'animate-spin' : ''}`} />
                {isRefreshingDetail ? 'Actualizando...' : 'Recargar detalle'}
              </button>
            </div>

            <Progress
              value={progress.percent}
              className="h-3 bg-emerald-100 [&_[data-slot=progress-indicator]]:bg-emerald-600"
            />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Observadas', value: progress.observedLines },
                { label: 'Acreditadas', value: progress.onUsCreditedLines },
                { label: 'Off-Us', value: progress.offUsIncludedLines },
                { label: 'Rechazadas', value: progress.rejectedLines },
                { label: 'Fallidas', value: progress.failedLines },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(batch.message || validationErrors.length > 0) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-red-800 mb-1">Lote Rechazado</h4>
            {shouldShowBatchRejectionMessage && <p className="text-sm text-red-700">{batchRejectionMessage}</p>}
            {validationErrors.length > 0 && (
              <div className="mt-4 space-y-2">
                {validationErrors.map((error, index) => (
                  <div
                    key={`${error.code}-${error.field || index}`}
                    className="rounded-lg border border-red-200 bg-white/70 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-800">
                        {getDisplayErrorCode(error.code, error.message)}
                      </span>
                      {error.field && (
                        <span className="text-xs font-semibold text-red-700">{getFriendlyFieldName(error.field)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-red-700">{mapValidationErrorMessage(error.code, error.message)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {batch.receivedAt && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-[#0D1B4B] mb-6">Trazabilidad del Lote</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Recepción', value: batch.receivedAt },
              { label: 'Validación', value: batch.validatedAt },
              { label: 'Fondeo', value: batch.fundedAt },
              { label: 'Contabilidad', value: batch.accountingDate },
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

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex gap-1 p-2">
            {[
              { id: 'lines' as const, label: 'Pagos', icon: BarChart3 },
              { id: 'novedades' as const, label: 'Novedades', icon: AlertCircle },
              { id: 'comprobante' as const, label: 'Comprobante', icon: FileText },
              { id: 'settlement' as const, label: 'Liquidación', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0D1B4B] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'lines' && (
            <div>
              <h3 className="text-lg font-bold text-[#0D1B4B] mb-4">Detalle de Pagos</h3>
              <BatchLinesTable lines={novedades?.lineas || []} />
            </div>
          )}

          {activeTab === 'novedades' && (
            <NovedadesTab 
              isLoading={false}
              batchId={id}
              data={{
                resumen: {
                  totalLineas: novedades?.lineas?.length || 0,
                  exitosas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0,
                  rechazadas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'RECHAZADA').length || 0,
                  fallidas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'FALLIDA').length || 0,
                },
                lineas: novedades?.lineas?.map((l: any) => ({
                  secuencial: l.sequenceNumber,
                  nombreBeneficiario: l.beneficiaryName,
                  cuentaDestino: l.destinationAccountNumber,
                  monto: l.amount,
                  estado: l.finalStatus,
                  codigoError: l.errorCode,
                  mensajeError: l.errorMessage,
                  tipoNovedad: l.noveltyType,
                })) || []
              }} 
            />
          )}

          {activeTab === 'comprobante' && (
            <ComprobanteTab isLoading={comprobanteLoading} data={comprobanteData} />
          )}

          {activeTab === 'settlement' && (
              <SettlementTab 
                liquidationResult={null}
                settlement={settlementData?.commission || {
                  rate: 0,
                  subtotal: 0,
                iva: 0,
                total: 0,
                }}
                successfulCount={novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0}
                batchId={id}
                batchStatus={batch.status}
                clearing={settlementData?.clearing || null}
                error={(settlementData as any)?.error}
              />
          )}
        </div>
      </div>
    </div>
  );
}
