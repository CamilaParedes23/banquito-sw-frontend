import { createContext, useContext, useState, ReactNode } from 'react';

import { User, UserRole } from '../types';

import { AuthService } from '../services/authService';



interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);



  const login = async (username: string, password: string) => {
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

