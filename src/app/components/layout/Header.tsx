import { User, Shield, LogOut } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

import { UserRole } from '../../types';



export function Header() {

  const { user, logout } = useAuth();



  const roleLabels: Partial<Record<UserRole, string>> = {
    EMPRESA: 'Empresa',
  };

  const roleColors: Partial<Record<UserRole, string>> = {
    EMPRESA: 'bg-blue-100 text-blue-800',
  };



  if (!user) return null;



  return (

    <header className="bg-white border-b border-gray-200 px-8 py-4">

      <div className="flex items-center justify-between">

        <div>

          {user.role === 'EMPRESA' && user.companyName && (

            <div>

              <h2 className="text-xl font-bold text-gray-900">{user.companyName}</h2>

              {user.companyRuc && <p className="text-sm text-gray-600">RUC: {user.companyRuc}</p>}

            </div>

          )}


        </div>



        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[user.role]}`}>
              <Shield className="w-4 h-4 inline mr-1" />
              {roleLabels[user.role]}
            </span>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-900">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>

      </div>

    </header>

  );

}

