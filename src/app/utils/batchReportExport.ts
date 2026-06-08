import jsPDF from 'jspdf';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

export type ReporteNovedadesApi = {
  uuidLote?: string;
  tipoReporte?: string;
  formato?: string;
  fechaGeneracion?: string;
  resumen?: {
    totalLineas?: number;
    exitosas?: number;
    rechazadas?: number;
    fallidas?: number;
  };
  lineas?: Array<{
    secuencial?: number;
    estado?: string;
    codigoError?: string | null;
    mensajeError?: string | null;
    monto?: number | string;
    cuentaDestino?: string;
    nombreBeneficiario?: string;
  }>;
};

export type ComprobanteLiquidacionApi = {
  uuidLote?: string;
  tipoReporte?: string;
  formato?: string;
  fechaGeneracion?: string;
  empresa?: { rucEmpresa?: string; cuentaMatrizCargo?: string };
  resumenPagos?: {
    transaccionesExitosas?: number;
    transaccionesRechazadas?: number;
    montoTotalDispersado?: number | string;
  };
  liquidacionServicio?: {
    tarifaUnitariaAplicada?: number | string;
    subtotalComision?: number | string;
    ivaPorcentajeAplicado?: number | string;
    montoIva?: number | string;
    totalDebitado?: number | string;
  };
};

export function reporteNovedadesToCsv(data: ReporteNovedadesApi): string {
  const lines: string[] = [];
  lines.push('# Reporte de novedades — Switch BanQuito');
  lines.push(toCsvRow(['tipoReporte', data.tipoReporte ?? '']));
  lines.push(toCsvRow(['fechaGeneracion', data.fechaGeneracion ?? '']));
  lines.push('');
  lines.push(toCsvRow(['totalLineas', 'exitosas', 'rechazadas', 'fallidas']));
  const r = data.resumen;
  lines.push(
    toCsvRow([r?.totalLineas ?? '', r?.exitosas ?? '', r?.rechazadas ?? '', r?.fallidas ?? ''])
  );
  lines.push('');
  lines.push(
    toCsvRow([
      'secuencial',
      'estado',
      'codigoError',
      'mensajeError',
      'monto',
      'cuentaDestino',
      'nombreBeneficiario',
    ])
  );
  for (const l of data.lineas ?? []) {
    lines.push(
      toCsvRow([
        l.secuencial ?? '',
        l.estado ?? '',
        l.codigoError ?? '',
        l.mensajeError ?? '',
        l.monto ?? '',
        l.cuentaDestino ?? '',
        l.nombreBeneficiario ?? '',
      ])
    );
  }
  return lines.join('\r\n');
}

export function comprobanteLiquidacionToCsv(data: ComprobanteLiquidacionApi): string {
  const lines: string[] = [];
  lines.push('# Comprobante de liquidación corporativa — Switch BanQuito');
  lines.push(toCsvRow(['fechaGeneracion', data.fechaGeneracion ?? '']));
  lines.push('');
  lines.push(toCsvRow(['rucEmpresa', 'cuentaMatrizCargo']));
  lines.push(
    toCsvRow([data.empresa?.rucEmpresa ?? '', data.empresa?.cuentaMatrizCargo ?? ''])
  );
  lines.push('');
  lines.push(
    toCsvRow(['transaccionesExitosas', 'transaccionesRechazadas', 'montoTotalDispersado'])
  );
  const rp = data.resumenPagos;
  lines.push(
    toCsvRow([
      rp?.transaccionesExitosas ?? '',
      rp?.transaccionesRechazadas ?? '',
      rp?.montoTotalDispersado ?? '',
    ])
  );
  lines.push('');
  lines.push(
    toCsvRow([
      'tarifaUnitariaAplicada',
      'subtotalComision',
      'ivaPorcentajeAplicado',
      'montoIva',
      'totalDebitado',
    ])
  );
  const liq = data.liquidacionServicio;
  lines.push(
    toCsvRow([
      liq?.tarifaUnitariaAplicada ?? '',
      liq?.subtotalComision ?? '',
      liq?.ivaPorcentajeAplicado ?? '',
      liq?.montoIva ?? '',
      liq?.totalDebitado ?? '',
    ])
  );
  return lines.join('\r\n');
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function generateComprobantePdf(data: ComprobanteLiquidacionApi): void {
  const doc = new jsPDF();
  const shortId = data.uuidLote?.substring(0, 8) ?? 'lote';
  
  // Colores del banco
  const azulOscuro = '#0D1B4B';
  const dorado = '#C9A84C';
  
  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };
  
  // Encabezado con branding
  doc.setFillColor(azulOscuro);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BAN BANQUITO', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Switch de Pagos Masivos', 20, 33);
  
  doc.setTextColor(dorado);
  doc.setFontSize(10);
  doc.text('Comprobante de Liquidación', 140, 25);
  
  // Línea dorada
  doc.setDrawColor(dorado);
  doc.setLineWidth(2);
  doc.line(0, 40, 210, 40);
  
  // Información del lote
  doc.setTextColor(azulOscuro);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Lote', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${formatearFecha(data.fechaGeneracion ?? '')}`, 20, 65);
  
  // Sección Empresa
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, 82, 180, 35, 3, 3, 'F');
  doc.setDrawColor(azulOscuro);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 82, 180, 35, 3, 3, 'S');
  
  doc.setTextColor(azulOscuro);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Empresa', 20, 92);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`RUC: ${data.empresa?.rucEmpresa ?? ''}`, 20, 99);
  doc.text(`Cuenta Matriz: ${data.empresa?.cuentaMatrizCargo ?? ''}`, 20, 106);
  
  // Sección Resumen de Pagos
  doc.setTextColor(azulOscuro);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Pagos', 20, 125);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 130, 190, 130);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const rp = data.resumenPagos;
  doc.text(`Transacciones Exitosas: ${rp?.transaccionesExitosas ?? ''}`, 20, 138);
  doc.text(`Transacciones Rechazadas: ${rp?.transaccionesRechazadas ?? ''}`, 20, 145);
  doc.setTextColor(azulOscuro);
  doc.setFont('helvetica', 'bold');
  doc.text(`Monto Total Dispersado: $${rp?.montoTotalDispersado ?? ''}`, 20, 152);
  
  // Sección Liquidación
  doc.setFillColor(255, 252, 240);
  doc.roundedRect(15, 158, 180, 45, 3, 3, 'F');
  doc.setDrawColor(dorado);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 158, 180, 45, 3, 3, 'S');
  
  doc.setTextColor(dorado);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Liquidación del Servicio', 20, 172);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const liq = data.liquidacionServicio;
  doc.text(`Tarifa Unitaria: $${liq?.tarifaUnitariaAplicada ?? ''}`, 20, 180);
  doc.text(`Subtotal Comisión: $${liq?.subtotalComision ?? ''}`, 20, 186);
  doc.text(`IVA (${liq?.ivaPorcentajeAplicado ?? ''}%): $${liq?.montoIva ?? ''}`, 20, 192);
  
  doc.setTextColor(azulOscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total a Debitar: $${liq?.totalDebitado ?? ''}`, 20, 200);
  
  // Pie de página
  doc.setFillColor(azulOscuro);
  doc.rect(0, 270, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento es un comprobante oficial de liquidación.', 20, 280);
  doc.text('Banco Banquito - Switch de Pagos Masivos', 20, 287);
  doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 140, 280);
  
  doc.save(`Comprobante_LIQUIDACION_${shortId}.pdf`);
}

export function generateNovedadesPdf(data: ReporteNovedadesApi): void {
  const doc = new jsPDF();
  const shortId = data.uuidLote?.substring(0, 8) ?? 'lote';
  
  // Colores del banco
  const azulOscuro = '#0D1B4B';
  const dorado = '#C9A84C';
  
  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };
  
  // Encabezado con branding
  doc.setFillColor(azulOscuro);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BAN BANQUITO', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Switch de Pagos Masivos', 20, 33);
  
  doc.setTextColor(dorado);
  doc.setFontSize(10);
  doc.text('Reporte de Novedades', 140, 25);
  
  // Línea dorada
  doc.setDrawColor(dorado);
  doc.setLineWidth(2);
  doc.line(0, 40, 210, 40);
  
  // Información del lote
  doc.setTextColor(azulOscuro);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Lote', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${formatearFecha(data.fechaGeneracion ?? '')}`, 20, 65);
  
  // Sección Resumen
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(15, 82, 180, 42, 3, 3, 'F');
  doc.setDrawColor(azulOscuro);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 82, 180, 42, 3, 3, 'S');
  
  doc.setTextColor(azulOscuro);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 20, 92);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const r = data.resumen;
  doc.text(`Total Líneas: ${r?.totalLineas ?? ''}`, 20, 100);
  doc.text(`Exitosas: ${r?.exitosas ?? ''}`, 20, 106);
  doc.text(`Rechazadas: ${r?.rechazadas ?? ''}`, 20, 112);
  doc.text(`Fallidas: ${r?.fallidas ?? ''}`, 20, 118);
  
  // Sección Detalle de Líneas
  doc.setTextColor(azulOscuro);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Líneas', 20, 135);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, 140, 190, 140);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  let y = 150;
  for (const l of data.lineas ?? []) {
    // Calcular altura del recuadro según si hay error
    const errorText = l.codigoError ? `Error: ${l.codigoError} - ${l.mensajeError ?? ''}` : '';
    const splitError = errorText ? doc.splitTextToSize(errorText, 170) : [];
    const errorLines = splitError.length || 0;
    const boxHeight = 30 + (errorLines > 0 ? 8 + (errorLines - 1) * 5 : 0);
    
    if (y + boxHeight > 260) {
      doc.addPage();
      y = 20;
    }
    
    // Fondo para cada línea
    doc.setFillColor(l.estado === 'EXITOSA' ? '#F0FFF0' : '#FFF0F0');
    doc.roundedRect(15, y - 4, 180, boxHeight, 2, 2, 'F');
    doc.setDrawColor(azulOscuro);
    doc.setLineWidth(0.2);
    doc.roundedRect(15, y - 4, 180, boxHeight, 2, 2, 'S');
    
    doc.setTextColor(azulOscuro);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${l.secuencial ?? ''} - ${l.estado ?? ''}`, 20, y + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Cuenta: ${l.cuentaDestino ?? ''}`, 20, y + 9);
    doc.text(`Beneficiario: ${l.nombreBeneficiario ?? ''}`, 20, y + 16);
    doc.text(`Monto: $${l.monto ?? ''}`, 20, y + 23);
    
    if (l.codigoError) {
      doc.setTextColor(200, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(splitError, 20, y + 30);
    }
    
    y += boxHeight + 8;
  }
  
  // Pie de página
  doc.setFillColor(azulOscuro);
  doc.rect(0, 270, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento es un reporte oficial de novedades.', 20, 280);
  doc.text('Banco Banquito - Switch de Pagos Masivos', 20, 287);
  doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 140, 280);
  
  doc.save(`Reporte_NOVEDADES_${shortId}.pdf`);
}
