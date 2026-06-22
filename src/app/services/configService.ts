import { apiClient } from './apiClient';

export const ConfigService = {
  getCutoffTimes: () =>
    Promise.resolve([
      { tipoPago: 'NOMINA', diaSemana: 'LUNES', horaCorte: '18:00', zonaHoraria: 'America/Guayaquil' },
      { tipoPago: 'PROVEEDORES', diaSemana: 'LUNES', horaCorte: '17:00', zonaHoraria: 'America/Guayaquil' }
    ]),

  getOperatingHours: () =>
    Promise.resolve([
      { tipoPago: 'NOMINA', diaSemana: 'LUNES', horaCorte: '18:00', zonaHoraria: 'America/Guayaquil' }
    ]),

  getPricingRules: () =>
    Promise.resolve([
      { rangoDesde: 1, rangoHasta: 100, tarifaUnitaria: 0.50, vigenciaDesde: '2024-01-01' },
      { rangoDesde: 101, rangoHasta: 500, tarifaUnitaria: 0.40, vigenciaDesde: '2024-01-01' },
      { rangoDesde: 501, rangoHasta: 999999, tarifaUnitaria: 0.30, vigenciaDesde: '2024-01-01' }
    ]),

  getSystemHealth: () =>
    Promise.resolve({ status: 'OPERATIONAL', services: [] }),

  getServiceTypes: () =>
    Promise.resolve([
      { codigo: 'NOMINA', nombre: 'Nómina', descripcion: 'Pagos de nómina a empleados' },
      { codigo: 'PROVEEDORES', nombre: 'Proveedores', descripcion: 'Pagos a proveedores' }
    ])
};

export const CatalogService = {
  getServiceTypes: () =>
    Promise.resolve([
      { codigo: 'NOMINA', nombre: 'Nómina', descripcion: 'Pagos de nómina a empleados' },
      { codigo: 'PROVEEDORES', nombre: 'Proveedores', descripcion: 'Pagos a proveedores' }
    ])
};
