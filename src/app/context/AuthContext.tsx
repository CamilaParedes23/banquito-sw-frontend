import { createContext, useContext, useState, ReactNode } from 'react';

import { User, UserRole } from '../types';

import { AuthService } from '../services/authService';

import { ENV } from '../config/env';



interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);



  const login = async (username: string, password: string) => {
    // 🔥 MODO MOCK - Activado con VITE_MOCK_AUTH_ENABLED=true
    if (ENV.MOCK_AUTH_ENABLED) {
      const mockUsers: Record<string, User> = {
        'admin': {
          id: '1',
          username: 'admin',
          role: 'ADMIN',
          companyName: 'BanQuito Admin',
          companyRuc: '',
          email: 'admin@banquito.com',
        },
        'empresa': {
          id: '2',
          username: 'empresa',
          role: 'EMPRESA',
          companyName: 'Empresa Demo S.A.',
          companyRuc: '1234567890001',
          email: 'empresa@demo.com',
        },
        'operador': {
          id: '3',
          username: 'operador',
          role: 'OPERADOR',
          companyName: 'BanQuito Operaciones',
          companyRuc: '',
          email: 'operador@banquito.com',
        },
      };

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = mockUsers[username.toLowerCase()];
      
      if (user && password === 'admin') {
        setUser(user);
        return;
      } else {
        throw new Error('Credenciales incorrectas');
      }
    }

    // Modo normal con backend
    try {
      const response = await AuthService.login(username, password);

      const userData: User = {
        id: response.credencialWebId || response.clienteId || '1',
        username: response.usuario || username,
        role: (response.rolSwitch as UserRole) || 'EMPRESA',
        companyName: response.nombre || '',
        companyRuc: response.rucEmpresa || '',
        email: response.usuario || '',
      };

      setUser(userData);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };



  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );

}



export function useAuth() {

  const context = useContext(AuthContext);

  if (context === undefined) {

    throw new Error('useAuth must be used within an AuthProvider');

  }

  return context;

}

