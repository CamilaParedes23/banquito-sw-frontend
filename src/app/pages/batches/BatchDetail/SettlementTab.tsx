import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Receipt } from 'lucide-react';

import { LiquidarLoteResponse, GeneratedFileResponse } from '../../../types/responses';

interface SettlementTabProps {
  liquidationResult: LiquidarLoteResponse | null;
  settlement: {
    rate: number;
    subtotal: number;
    iva: number;
    total: number;
  };
  successfulCount: number;
  batchId?: string;
  batchStatus?: string;
  clearing?: GeneratedFileResponse | null;
  feesCurrency?: string;
  error?: string;
}

interface CsvPreview {
  headers: string[];
  rows: string[][];
}

const REJECTED_STATUSES = new Set(['RECHAZADO', 'RECHAZADA', 'FAILED', 'FALLIDO', 'FALLIDA']);

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

function parseCsvPreview(content?: string, maxRows = 8): CsvPreview | null {
  if (!content?.trim()) return null;

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1, maxRows + 1).map(splitCsvLine);
  return { headers, rows };
}

function downloadClearingCsv(clearing: GeneratedFileResponse, batchId?: string) {
  const fileName = clearing.fileName || `clearing_${batchId || 'lote'}.csv`;
  const blob = new Blob([clearing.content || ''], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value?: string) {
  if (!value) return 'No registrado';

  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function ClearingFileSection({
  batchId,
  batchStatus,
  clearing,
}: {
  batchId?: string;
  batchStatus?: string;
  clearing?: GeneratedFileResponse | null;
}) {
  const preview = parseCsvPreview(clearing?.content);
  const hasClearing = Boolean(clearing?.content);
  const isRejected = batchStatus ? REJECTED_STATUSES.has(batchStatus) : false;

  if (!hasClearing) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h4 className="text-sm font-bold text-[#0D1B4B] mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#0D1B4B]" />
          Archivo de compensacion interbancaria
        </h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          {isRejected
            ? 'No disponible: el lote fue rechazado o no genero compensacion.'
            : 'No aplica: el lote no contiene lineas Off-Us para compensacion interbancaria.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#0D1B4B] mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0D1B4B]" />
            Archivo de compensacion interbancaria
          </h4>
          <p className="text-xs text-gray-600">
            Este archivo representa las lineas Off-Us incluidas en compensacion. En este entorno academico no se transmite a una camara externa real.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadClearingCsv(clearing, batchId)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D1B4B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#142761]"
        >
          <Download className="w-4 h-4" />
          Descargar CSV
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">Archivo</p>
          <p className="mt-1 break-all text-xs font-bold text-gray-900">{clearing.fileName || 'clearing.csv'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">Lineas Off-Us</p>
          <p className="mt-1 text-xs font-bold text-gray-900">{clearing.totalLines ?? preview?.rows.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">Generado</p>
          <p className="mt-1 text-xs font-bold text-gray-900">{formatDate(clearing.generatedAt)}</p>
        </div>
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-100 text-[10px] uppercase text-gray-500">
                <tr>
                  {preview.headers.map((header) => (
                    <th key={header} className="whitespace-nowrap px-3 py-2 font-bold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((row, rowIndex) => (
                  <tr key={`${row.join('-')}-${rowIndex}`} className="text-gray-700">
                    {preview.headers.map((header, columnIndex) => (
                      <td key={`${header}-${columnIndex}`} className="whitespace-nowrap px-3 py-2">
                        {row[columnIndex] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <pre className="max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-700">
          {clearing.content}
        </pre>
      )}
    </div>
  );
}

export function SettlementTab({
  liquidationResult,
  settlement,
  successfulCount,
  batchId,
  batchStatus,
  clearing,
  feesCurrency,
  error,
}: SettlementTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {liquidationResult ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-green-700">Datos reales de liquidacion registrados en el sistema</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">
            Esta liquidacion corresponde unicamente al cobro del servicio de procesamiento.
            El fondeo para beneficiarios se proceso por separado en la etapa de fondeo inicial.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h4 className="text-sm font-bold text-[#0D1B4B] mb-4 flex justify-between items-center">
            Resumen Financiero
            {feesCurrency && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Tarifa en {feesCurrency}</span>}
          </h4>
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
              {error}
            </div>
          ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Pagos Ejecutados Exitosamente</span>
              <span className="font-bold">{successfulCount}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Tarifa Unitaria Aplicada</span>
              <span className="font-bold">${settlement.rate.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
              <span>Base Imponible (sin IVA)</span>
              <span className="font-bold">${(settlement.subtotal - settlement.iva).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA Servicio (15%)</span>
              <span className="font-bold">${settlement.iva.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-[#0D1B4B] text-white p-5 rounded-lg flex justify-between items-center mt-6 shadow-lg">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60">Total a Debitar de Cuenta (con IVA)</p>
                <p className="text-2xl font-black">${settlement.total.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
              </div>
              <Receipt className="w-8 h-8 opacity-20" />
            </div>
          </div>
          )}
        </div>

        <ClearingFileSection batchId={batchId} batchStatus={batchStatus} clearing={clearing} />
      </div>
    </div>
  );
}
