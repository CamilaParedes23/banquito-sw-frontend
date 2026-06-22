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
  errorMessage?: string;
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

export function useBatchDetail(uuid: string | undefined) {
  const location = useLocation();
  const initialBatch = (location.state as { batch?: ConsultaLoteResponse })?.batch;

  const [batch, setBatch] = useState<Partial<EstadoLoteResponse & ConsultaLoteResponse>>(
    initialBatch || {}
  );
  const [fees, setFees] = useState<any>(null);
  const [liquidationResult, setLiquidationResult] = useState<LiquidarLoteResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ codigo: string; mensaje: string }>>([]);
  const [novedades, setNovedades] = useState<NovedadesData | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const statusFetch = useFetchData<EstadoLoteResponse>();
  const listFetch = useFetchData<PaginaResponse<ConsultaLoteResponse>>();

  const fetchData = useCallback(async () => {
    if (!uuid) return;
    setValidationErrors([]);
    setLiquidationResult(null);

    try {
      const [status, listResponse] = await Promise.all([
        BatchService.getBatchStatus(uuid),
        BatchService.getBatches({ page: '0', size: '100' }),
      ]);

      const listItem =
        listResponse.content?.find(
          (b: ConsultaLoteResponse) =>
            String(b.batchId).toLowerCase() === String(uuid).toLowerCase()
        ) ?? null;

      setBatch((prev) => ({
        ...prev,
        ...listItem,
        ...status,
        batchId: status.batchId || uuid,
      }));

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
            errorMessage: n.errorMessage,
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

  const isTransitional = ['VALIDANDO', 'ENCOLADO', 'PROCESANDO'].includes(batch.status || '');
  usePolling(fetchData, isTransitional);

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
    comprobante,
    isLoadingReports,
    settlement,
    successfulLines: novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0,
    fetchData,
    calculateCommission,
  };
}
