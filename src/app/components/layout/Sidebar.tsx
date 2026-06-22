import { Link, useLocation } from 'react-router';

import {

  LayoutDashboard,

  FileText,

  Upload,

  Settings,

  FileSpreadsheet,

  Activity,

  List,

  Building2,

} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';



interface MenuItem {

  path: string;

  label: string;

  icon: React.ReactNode;

  roles: string[];

}



const menuItems: MenuItem[] = [

  {

    path: '/',

    label: 'Dashboard',

    icon: <LayoutDashboard className="w-5 h-5" />,

    roles: ['EMPRESA', 'OPERADOR', 'AUDITOR', 'ADMIN'],

  },

  {
    path: '/batches',
    label: 'Lotes de Pagos',
    icon: <FileText className="w-5 h-5" />,
    roles: ['EMPRESA'],

  },

  {

    path: '/batches/upload',

    label: 'Cargar Lote',

    icon: <Upload className="w-5 h-5" />,

    roles: ['EMPRESA'],

  },

  {

    path: '/clearing',

    label: 'Compensación Off-Us',

    icon: <FileSpreadsheet className="w-5 h-5" />,

    roles: ['EMPRESA', 'OPERADOR', 'AUDITOR', 'ADMIN'],

  },

  {

    path: '/batches/all',

    label: 'Todos los Lotes',

    icon: <List className="w-5 h-5" />,

    roles: ['OPERADOR', 'AUDITOR', 'ADMIN'],

  },

  {

    path: '/config/services',

    label: 'Tipos de Servicio',

    icon: <Settings className="w-5 h-5" />,

    roles: ['OPERADOR', 'ADMIN'],

  },

  {

    path: '/config/tariffs',

    label: 'Tarifas',

    icon: <FileSpreadsheet className="w-5 h-5" />,

    roles: ['EMPRESA', 'OPERADOR', 'ADMIN'],

  },

  {

    path: '/config/parameters',

    label: 'Parámetros',

    icon: <Settings className="w-5 h-5" />,

    roles: ['ADMIN'],

  },

  {

    path: '/health',

    label: 'Estado del Sistema',

    icon: <Activity className="w-5 h-5" />,

    roles: ['OPERADOR', 'ADMIN'],

  },

];



export function Sidebar() {

  const location = useLocation();

  const { user } = useAuth();



  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || ''));



  return (

    <aside className="w-64 bg-gradient-to-b from-[#0D1B4B] to-[#1a2d5f] text-white flex flex-col shadow-2xl">

      <div className="p-6 border-b border-white/10">

        <div className="flex items-center gap-3">

          <div className="bg-gradient-to-br from-[#C9A84C] to-[#d4b962] p-2.5 rounded-xl shadow-lg">

            <Building2 className="w-6 h-6 text-[#0D1B4B]" />

          </div>

          <div>

            <h1 className="font-bold text-xl tracking-tight">Banco BanQuito</h1>

            <p className="text-xs text-gray-300 font-medium">Switch de Pagos</p>

          </div>

        </div>

      </div>



      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

        {filteredMenuItems.map((item) => {

          const isActive = location.pathname === item.path;

          return (

            <Link

              key={item.path}

              to={item.path}

              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${

                isActive

                  ? 'bg-gradient-to-r from-[#C9A84C] to-[#d4b962] text-[#0D1B4B] font-semibold shadow-lg scale-105'

                  : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'

              }`}

            >

              {item.icon}

              <span className="text-sm">{item.label}</span>

            </Link>

          );

        })}

      </nav>



      <div className="p-4 border-t border-white/10 bg-black/20">

        <div className="text-xs text-gray-400 space-y-1">

          <p className="font-medium text-gray-300">Versión 2.0.1</p>

          <p className="text-gray-500">© 2026 Banco BanQuito</p>

        </div>

      </div>

    </aside>

  );

}
