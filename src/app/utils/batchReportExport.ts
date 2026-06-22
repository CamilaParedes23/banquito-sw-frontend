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
  const grisTexto = '#4A4A4A';
  const grisClaro = '#F8F9FA';
  const blanco = '#FFFFFF';

  // Utilidades
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const [rAzul, gAzul, bAzul] = hexToRgb(azulOscuro);
  const [rDorado, gDorado, bDorado] = hexToRgb(dorado);

  const fmtMoney = (val: number | string | undefined) => {
    const n = Number(val ?? 0);
    return n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  };

  let y = 10;
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ========================= HEADER =========================
  doc.setFillColor(rAzul, gAzul, bAzul);
  doc.rect(0, 0, pageW, 38, 'F');

  // Línea dorada debajo del header
  doc.setDrawColor(rDorado, gDorado, bDorado);
  doc.setLineWidth(1.2);
  doc.line(0, 38, pageW, 38);

  // Logo area (simulado con rectángulo)
  doc.setFillColor(rDorado, gDorado, bDorado);
  doc.roundedRect(margin, 10, 10, 10, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BANCO BANQUITO', margin + 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Switch de Pagos Masivos', margin + 14, 24);

  // Tipo de documento a la derecha
  doc.setTextColor(rDorado, gDorado, bDorado);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COMPROBANTE DE', pageW - margin - 50, 16, { align: 'right' });
  doc.text('LIQUIDACION CORPORATIVA', pageW - margin - 50, 22, { align: 'right' });

  // ========================= INFO DEL DOCUMENTO =========================
  y = 48;
  doc.setTextColor(rAzul, gAzul, bAzul);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DOCUMENTO N°: ${shortId.toUpperCase()}`, margin, y);
  doc.text(`FECHA DE EMISION: ${formatearFecha(data.fechaGeneracion ?? '')}`, pageW - margin, y, { align: 'right' });

  // Línea separadora sutil
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 4, pageW - margin, y + 4);

  // ========================= SECCION EMPRESA =========================
  y = 62;
  doc.setFillColor(rAzul, gAzul, bAzul);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('  DATOS DE LA EMPRESA', margin, y);
  doc.setFillColor(rAzul, gAzul, bAzul);
  doc.rect(margin, y + 1, contentW, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`RUC: ${data.empresa?.rucEmpresa ?? 'N/A'}`, margin + 4, y + 9);
  doc.text(`Cuenta Matriz de Cargo: ${data.empresa?.cuentaMatrizCargo ?? 'N/A'}`, margin + 4, y + 18);

  // ========================= RESUMEN DE PAGOS =========================
  y = 92;
  doc.setTextColor(rAzul, gAzul, bAzul);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESUMEN DE PAGOS A BENEFICIARIOS', margin, y);

  // Subrayado dorado del título
  doc.setDrawColor(rDorado, gDorado, bDorado);
  doc.setLineWidth(0.8);
  const titleWidth = doc.getTextWidth('RESUMEN DE PAGOS A BENEFICIARIOS');
  doc.line(margin, y + 2, margin + titleWidth, y + 2);

  y += 10;

  // Tabla de resumen de pagos
  const col1 = margin;
  const col2 = margin + contentW * 0.6;
  const col3 = pageW - margin;
  const rowH = 10;

  const drawRow = (
    label: string,
    value: string,
    isHeader = false,
    isTotal = false,
    isHighlight = false
  ) => {
    if (isHeader) {
      doc.setFillColor(rAzul, gAzul, bAzul);
      doc.rect(col1, y, contentW, rowH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(label, col1 + 4, y + 6);
      doc.text(value, col3 - 4, y + 6, { align: 'right' });
    } else if (isTotal) {
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(col1, y, col3, y);
      doc.setTextColor(rAzul, gAzul, bAzul);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, col1 + 4, y + 6);
      doc.text(value, col3 - 4, y + 6, { align: 'right' });
    } else if (isHighlight) {
      doc.setFillColor(rAzul, gAzul, bAzul);
      doc.rect(col1, y, contentW, rowH + 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, col1 + 4, y + 7);
      doc.text(value, col3 - 4, y + 7, { align: 'right' });
    } else {
      doc.setFillColor(grisClaro);
      doc.rect(col1, y, contentW, rowH, 'F');
      doc.setTextColor(grisTexto);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(label, col1 + 4, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(value, col3 - 4, y + 6, { align: 'right' });
    }
    y += rowH + (isHighlight ? 2 : 0);
  };

  drawRow('CONCEPTO', 'VALOR', true);
  drawRow('Transacciones Exitosas', `${data.resumenPagos?.transaccionesExitosas ?? 0}`, false, false, false);
  drawRow('Transacciones Rechazadas', `${data.resumenPagos?.transaccionesRechazadas ?? 0}`, false, false, false);
  drawRow('Monto Total Dispersado', `$${fmtMoney(data.resumenPagos?.montoTotalDispersado)}`, false, true, false);

  // ========================= DESGLOSE COMISION =========================
  y += 6;
  doc.setTextColor(rAzul, gAzul, bAzul);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DESGLOSE DE LA COMISION POR SERVICIO', margin, y);
  doc.setDrawColor(rDorado, gDorado, bDorado);
  doc.setLineWidth(0.8);
  const titleWidth2 = doc.getTextWidth('DESGLOSE DE LA COMISION POR SERVICIO');
  doc.line(margin, y + 2, margin + titleWidth2, y + 2);

  y += 10;
  const liq = data.liquidacionServicio;

  drawRow('CONCEPTO', 'VALOR', true);
  drawRow('Tarifa Unitaria Aplicada', `$${fmtMoney(liq?.tarifaUnitariaAplicada)}`);
  drawRow('Base Imponible (sin IVA)', `$${fmtMoney(Number(liq?.subtotalComision ?? 0) - Number(liq?.montoIva ?? 0))}`);
  drawRow(`IVA Aplicado (${(Number(liq?.ivaPorcentajeAplicado || 0.15) * 100).toFixed(0)}%)`, `$${fmtMoney(liq?.montoIva)}`);
  drawRow('Total del Servicio (con IVA)', `$${fmtMoney(liq?.totalDebitado)}`, false, true, false);

  // ========================= TOTAL GENERAL =========================
  y += 6;
  const dispersado = Number(data.resumenPagos?.montoTotalDispersado || 0);
  const comision = Number(liq?.totalDebitado || 0);
  const totalGeneral = dispersado + comision;

  drawRow('', '', false, false, true);
  y -= rowH + 2; // compensar el drawRow anterior

  doc.setFillColor(rAzul, gAzul, bAzul);
  doc.roundedRect(margin, y, contentW, 30, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Fondeo para dispersion a beneficiarios', margin + 6, y + 10);
  doc.text(`$${fmtMoney(dispersado)}`, col3 - 6, y + 10, { align: 'right' });

  doc.text('Comision por servicio (con IVA)', margin + 6, y + 18);
  doc.text(`$${fmtMoney(comision)}`, col3 - 6, y + 18, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(rDorado, gDorado, bDorado);
  doc.line(margin + 6, y + 22, col3 - 6, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL GENERAL DEBITADO', margin + 6, y + 28);
  doc.text(`$${fmtMoney(totalGeneral)}`, col3 - 6, y + 28, { align: 'right' });

  y += 36;

  // ========================= SELLO / AVISO =========================
  y += 4;
  doc.setFillColor(255, 252, 245);
  doc.setDrawColor(rDorado, gDorado, bDorado);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, 'FD');

  doc.setTextColor(rDorado, gDorado, bDorado);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DOCUMENTO OFICIAL GENERADO ELECTRONICAMENTE', margin + 4, y + 5);

  doc.setTextColor(grisTexto);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Este comprobante tiene caracter oficial para fines contables y tributarios.', margin + 4, y + 10);

  // ========================= FOOTER =========================
  const footerY = 285;
  doc.setFillColor(rAzul, gAzul, bAzul);
  doc.rect(0, footerY, pageW, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Banco Banquito - Switch de Pagos Masivos', margin, footerY + 6);
  doc.text('Documento generado por el sistema automaticamente.', margin, footerY + 11);

  doc.setTextColor(rDorado, gDorado, bDorado);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, pageW - margin, footerY + 6, { align: 'right' });
  doc.text(`ID: ${data.uuidLote ?? 'N/A'}`, pageW - margin, footerY + 11, { align: 'right' });

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
