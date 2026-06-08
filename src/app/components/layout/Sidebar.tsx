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

    <aside className="w-64 bg-[#0D1B4B] text-white flex flex-col">

      <div className="p-6 border-b border-[#1e3a8a]">

        <div className="flex items-center gap-3">

          <div className="bg-[#C9A84C] p-2 rounded-lg">

            <Building2 className="w-6 h-6 text-[#0D1B4B]" />

          </div>

          <div>

            <h1 className="font-bold text-lg">BanQuito</h1>

            <p className="text-xs text-gray-300">Switch de Pagos</p>

          </div>

        </div>

      </div>



      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {filteredMenuItems.map((item) => {

          const isActive = location.pathname === item.path;

          return (

            <Link

              key={item.path}

              to={item.path}

              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${

                isActive

                  ? 'bg-[#C9A84C] text-[#0D1B4B] font-medium'

                  : 'text-gray-300 hover:bg-[#1e3a8a] hover:text-white'

              }`}

            >

              {item.icon}

              <span>{item.label}</span>

            </Link>

          );

        })}

      </nav>



      <div className="p-4 border-t border-[#1e3a8a]">

        <div className="text-xs text-gray-400">

          <p>Versión 2.0.1</p>

          <p className="mt-1">© 2026 BanQuito</p>

        </div>

      </div>

    </aside>

  );

}

