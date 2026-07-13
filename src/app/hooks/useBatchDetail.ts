import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import { BatchService } from '../services/batchService';
import { ConfigService } from '../services/configService';
import { usePolling } from './usePolling';
import { useFetchData } from './useFetchData';
import { LineStatus } from '../types';
import {
  EstadoLoteResponse,
  ConsultaLoteResponse,
  LineaPagoResponse,
  PaginaResponse,
  ValidacionLoteResponse,
  LiquidarLoteResponse,
  TarifaServicioResponse,
  ValidationErrorResponse,
  BatchSummaryResponse,
} from '../types/responses';

interface CommissionResult {
  rate: number;
  subtotal: number;
  iva: number;
  total: number;
}

interface NovedadesLine {
  sequenceNumber: number;
  beneficiaryName: string;
  destinationAccountNumber: string;
  amount: number;
  finalStatus: string;
  errorCode?: string | null;
  errorMessage?: string;
  errorSource?: string | null;
  noveltyType?: string | null;
  processedAt?: string;
}

interface NovedadesData {
  resumen?: {
    totalLineas: number;
    exitosas: number;
    rechazadas: number;
    fallidas: number;
  };
  lineas?: NovedadesLine[];
}

interface ComprobanteEmpresa {
  rucEmpresa: string;
  cuentaMatrizCargo: string;
}

interface ComprobanteResumenPagos {
  transaccionesExitosas: number;
  transaccionesRechazadas: number;
  montoTotalDispersado: number;
}

interface ComprobanteLiquidacionServicio {
  tarifaUnitariaAplicada: number;
  subtotalComision: number;
  ivaPorcentajeAplicado: number;
  montoIva: number;
  totalDebitado: number;
}

interface ComprobanteData {
  uuidLote: string;
  tipoReporte: string;
  empresa?: ComprobanteEmpresa;
  resumenPagos?: ComprobanteResumenPagos;
  liquidacionServicio?: ComprobanteLiquidacionServicio;
  fechaGeneracion?: string;
}

export interface BatchProgressState {
  expectedTotalLines: number;
  finalResultLines: number;
  observedLines: number;
  onUsCreditedLines: number;
  offUsIncludedLines: number;
  rejectedLines: number;
  failedLines: number;
  percent: number;
  status?: string;
  billingStatus?: string | null;
  completedAt?: string | null;
  generatedAt?: string | null;
  updatedAt?: string | null;
  isAvailable: boolean;
}

function buildProgress(summary: BatchSummaryResponse | null): BatchProgressState | null {
  if (!summary) return null;
  const expectedTotalLines = Number(summary.expectedTotalLines ?? summary.totalLines ?? 0);
  if (!Number.isFinite(expectedTotalLines) || expectedTotalLines <= 0) return null;

  const finalResultLines = Number(summary.finalResultLines ?? 0);
  const observedLines = Number(summary.observedLines ?? 0);
  const onUsCreditedLines = Number(summary.onUsCreditedLines ?? 0);
  const offUsIncludedLines = Number(summary.offUsIncludedLines ?? 0);
  const rejectedLines = Number(summary.rejectedLines ?? 0);
  const failedLines = Number(summary.failedLines ?? 0);
  const percent = Math.max(0, Math.min(100, Math.round((finalResultLines / expectedTotalLines) * 100)));

  return {
    expectedTotalLines,
    finalResultLines,
    observedLines,
    onUsCreditedLines,
    offUsIncludedLines,
    rejectedLines,
    failedLines,
    percent,
    status: summary.status,
    billingStatus: summary.billingStatus,
    completedAt: summary.completedAt,
    generatedAt: summary.generatedAt,
    updatedAt: summary.updatedAt,
    isAvailable: true,
  };
}

export function useBatchDetail(uuid: string | undefined) {
  const location = useLocation();
  const initialBatch = (location.state as { batch?: ConsultaLoteResponse })?.batch;

  const [batch, setBatch] = useState<Partial<EstadoLoteResponse & ConsultaLoteResponse>>(
    initialBatch || {}
  );
  const [fees, setFees] = useState<any>(null);
  const [liquidationResult, setLiquidationResult] = useState<LiquidarLoteResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorResponse[]>([]);
  const [novedades, setNovedades] = useState<NovedadesData | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [progress, setProgress] = useState<BatchProgressState | null>(null);

  const statusFetch = useFetchData<EstadoLoteResponse>();
  const listFetch = useFetchData<PaginaResponse<ConsultaLoteResponse>>();

  const fetchData = useCallback(async () => {
    if (!uuid) return;
    setValidationErrors([]);
    setLiquidationResult(null);

    try {
      const status = await BatchService.getBatchStatus(uuid);
      const listResponse = await BatchService.getBatches({ page: '0', size: '100' }).catch(() => null);

      const listItem =
        listResponse?.content?.find(
          (b: ConsultaLoteResponse) =>
            String(b.batchId).toLowerCase() === String(uuid).toLowerCase()
        ) ?? null;

      setBatch((prev) => ({
        ...prev,
        ...listItem,
        ...status,
        batchId: status.batchId || uuid,
      }));

      const summaryData = await BatchService.getBatchSummary(uuid).catch(() => null);
      const progressData = buildProgress(summaryData);
      if (progressData) {
        setProgress(progressData);
      } else if (['RECHAZADO', 'FALLIDO', 'ANULADO'].includes(status.status || '')) {
        setProgress(null);
      }

      if (status.status === 'RECHAZADO') {
        const validationData = await BatchService.getBatchValidationErrors(uuid).catch(() => null);
        setValidationErrors(Array.isArray(validationData?.errors) ? validationData.errors : []);
      }

      const feesData = await ConfigService.getPricingRules().catch(() => null);
      if (feesData) setFees(Array.isArray(feesData) ? feesData[0] : feesData);

      // Fetch novelty details for payment lines with final status
      const novedadesData = await BatchService.getBatchNovedadesDetails(uuid).catch(() => null);
      if (novedadesData && novedadesData.novelties) {
        setNovedades({
          lineas: novedadesData.novelties.map((n: any) => ({
            sequenceNumber: n.sequenceNumber,
            beneficiaryName: n.beneficiaryName,
            destinationAccountNumber: n.destinationAccountNumber,
            amount: n.amount,
            finalStatus: n.finalStatus,
            errorCode: n.errorCode,
            errorMessage: n.errorMessage,
            errorSource: n.errorSource,
            noveltyType: n.noveltyType,
            processedAt: n.processedAt,
          })),
        });
      }
    } catch {
    }
  }, [uuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isTransitional = [
    'RECIBIDO',
    'VALIDANDO',
    'VALIDADO',
    'ENCOLADO',
    'FONDEADO',
    'PROCESANDO',
    'PROCESANDO_LINEAS',
    'EN_OBSERVACION',
  ].includes(batch.status || '') || Boolean(progress && progress.percent < 100);
  usePolling(fetchData, isTransitional, 5000);

  const calculateCommission = useCallback(
    (successfulCount: number): CommissionResult => {
      if (!successfulCount || successfulCount <= 0) {
        return { rate: 0, subtotal: 0, iva: 0, total: 0 };
      }

      let rate = 0;
      if (fees?.rangos) {
        const matched = fees.rangos.find(
          (r: any) =>
            successfulCount >= r.rangoDesde &&
            (r.rangoHasta === null || successfulCount <= r.rangoHasta)
        );
        if (matched) rate = matched.tarifaUnitaria;
      } else {
        rate = 0.5;
        if (successfulCount > 10) rate = 0.4;
        if (successfulCount > 100) rate = 0.3;
        if (successfulCount > 500) rate = 0.2;
      }

      const subtotal = successfulCount * rate;
      const iva = subtotal * 0.15;
      return { rate, subtotal, iva, total: subtotal + iva };
    },
    [fees]
  );

  const projectedSettlement = calculateCommission(
    novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0
  );

  const settlement = liquidationResult
    ? {
        rate: liquidationResult.tarifaUnitariaAplicada || 0,
        subtotal: liquidationResult.subtotalComision || 0,
        iva: liquidationResult.montoIva || 0,
        total: liquidationResult.totalDebitado || 0,
      }
    : projectedSettlement;

  return {
    batch,
    novedades,
    fees,
    liquidationResult,
    setLiquidationResult,
    validationErrors,
    setValidationErrors,
    progress,
    comprobante,
    isLoadingReports,
    settlement,
    successfulLines: novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0,
    fetchData,
    calculateCommission,
  };
}
