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
      {
        tipoServicio: 'NOM',
        moneda: 'USD',
        vigenteDesde: '2026-06-22',
        rangos: [
          { rangoDesde: 1, rangoHasta: 10, tarifaUnitaria: 0.50 },
          { rangoDesde: 11, rangoHasta: 100, tarifaUnitaria: 0.40 },
          { rangoDesde: 101, rangoHasta: 500, tarifaUnitaria: 0.30 },
          { rangoDesde: 501, rangoHasta: 1000, tarifaUnitaria: 0.20 },
          { rangoDesde: 1001, rangoHasta: 10000, tarifaUnitaria: 0.10 },
          { rangoDesde: 10001, rangoHasta: null, tarifaUnitaria: 0.05 },
        ],
      },
      {
        tipoServicio: 'PRV',
        moneda: 'USD',
        vigenteDesde: '2026-06-22',
        rangos: [
          { rangoDesde: 1, rangoHasta: 10, tarifaUnitaria: 0.50 },
          { rangoDesde: 11, rangoHasta: 100, tarifaUnitaria: 0.40 },
          { rangoDesde: 101, rangoHasta: 500, tarifaUnitaria: 0.30 },
          { rangoDesde: 501, rangoHasta: 1000, tarifaUnitaria: 0.20 },
          { rangoDesde: 1001, rangoHasta: 10000, tarifaUnitaria: 0.10 },
          { rangoDesde: 10001, rangoHasta: null, tarifaUnitaria: 0.05 },
        ],
      },
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
