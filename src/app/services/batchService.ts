import { apiClient } from './apiClient';

export const BatchService = {
  uploadBatch: (formData: FormData) => 
    apiClient('/pagos-masivos/lotes', { method: 'POST', body: formData }),

  getBatches: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/pagos-masivos/lotes${query}`, { method: 'GET' });
  },

  getBatchLines: (uuid: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient(`/pagos-masivos/lotes/${uuid}/lineas${query}`, { method: 'GET' });
  },

  validateBatch: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/validar`, { method: 'POST' }),

  processBatch: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/procesar`, { method: 'POST' }),

  liquidateBatch: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/liquidar`, { method: 'POST' }),

  annulBatch: (uuid: string, motivo: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}`, { 
      method: 'DELETE', 
      body: JSON.stringify({ motivo }),
      headers: { 'Content-Type': 'application/json' }
    }),

  getBatchNovedades: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/novedades?formato=JSON`, { method: 'GET' }),

  getBatchComprobante: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/comprobante?formato=JSON`, { method: 'GET' }),

  getBatchStatus: (uuid: string) => 
    apiClient(`/pagos-masivos/lotes/${uuid}/estado`, { method: 'GET' })
};
