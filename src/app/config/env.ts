export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'BanQuito',
  APP_SUBTITLE: import.meta.env.VITE_APP_SUBTITLE || 'Switch Pagos Masivos',
  MOCK_AUTH_ENABLED: import.meta.env.VITE_MOCK_AUTH_ENABLED === 'true',
  DEFAULT_ADMIN_USER: import.meta.env.VITE_DEFAULT_ADMIN_USER || 'admin',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
};
