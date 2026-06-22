import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FilterX, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { BatchService } from '../../services/batchService';
import { ConsultaLoteResponse, GeneratedFileResponse, PaginaResponse } from '../../types/responses';
import { MAX_PAGE_SIZE } from '../../constants';

type ConsolidatedClearingRow = {
  batchId: string;
  sourceFileName: string;
  originalLine: string;
  columns: string[];
  amount?: number;
};

type BatchClearingResult = {
  batch: ConsultaLoteResponse;
  clearing: GeneratedFileResponse | null;
  rows: ConsolidatedClearingRow[];
  totalAmount?: number;
  omittedReason?: string;
};

const CONSOLIDATABLE_STATUSES = new Set(['CERRADO', 'PROCESADO_TOTAL', 'PROCESADO_PARCIAL']);

function isExpectedClearingMiss(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('404')
    || message.includes('No existe')
    || message.includes('no existe')
    || message.includes('archivo de compensacion')
    || message.includes('archivo de compensación');
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function parseClearingRows(clearing: GeneratedFileResponse, batchId: string): ConsolidatedClearingRow[] {
  const content = clearing.content || '';
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const amountIndex = headers.indexOf('amount');

  return lines.slice(1).map((line) => {
    const columns = splitCsvLine(line);
    const amountValue = amountIndex >= 0 ? Number(columns[amountIndex]) : NaN;

    return {
      batchId,
      sourceFileName: clearing.fileName || `clearing_${batchId}.csv`,
      originalLine: line,
      columns,
      amount: Number.isFinite(amountValue) ? amountValue : undefined,
    };
  });
}

function buildConsolidatedClearingCsv(rows: ConsolidatedClearingRow[]) {
  const header = ['BATCH_ID', 'ARCHIVO_ORIGEN', 'CONTENIDO_ORIGINAL'];
  const body = rows.map((row) => [
    row.batchId,
    row.sourceFileName,
    row.originalLine,
  ].map(csvCell).join(','));

  return [header.join(','), ...body].join('\n');
}

function downloadCsv(content: string) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const fileName = `consolidado_off_us_${stamp}.csv`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatAmount(value?: number) {
  if (value == null || Number.isNaN(value)) return 'No disponible';
  return `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string) {
  if (!value) return 'No disponible';
  return new Date(value).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

export function ClearingConsolidated() {
  const { user } = useAuth();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [statusFilter, setStatusFilter] = useState('CERRADO');
  const [onlyWithClearing, setOnlyWithClearing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [results, setResults] = useState<BatchClearingResult[]>([]);
  const [realError, setRealError] = useState('');

  const visibleResults = useMemo(() => (
    onlyWithClearing ? results.filter((result) => result.clearing) : results
  ), [onlyWithClearing, results]);

  const includedResults = results.filter((result) => result.clearing && result.rows.length > 0);
  const omittedResults = results.filter((result) => !result.clearing);
  const consolidatedRows = includedResults.flatMap((result) => result.rows);
  const totalAmount = consolidatedRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const consolidatedCsv = buildConsolidatedClearingCsv(consolidatedRows);
  const previewRows = consolidatedRows.slice(0, 12);

  const generateConsolidated = async () => {
    setIsLoading(true);
    setHasGenerated(true);
    setRealError('');
    setResults([]);

    try {
      const params: Record<string, string> = {
        page: '0',
        size: String(MAX_PAGE_SIZE),
      };

      if (user?.role === 'EMPRESA' && user.companyRuc) params.companyRuc = user.companyRuc;
      if (statusFilter !== 'ALL') params.estado = statusFilter;
      if (fechaDesde) params.fechaDesde = `${fechaDesde}T00:00:00-05:00`;
      if (fechaHasta) params.fechaHasta = `${fechaHasta}T23:59:59-05:00`;

      const page = await BatchService.getBatches(params) as PaginaResponse<ConsultaLoteResponse>;
      const batches = (page.content || [])
        .filter((batch) => statusFilter === 'ALL' || batch.status === statusFilter)
        .filter((batch) => {
          if (!fechaDesde && !fechaHasta) return true;
          const received = batch.receivedAt ? new Date(batch.receivedAt).getTime() : 0;
          const from = fechaDesde ? new Date(`${fechaDesde}T00:00:00-05:00`).getTime() : Number.NEGATIVE_INFINITY;
          const to = fechaHasta ? new Date(`${fechaHasta}T23:59:59-05:00`).getTime() : Number.POSITIVE_INFINITY;
          return received >= from && received <= to;
        })
        .filter((batch) => statusFilter !== 'ALL' || CONSOLIDATABLE_STATUSES.has(batch.status));

      if (batches.length === 0) {
        setResults([]);
        return;
      }

      const checks = await Promise.all(batches.map(async (batch) => {
        try {
          const clearing = await BatchService.getBatchClearingFile(batch.batchId) as GeneratedFileResponse;
          const rows = parseClearingRows(clearing, batch.batchId);
          const amount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

          return {
            batch,
            clearing,
            rows,
            totalAmount: rows.some((row) => row.amount != null) ? amount : undefined,
          };
        } catch (error) {
          if (isExpectedClearingMiss(error)) {
            return {
              batch,
              clearing: null,
              rows: [],
              omittedReason: 'No aplica: el lote no tiene lineas Off-Us o no genero archivo de compensacion.',
            };
          }

          throw error;
        }
      }));

      setResults(checks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error real de API al generar el consolidado.';
      setRealError(message);
      toast.error('No se pudo generar el consolidado.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setStatusFilter('CERRADO');
    setOnlyWithClearing(true);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Consolidado Off-Us</h1>
            <p className="max-w-3xl text-lg text-blue-200">
              Este consolidado se construye desde los archivos Off-Us generados por lote. No representa transmision externa ni confirmacion de terceros.
            </p>
          </div>
          <button
            type="button"
            onClick={generateConsolidated}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Generar consolidado
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-[#0D1B4B]">Filtros</h2>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Fecha desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#0D1B4B] focus:ring-2 focus:ring-[#0D1B4B]/10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Fecha hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#0D1B4B] focus:ring-2 focus:ring-[#0D1B4B]/10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Estado del lote</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#0D1B4B] focus:ring-2 focus:ring-[#0D1B4B]/10"
            >
              <option value="CERRADO">CERRADO</option>
              <option value="PROCESADO_TOTAL">PROCESADO_TOTAL</option>
              <option value="PROCESADO_PARCIAL">PROCESADO_PARCIAL</option>
              <option value="ALL">Todos los consolidables</option>
            </select>
          </label>

          <label className="flex items-end gap-3 rounded-lg border border-gray-200 px-3 py-2">
            <input
              type="checkbox"
              checked={onlyWithClearing}
              onChange={(event) => setOnlyWithClearing(event.target.checked)}
              className="mb-1 h-4 w-4 accent-[#0D1B4B]"
            />
            <span className="text-sm font-semibold text-gray-700">Solo lotes con archivo Off-Us</span>
          </label>
        </div>
      </section>

      {realError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {realError}
        </div>
      )}

      {hasGenerated && !isLoading && results.length === 0 && !realError && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-lg">
          No se encontraron lotes disponibles para consolidar.
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16 shadow-lg">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-[#0D1B4B] opacity-30" />
          <p className="text-sm font-semibold text-gray-500">Consultando archivos Off-Us...</p>
        </div>
      )}

      {hasGenerated && !isLoading && results.length > 0 && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <p className="text-xs font-bold uppercase text-gray-500">Lotes consultados</p>
              <p className="mt-2 text-3xl font-black text-[#0D1B4B]">{results.length}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <p className="text-xs font-bold uppercase text-gray-500">Archivos incluidos</p>
              <p className="mt-2 text-3xl font-black text-[#0D1B4B]">{includedResults.length}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <p className="text-xs font-bold uppercase text-gray-500">Lineas Off-Us</p>
              <p className="mt-2 text-3xl font-black text-[#0D1B4B]">{consolidatedRows.length}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
              <p className="text-xs font-bold uppercase text-gray-500">Monto inferido</p>
              <p className="mt-2 text-3xl font-black text-[#0D1B4B]">{formatAmount(totalAmount)}</p>
            </div>
          </section>

          {omittedResults.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
              Algunos lotes no tienen archivo Off-Us; fueron omitidos del CSV consolidado.
            </div>
          )}

          {includedResults.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-lg">
              No se encontraron archivos Off-Us para consolidar.
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0D1B4B]">Archivos incluidos</h2>
                    <p className="text-sm text-gray-500">
                      Consolidado generado desde {includedResults.length} lotes y {consolidatedRows.length} lineas Off-Us.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCsv(consolidatedCsv)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D1B4B] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#142761]"
                  >
                    <Download className="h-4 w-4" />
                    Descargar consolidado CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Batch ID</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Archivo origen</th>
                        <th className="px-4 py-3">Lineas Off-Us</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleResults.map((result) => (
                        <tr key={result.batch.batchId}>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">{result.batch.batchId}</td>
                          <td className="px-4 py-3"><StatusBadge status={result.batch.status} /></td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                            {result.clearing?.fileName || result.omittedReason || 'No aplica'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{result.rows.length}</td>
                          <td className="px-4 py-3 text-gray-700">{formatAmount(result.totalAmount)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(result.batch.receivedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                <div className="border-b border-gray-100 p-5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-[#0D1B4B]">
                    <FileSpreadsheet className="h-5 w-5" />
                    Preview del CSV consolidado
                  </h2>
                </div>
                <div className="overflow-x-auto p-5">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">BATCH_ID</th>
                        <th className="px-3 py-2">ARCHIVO_ORIGEN</th>
                        <th className="px-3 py-2">CONTENIDO_ORIGINAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((row, index) => (
                        <tr key={`${row.batchId}-${index}`}>
                          <td className="whitespace-nowrap px-3 py-2 font-mono">{row.batchId}</td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold">{row.sourceFileName}</td>
                          <td className="whitespace-nowrap px-3 py-2">{row.originalLine}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
