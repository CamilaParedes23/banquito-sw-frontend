import { useState, useEffect } from 'react';
import { CatalogService } from '../../services/configService';
import { ServiceTypeConfig } from '../../types';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ServiceTypes() {
  const [services, setServices] = useState<ServiceTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await CatalogService.getServiceTypes();
      setServices(data);
    } catch {
      toast.error('No se pudo conectar con el backend. Verifique que el servidor esté activo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B4B]">Tipos de Servicio</h1>
          <p className="text-gray-600 mt-1">Catálogo de tipos de servicio disponibles (Desde Backend Real)</p>
        </div>
        <button 
          onClick={fetchServices}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-[#0D1B4B] disabled:opacity-50 transition-colors"
          title="Refrescar datos"
        >
          <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#0D1B4B]" />
                      <span>Cargando servicios desde el servidor...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron servicios configurados en la base de datos.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.codigo} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {service.estado === 'ACTIVO' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
