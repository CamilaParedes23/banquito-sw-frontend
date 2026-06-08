import { apiClient } from './apiClient';

export const ConfigService = {
  getCutoffTimes: () =>
    apiClient('/pagos-masivos/horarios-corte', { method: 'GET' }),

  getOperatingHours: () =>
    apiClient('/pagos-masivos/horarios-corte', { method: 'GET' }),

  getPricingRules: () => apiClient('/pagos-masivos/tarifas', { method: 'GET' }),

  getSystemHealth: () =>
    apiClient('/pagos-masivos/horarios-corte', { method: 'GET' }),

  getServiceTypes: () =>
    apiClient('/pagos-masivos/tipos-servicio', { method: 'GET' })
};

export const CatalogService = {
  getServiceTypes: () =>
    apiClient('/pagos-masivos/tipos-servicio', { method: 'GET' })
};
