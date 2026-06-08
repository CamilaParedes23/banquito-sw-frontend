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
  secuencial: number;
  nombreBeneficiario: string;
  cuentaDestino: string;
  monto: number;
  estado: LineStatus;
  mensajeError?: string;
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
  const [lines, setLines] = useState<LineaPagoResponse[]>([]);
  const [fees, setFees] = useState<TarifaServicioResponse | null>(null);
  const [liquidationResult, setLiquidationResult] = useState<LiquidarLoteResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ codigo: string; mensaje: string }>>([]);
  const [novedades, setNovedades] = useState<NovedadesData | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const statusFetch = useFetchData<EstadoLoteResponse>();
  const listFetch = useFetchData<PaginaResponse<ConsultaLoteResponse>>();
  const linesFetch = useFetchData<PaginaResponse<LineaPagoResponse>>();

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
        listResponse.contenido?.find(
          (b: ConsultaLoteResponse) =>
            String(b.uuidLote).toLowerCase() === String(uuid).toLowerCase()
        ) ?? null;

      setBatch((prev) => ({
        ...prev,
        ...listItem,
        uuidLote: status.uuidLote,
        estado: status.estado,
        motivoRechazoGlobal:
          status.motivoRechazoGlobal ?? prev.motivoRechazoGlobal,
        resumenLineas: status.resumenLineas,
        fechas: status.fechas,
        accionesDisponibles: status.accionesDisponibles,
      }));

      const feesData = await ConfigService.getPricingRules().catch(() => null);
      if (feesData) setFees(Array.isArray(feesData) ? feesData[0] : feesData);

      const linesData = await BatchService.getBatchLines(uuid, { size: '100' });
      setLines(linesData.contenido || []);
    } catch {
    }
  }, [uuid]);

  const fetchReports = useCallback(async () => {
    if (!uuid || batch.estado !== 'CERRADO') return;
    setIsLoadingReports(true);
    try {
      const [nov, comp] = await Promise.all([
        BatchService.getBatchNovedades(uuid),
        BatchService.getBatchComprobante(uuid),
      ]);
      setNovedades(nov);
      setComprobante(comp);
    } catch {
    } finally {
      setIsLoadingReports(false);
    }
  }, [uuid, batch.estado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isTransitional = ['VALIDANDO', 'ENCOLADO', 'PROCESANDO'].includes(batch.estado || '');
  usePolling(fetchData, isTransitional);

  useEffect(() => {
    if (batch.estado === 'CERRADO') fetchReports();
  }, [fetchReports]);

  const calculateCommission = useCallback(
    (successfulCount: number): CommissionResult => {
      if (!successfulCount || successfulCount <= 0) {
        return { rate: 0, subtotal: 0, iva: 0, total: 0 };
      }

      let rate = 0;
      if (fees?.rangos) {
        const matched = fees.rangos.find(
          (r) =>
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

  const successfulLines = lines.filter((l) => l.estado === 'EXITOSA').length;
  const projectedSettlement = calculateCommission(
    (batch as ConsultaLoteResponse).totalRegistrosValidados || successfulLines
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
    lines,
    fees,
    liquidationResult,
    setLiquidationResult,
    validationErrors,
    setValidationErrors,
    novedades,
    comprobante,
    isLoadingReports,
    settlement,
    successfulLines,
    fetchData,
    calculateCommission,
  };
}
