import { BatchStatus, Channel } from './index';

export interface FechasLoteResponse {
  fechaRecepcion?: string;
  fechaInicioValidacion?: string;
  fechaFinValidacion?: string;
  fechaInicioProceso?: string;
  fechaFinProceso?: string;
  fechaCierre?: string;
}

export interface ResumenLineasResponse {
  totalLineas: number;
  pendientes: number;
  validadas: number;
  rechazadas: number;
}

export interface EstadoLoteResponse {
  batchId: string;
  companyRuc: string;
  fileName: string;
  receivedAt: string;
  status: BatchStatus;
  totalRecords: number;
  controlAmount: number;
  serviceType?: string;
  sourceAccountNumber?: string;
  validatedAt?: string;
  fundedAt?: string;
  accountingDate?: string;
  coreFundingId?: string;
  coreTransactionId?: string;
  message?: string;
}

export interface ConsultaLoteResponse {
  batchId: string;
  companyRuc: string;
  fileName: string;
  receivedAt: string;
  status: BatchStatus;
  totalRecords: number;
  controlAmount: number;
  channel?: Channel;
}

export interface PaginaResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface LineaPagoResponse {
  uuidOperacionSwitch: string;
  secuencial: number;
  nombreBeneficiario: string;
  identificacionBeneficiario: string;
  cuentaDestino: string;
  monto: number;
  conceptoReferencia?: string;
  estado: string;
  mensajeError?: string;
}

export interface ValidacionLoteResponse {
  uuidLote: string;
  estado: BatchStatus;
  errores: Array<{ codigo: string; mensaje: string }>;
}

export interface ValidationErrorResponse {
  code: string;
  field?: string;
  message: string;
}

export interface BatchValidationErrorsResponse {
  batchId: string;
  errors: ValidationErrorResponse[];
}

export interface BatchSummaryResponse {
  batchId: string;
  status?: string;
  expectedTotalLines?: number;
  totalLines?: number;
  observedLines?: number;
  finalResultLines?: number;
  onUsCreditedLines?: number;
  offUsIncludedLines?: number;
  rejectedLines?: number;
  failedLines?: number;
  billableLines?: number;
  billingStatus?: string | null;
  commissionSubtotal?: number | null;
  totalChargedAmount?: number | null;
  completedAt?: string | null;
  generatedAt?: string | null;
  updatedAt?: string | null;
}

export interface LiquidarLoteResponse {
  uuidLote: string;
  estado: BatchStatus;
  tarifaUnitariaAplicada: number;
  subtotalComision: number;
  montoIva: number;
  totalDebitado: number;
}

export interface GeneratedFileResponse {
  batchId: string;
  documentId?: string;
  status?: string;
  fileName?: string;
  filePath?: string;
  contentType?: string;
  content?: string;
  generatedAt?: string;
  totalLines?: number;
}

export interface HorarioCorteResponse {
  horaCorteProceso: string;
  horaInicioLotesEncolados: string;
  ventanaDuplicidadDias: number;
  zonaHoraria: string;
  mensaje?: string;
}

export interface TarifaRangoResponse {
  rangoDesde: number;
  rangoHasta: number | null;
  tarifaUnitaria: number;
}

export interface TarifaServicioResponse {
  tipoServicio: string;
  moneda: string;
  vigenteDesde?: string;
  rangos: TarifaRangoResponse[];
}

export interface TipoServicioResponse {
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface ErrorGlobalResponse {
  codigo: string;
  mensaje: string;
}
