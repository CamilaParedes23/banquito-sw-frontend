import { useState } from 'react';

import { useParams, useNavigate } from 'react-router';

import { ArrowLeft, AlertTriangle, FileText, AlertCircle, BarChart3 } from 'lucide-react';

import { StatusBadge } from '../../components/shared/StatusBadge';

import { useBatchDetail } from '../../hooks/useBatchDetail';

import { BatchHeader } from './BatchDetail/BatchHeader';

import { BatchLinesTable } from './BatchDetail/BatchLinesTable';

import { ComprobanteTab } from './BatchDetail/ComprobanteTab';

import { NovedadesTab } from './BatchDetail/NovedadesTab';

import { SettlementTab } from './BatchDetail/SettlementTab';

import { BatchService } from '../../services/batchService';



export function BatchDetail() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { batch, novedades } = useBatchDetail(id);

  const [activeTab, setActiveTab] = useState<'lines' | 'novedades' | 'comprobante' | 'settlement'>('lines');

  const [comprobanteData, setComprobanteData] = useState<any>(null);

  const [comprobanteLoading, setComprobanteLoading] = useState(false);

  const [settlementData, setSettlementData] = useState<any>(null);

  const [settlementLoading, setSettlementLoading] = useState(false);



  const fetchComprobante = async () => {
    if (comprobanteData || !id) return;
    setComprobanteLoading(true);
    try {
      const data = await BatchService.getBatchComprobante(id);
      // Mapear respuesta del backend al formato del frontend
      const mappedData = {
        uuidLote: data.batchId,
        tipoReporte: 'COMPROBANTE_CORPORATIVO',
        empresa: {
          rucEmpresa: data.companyRuc,
          cuentaMatrizCargo: data.sourceAccountNumber || 'N/A',
        },
        resumenPagos: {
          transaccionesExitosas: data.successfulOnUsLines || data.billableLines || 0,
          transaccionesRechazadas: (data.totalRecords || data.totalReceivedLines || 0) - (data.successfulOnUsLines || data.billableLines || 0),
          montoTotalDispersado: data.totalProcessedAmount || data.totalControlAmount || 0,
        },
        liquidacionServicio: {
          tarifaUnitariaAplicada: data.unitFee || 0,
          subtotalComision: data.commissionSubtotal || 0,
          ivaPorcentajeAplicado: 0.15,
          montoIva: data.taxAmount || 0,
          totalDebitado: data.totalChargedAmount || 0,
        },
        fechaGeneracion: data.generatedAt,
      };
      setComprobanteData(mappedData);
    } catch (error: any) {
      console.error('Error al cargar comprobante:', error);
      if (error.message?.includes('404') || error.message?.includes('No existe')) {
        setComprobanteData({ error: 'El comprobante no está disponible. El lote debe estar completamente procesado y facturado.' });
      } else {
        setComprobanteData({ error: 'Error al cargar el comprobante.' });
      }
    } finally {
      setComprobanteLoading(false);
    }
  };



  const fetchSettlement = async () => {
    if ((settlementData && !(settlementData as any)?.error) || !id) return;
    setSettlementLoading(true);
    try {
      const [commissionResult, clearingResult] = await Promise.allSettled([
        BatchService.getBatchCommission(id),
        BatchService.getBatchClearingFile(id)
      ]);

      // Si la comisión falla, mostrar error
      if (commissionResult.status === 'rejected') {
        const errorMsg = commissionResult.reason?.message || '';
        if (errorMsg.includes('404') || errorMsg.includes('No existe')) {
          setSettlementData({ error: 'La liquidación no está disponible. El lote debe estar completamente procesado y facturado.' });
        } else {
          setSettlementData({ error: 'Error al cargar la liquidación.' });
        }
        return;
      }

      const commission = commissionResult.value;
      const clearing = clearingResult.status === 'fulfilled' ? clearingResult.value : null;

      // Mapear respuesta del backend al formato del frontend
      const mappedSettlement = {
        rate: commission?.unitFee || 0,
        subtotal: commission?.commissionSubtotal || 0,
        iva: commission?.taxAmount || 0,
        total: commission?.totalCommission || commission?.totalChargedAmount || 0,
      };
      setSettlementData({ commission: mappedSettlement, clearing });
    } catch (error: any) {
      console.error('Error al cargar liquidación:', error);
      setSettlementData({ error: 'Error al cargar la liquidación.' });
    } finally {
      setSettlementLoading(false);
    }
  };



  const handleTabChange = (tab: 'lines' | 'novedades' | 'comprobante' | 'settlement') => {
    setActiveTab(tab);
    if (tab === 'comprobante') fetchComprobante();
    if (tab === 'settlement') fetchSettlement();
  };



  if (!batch.batchId) return <div className="p-20 text-center italic text-gray-400">Consultando PostgreSQL...</div>;





  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#0D1B4B] to-[#1a2d5f] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border-2 border-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold">Detalle del Lote</h1>
              {batch.status && <StatusBadge status={batch.status} size="lg" />}
            </div>
            <p className="text-blue-200 text-lg">Gestión y seguimiento de operaciones</p>
          </div>
        </div>
      </div>

      <BatchHeader batch={batch} />

      {batch.message && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h4 className="text-base font-bold text-red-800 mb-1">Lote Rechazado</h4>
            <p className="text-sm text-red-700">{batch.message}</p>
          </div>
        </div>
      )}

      {batch.receivedAt && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-[#0D1B4B] mb-6">Trazabilidad del Lote</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Recepción', value: batch.receivedAt },
              { label: 'Validación', value: batch.validatedAt },
              { label: 'Fondeo', value: batch.fundedAt },
              { label: 'Contabilidad', value: batch.accountingDate },
            ].map((f) => (
              <div key={f.label} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-2">{f.label}</p>
                <p className="text-sm font-bold text-gray-900">
                  {f.value ? new Date(f.value).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex gap-1 p-2">
            {[
              { id: 'lines' as const, label: 'Pagos', icon: BarChart3 },
              { id: 'novedades' as const, label: 'Novedades', icon: AlertCircle },
              { id: 'comprobante' as const, label: 'Comprobante', icon: FileText },
              { id: 'settlement' as const, label: 'Liquidación', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0D1B4B] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'lines' && (
            <div>
              <h3 className="text-lg font-bold text-[#0D1B4B] mb-4">Detalle de Pagos</h3>
              <BatchLinesTable lines={novedades?.lineas || []} />
            </div>
          )}

          {activeTab === 'novedades' && (
            <NovedadesTab 
              isLoading={false}
              batchId={id}
              data={{
                resumen: {
                  totalLineas: novedades?.lineas?.length || 0,
                  exitosas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0,
                  rechazadas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'RECHAZADA').length || 0,
                  fallidas: novedades?.lineas?.filter((l: any) => l.finalStatus === 'FALLIDA').length || 0,
                },
                lineas: novedades?.lineas?.map((l: any) => ({
                  secuencial: l.sequenceNumber,
                  nombreBeneficiario: l.beneficiaryName,
                  cuentaDestino: l.destinationAccountNumber,
                  monto: l.amount,
                  estado: l.finalStatus,
                  mensajeError: l.errorMessage,
                })) || []
              }} 
            />
          )}

          {activeTab === 'comprobante' && (
            <ComprobanteTab isLoading={comprobanteLoading} data={comprobanteData} />
          )}

          {activeTab === 'settlement' && (
              <SettlementTab 
                liquidationResult={null}
                settlement={settlementData?.commission || {
                  rate: 0,
                  subtotal: 0,
                iva: 0,
                total: 0,
                }}
                successfulCount={novedades?.lineas?.filter((l: any) => l.finalStatus === 'ACREDITADA_ON_US').length || 0}
                batchId={id}
                batchStatus={batch.status}
                clearing={settlementData?.clearing || null}
                error={(settlementData as any)?.error}
              />
          )}
        </div>
      </div>
    </div>
  );
}
