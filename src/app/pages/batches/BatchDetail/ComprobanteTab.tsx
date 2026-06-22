import { Building2, CreditCard, Receipt, CheckCircle2, XCircle, CircleDollarSign, BadgePercent, FileCheck, Download, FileSpreadsheet } from 'lucide-react';
import { generateComprobantePdf, comprobanteLiquidacionToCsv, downloadTextFile } from '../../../utils/batchReportExport';

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

interface ComprobanteTabProps {
  isLoading: boolean;
  data: ComprobanteData | null;
}

function SectionCard({ title, icon: Icon, children, variant = 'default' }: { title: string; icon: any; children: React.ReactNode; variant?: 'default' | 'highlight' | 'total' }) {
  const variants = {
    default: 'bg-white border-gray-200',
    highlight: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
    total: 'bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] border-[#0D1B4B] text-white',
  };

  return (
    <div className={`rounded-2xl border p-6 space-y-4 shadow-sm ${variants[variant]}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'total' ? 'bg-white/20' : 'bg-[#0D1B4B]/10'}`}>
          <Icon className={`w-5 h-5 ${variant === 'total' ? 'text-white' : 'text-[#0D1B4B]'}`} />
        </div>
        <h4 className={`text-sm font-bold uppercase tracking-wider ${variant === 'total' ? 'text-white/80' : 'text-[#0D1B4B]'}`}>
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, isTotal = false, positive = false, negative = false }: { label: string; value: React.ReactNode; isTotal?: boolean; positive?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${isTotal ? 'border-t-2 border-current pt-3 mt-2' : ''}`}>
      <span className={`${isTotal ? 'font-black text-base' : 'text-gray-600 text-sm'}`}>{label}</span>
      <span className={`font-bold ${isTotal ? 'text-xl' : 'text-sm'} ${positive ? 'text-green-600' : ''} ${negative ? 'text-red-600' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function ComprobanteTab({ isLoading, data }: ComprobanteTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D1B4B]" />
        <span className="ml-3 text-gray-500 font-medium">Cargando comprobante...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400 text-lg">Comprobante no disponible.</div>;
  }

  if ((data as any).error) {
    return <div className="text-center py-20 text-gray-400 text-lg">{(data as any).error}</div>;
  }

  const dispersado = Number(data.resumenPagos?.montoTotalDispersado || 0);
  const comision = Number(data.liquidacionServicio?.totalDebitado || 0);
  const totalGeneral = dispersado + comision;
  const baseImponible = Number(data.liquidacionServicio?.subtotalComision || 0) - Number(data.liquidacionServicio?.montoIva || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-300" />
              <h2 className="text-2xl font-black">Comprobante de Liquidación</h2>
            </div>
            <p className="text-blue-200 font-mono text-sm">{data.uuidLote}</p>
            <span className="inline-block px-3 py-1 bg-green-400/20 text-green-300 text-xs font-bold rounded-full border border-green-400/30">
              {data.tipoReporte}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Generado</p>
            <p className="text-sm font-medium">
              {data.fechaGeneracion ? new Date(data.fechaGeneracion).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de descarga */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => generateComprobantePdf(data)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1B4B] text-white rounded-xl text-sm font-bold hover:bg-[#1a2d5f] transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
        <button
          onClick={() => downloadTextFile(
            `Comprobante_${data.uuidLote}.csv`,
            comprobanteLiquidacionToCsv(data),
            'text/csv'
          )}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#0D1B4B] text-[#0D1B4B] rounded-xl text-sm font-bold hover:bg-[#0D1B4B]/5 transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Descargar CSV
        </button>
      </div>

      {/* Datos de la Empresa */}
      <SectionCard title="Datos de la Empresa" icon={Building2}>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">RUC Empresa</p>
            <p className="text-lg font-black text-[#0D1B4B]">{data.empresa?.rucEmpresa}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cuenta Matriz</p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0D1B4B]" />
              <p className="text-lg font-mono font-bold text-[#0D1B4B]">{data.empresa?.cuentaMatrizCargo}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Resumen de Pagos */}
      <SectionCard title="Resumen de Pagos a Beneficiarios" icon={CheckCircle2}>
        <Row label="Transacciones Exitosas" value={data.resumenPagos?.transaccionesExitosas} positive />
        <Row label="Transacciones Rechazadas" value={data.resumenPagos?.transaccionesRechazadas} negative />
        <Row
          label="Monto Total Dispersado"
          value={`$${dispersado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
          isTotal
        />
      </SectionCard>

      {/* Liquidación del Servicio */}
      <SectionCard title="Desglose de la Comisión por Servicio" icon={BadgePercent} variant="highlight">
        <Row label="Tarifa Unitaria Aplicada" value={`$${Number(data.liquidacionServicio?.tarifaUnitariaAplicada).toFixed(2)}`} />
        <Row label="Base Imponible (sin IVA)" value={`$${baseImponible.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
        <Row label={`IVA (${Number(data.liquidacionServicio?.ivaPorcentajeAplicado || 0.15) * 100}%)`} value={`$${Number(data.liquidacionServicio?.montoIva).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
        <Row
          label="Total del Servicio (con IVA)"
          value={`$${comision.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
          isTotal
        />
      </SectionCard>

      {/* Resumen Total */}
      <SectionCard title="Resumen Total de Débitos a Cuenta Matriz" icon={FileCheck} variant="total">
        <div className="space-y-3 text-white/90">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-blue-300" />
              Fondeo para dispersión a beneficiarios
            </span>
            <span className="font-bold">${dispersado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-300" />
              Comisión por servicio (con IVA)
            </span>
            <span className="font-bold">${comision.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="border-t-2 border-white/30 pt-4 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black">TOTAL GENERAL DEBITADO</span>
              <span className="text-3xl font-black">
                ${totalGeneral.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <p className="text-[10px] text-gray-400 text-center pb-4">
        Documento generado electrónicamente por el sistema de pagos masivos de Banco BanQuito.
      </p>
    </div>
  );
}
