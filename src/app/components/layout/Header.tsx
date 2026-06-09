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

    <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex-1">

          {user.role === 'EMPRESA' && user.companyName && (

            <div>

              <h2 className="text-xl font-bold text-gray-900">{user.companyName}</h2>

              {user.companyRuc && <p className="text-sm text-gray-600">RUC: {user.companyRuc}</p>}

            </div>

          )}

        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0D1B4B] to-[#1a2d5f] rounded-full flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-sm">B</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#0D1B4B]">BANCO BANQUITO</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${roleColors[user.role]} shadow-sm`}>
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              {roleLabels[user.role]}
            </span>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200"
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

