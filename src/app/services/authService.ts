import { apiClient } from './apiClient';

export const AuthService = {
  login: (usuario: string, contrasena: string) =>
    apiClient('/pagos-masivos/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, contrasena }),
      headers: { 'Content-Type': 'application/json' }
    })
};
