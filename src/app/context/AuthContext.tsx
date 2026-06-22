import { createContext, useContext, useState, ReactNode } from 'react';

import { User, UserRole } from '../types';

import { AuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banquito_switch_user';
const TOKEN_STORAGE_KEY = 'banquito_switch_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'banquito_switch_refresh_token';

function loadStoredUser(): User | null {
  try {
    const stored = sessionStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) as User : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  const login = async (username: string, password: string) => {
    try {
      const response = await AuthService.login(username, password);
      const accessToken = response.accessToken;
      if (!accessToken) {
        throw new Error('Core no devolvio accessToken para la sesion.');
      }

      const session = await AuthService.me(accessToken);
      const refreshToken = response.refreshToken;
      const roles = Array.isArray(session.roles) ? session.roles : Array.isArray(response.roles) ? response.roles : [];
      const isMassPaymentsUser = roles.includes('CLIENTE_EMPRESA_PAGOS_MASIVOS') || roles.includes('CLIENTE_EMPRESA');
      if (!isMassPaymentsUser || (roles.includes('CLIENTE_PERSONA') && !roles.includes('CLIENTE_EMPRESA'))) {
        throw new Error('El usuario no tiene perfil empresarial para operar pagos masivos.');
      }

      const role = mapActorTypeToRole(session.actorType || response.actorType, roles);
      const customerUuid = session.customerUuid || session.referenceUuid || response.customerUuid || response.referenceUuid;
      let companyRuc = '';
      let companyName = '';

      if (role === 'EMPRESA' && customerUuid && accessToken) {
        const customer = await AuthService.getCustomer(customerUuid, accessToken);
        companyRuc = customer.identification || '';
        companyName = customer.commercialName || customer.legalName || '';
      }

      const userData: User = {
        id: session.actorUuid || response.actorUuid || response.sessionUuid || '1',
        username: session.username || response.username || username,
        role,
        roles,
        customerUuid,
        companyName,
        companyRuc,
        email: response.username || '',
      };

      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapActorTypeToRole(actorType: string = '', roles: string[] = []): UserRole {
  if (roles.includes('CLIENTE_EMPRESA_PAGOS_MASIVOS')) return 'EMPRESA';
  if (roles.includes('CLIENTE_EMPRESA')) return 'EMPRESA';
  if (roles.includes('ADMIN_SEGURIDAD')) return 'ADMIN';
  if (roles.includes('CLIENTE_PERSONA')) return 'AUDITOR';

  switch (actorType) {
    case 'EMPLEADO':
      return 'OPERADOR';
    case 'ADMIN':
      return 'ADMIN';
    default:
      return 'AUDITOR';
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
