import { BatchStatus } from './index';

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
  uuidLote: string;
  estado: BatchStatus;
  motivoRechazoGlobal?: string;
  resumenLineas: ResumenLineasResponse;
  fechas: FechasLoteResponse;
  accionesDisponibles: string[];
}

export interface ConsultaLoteResponse {
  uuidLote: string;
  rucEmpresa: string;
  tipoServicio: string;
  nombreArchivo: string;
  canalIngreso: string;
  estado: BatchStatus;
  totalRegistrosDeclarado: number;
  montoTotalDeclarado: number;
  fechaRecepcion: string;
  cuentaMatrizCargo?: string;
  totalRegistrosValidados?: number;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
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

export interface LiquidarLoteResponse {
  uuidLote: string;
  estado: BatchStatus;
  tarifaUnitariaAplicada: number;
  subtotalComision: number;
  montoIva: number;
  totalDebitado: number;
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
