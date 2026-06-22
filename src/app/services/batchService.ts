import { apiClient } from './apiClient';

export const BatchService = {
  uploadBatch: (formData: FormData) =>
    apiClient('/batches/upload', { method: 'POST', body: formData }),

  getBatches: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/batches${query}`, { method: 'GET' });
  },

  getBatchLines: (uuid: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/batches/${uuid}/lines${query}`, { method: 'GET' });
  },

  validateBatch: (uuid: string) =>
    Promise.resolve({ success: true, message: 'Validación pendiente de implementación' }),

  processBatch: (uuid: string) =>
    Promise.resolve({ success: true, message: 'Procesamiento pendiente de implementación' }),

  liquidateBatch: (uuid: string) =>
    Promise.resolve({ success: true, message: 'Liquidación pendiente de implementación' }),

  annulBatch: (uuid: string, motivo: string) =>
    Promise.resolve({ success: true, message: 'Anulación pendiente de implementación' }),

  getBatchNovedades: (uuid: string) =>
    apiClient(`/batches/${uuid}/reports/novelties`, { method: 'GET' }),

  getBatchNovedadesDetails: (uuid: string) =>
    apiClient(`/batches/${uuid}/novelties/details`, { method: 'GET' }),

  getBatchComprobante: (uuid: string) =>
    apiClient(`/batches/${uuid}/receipts/corporate`, { method: 'GET' }),

  getBatchCommission: (uuid: string) =>
    apiClient(`/batches/${uuid}/commission`, { method: 'GET' }),

  getBatchClearingFile: (uuid: string) =>
    apiClient(`/batches/${uuid}/clearing-file`, { method: 'GET' }),

  getBatchValidationErrors: (uuid: string) =>
    apiClient(`/batches/${uuid}/validation-errors`, { method: 'GET' }),

  getBatchStatus: (uuid: string) =>
    apiClient(`/batches/${uuid}`, { method: 'GET' })
};
