const CORE_KONG_BASE_URL = import.meta.env.VITE_CORE_KONG_BASE_URL || 'http://localhost:8000';

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInSeconds?: number;
  sessionUuid?: string;
  actorUuid?: string;
  actorType?: string;
  username?: string;
  roles?: string[];
  scopes?: string[];
  referenceUuid?: string;
  referenceType?: string;
  customerUuid?: string;
}

export type AuthMeResponse = LoginResponse & {
  subject?: string;
  clientId?: string;
};

export interface RefreshResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInSeconds?: number;
}

export interface CustomerDetailResponse {
  customerUuid?: string;
  identification?: string;
  status?: string;
  massPaymentsEnabled?: boolean;
  legalName?: string;
  commercialName?: string;
}

export const AuthService = {
  login: (usuario: string, contrasena: string): Promise<LoginResponse> => {
    return fetch(`${CORE_KONG_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username: usuario, password: contrasena }),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      if (!res.ok) throw new Error('Error en autenticacion');
      return res.json();
    });
  },

  me: (accessToken: string): Promise<AuthMeResponse> => {
    return fetch(`${CORE_KONG_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => {
      if (!res.ok) throw new Error('No se pudo obtener la sesion autenticada');
      return res.json();
    });
  },

  refresh: (refreshToken: string): Promise<RefreshResponse> => {
    return fetch(`${CORE_KONG_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      if (!res.ok) throw new Error('No se pudo renovar la sesion');
      return res.json();
    });
  },

  getCustomer: (customerUuid: string, accessToken: string): Promise<CustomerDetailResponse> => {
    return fetch(`${CORE_KONG_BASE_URL}/api/v1/customers/${customerUuid}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => {
      if (!res.ok) throw new Error('No se pudo resolver la empresa autenticada');
      return res.json();
    });
  }
};
