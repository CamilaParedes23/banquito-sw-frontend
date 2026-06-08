import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router';

import { Upload, CheckCircle, AlertTriangle, RefreshCw, Clock, Info, FileText } from 'lucide-react';

import { ConfigService, CatalogService } from '../../services/configService';

import { BatchService } from '../../services/batchService';

import { useAuth } from '../../context/AuthContext';

import { toast } from 'sonner';

import { ServiceTypeConfig } from '../../types';



export function BatchUpload() {

  const navigate = useNavigate();

  const { user } = useAuth();

  

  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);

  const [selectedService, setSelectedService] = useState('');

  const [accountNumber, setAccountNumber] = useState('');

  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  

  const [cutoffInfo, setCutoffInfo] = useState({

    horaCorte: '--:--',

    horaInicio: '--:--',

    isPastCutoff: false

  });



  useEffect(() => {

    const initData = async () => {

      try {

        const cutoffData = await ConfigService.getCutoffTimes();

        const now = new Date();

        const [hours, minutes] = cutoffData.horaCorteProceso.split(':').map(Number);

        const cutoff = new Date();

        cutoff.setHours(hours, minutes, 0);

        

        setCutoffInfo({

          horaCorte: cutoffData.horaCorteProceso,

          horaInicio: cutoffData.horaInicioLotesEncolados,

          isPastCutoff: now > cutoff

        });



        try {

          const types = await CatalogService.getServiceTypes();

          if (types && types.length > 0) {

            setServiceTypes(types);

            setSelectedService(types[0].codigo);

          } else {

            throw new Error('Catalogo vacio');

          }

        } catch {

          const fallbackTypes: ServiceTypeConfig[] = [

            { codigo: 'NOM', nombre: 'Pago de Nómina', descripcion: 'Sueldos y beneficios', estado: 'ACTIVO' },

            { codigo: 'PRV', nombre: 'Pago a Proveedores', descripcion: 'Obligaciones comerciales', estado: 'ACTIVO' }

          ];

          setServiceTypes(fallbackTypes);

          setSelectedService('NOM');

        }



      } catch {

      }

    };

    initData();

  }, []);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!file || !accountNumber || !selectedService) {

      toast.error('Por favor complete todos los campos');

      return;

    }



    setIsUploading(true);

    try {

      const formData = new FormData();

      formData.append('archivo', file);

      formData.append('tipoServicio', selectedService);

      formData.append('cuentaMatrizCargo', accountNumber);

      formData.append('canalIngreso', 'PORTAL_WEB');

      formData.append('rucEmpresa', user?.companyRuc || '');



      const response = await BatchService.uploadBatch(formData);

      if (response.uuidLote) {

        sessionStorage.setItem(`account_${response.uuidLote}`, accountNumber);

      }



      toast.success(`Lote ${response.uuidLote.substring(0,8)}... cargado correctamente.`);

      setTimeout(() => navigate('/batches'), 1500);

    } catch (error: unknown) {

      const message = error instanceof Error ? error.message : 'Error al procesar el archivo.';

      toast.error(message);

    } finally {

      setIsUploading(false);

    }

  };



  return (

    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-[#0D1B4B]">Nueva Operación</h1>

          <p className="text-gray-500 mt-1">Cargue su archivo de pagos masivos según el estándar del banco.</p>

        </div>

      </div>



      <div className={`p-5 rounded-xl border flex items-center gap-4 transition-all ${

        cutoffInfo.isPastCutoff ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'

      }`}>

        <div className={`p-3 rounded-full ${cutoffInfo.isPastCutoff ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>

          <Clock className="w-6 h-6" />

        </div>

        <div className="flex-1">

          <p className="text-sm font-bold text-gray-900">Horario de Procesamiento</p>

          <p className="text-xs text-gray-600">

            Corte para ejecución inmediata: <span className="font-bold">{cutoffInfo.horaCorte}</span>. 

            {cutoffInfo.isPastCutoff && ` Su lote será encolado para las ${cutoffInfo.horaInicio}.`}

          </p>

        </div>

      </div>



      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-sm text-blue-800 font-bold flex items-center gap-2">
          <Info className="w-4 h-4" /> Información
        </p>
        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
          El sistema lee automáticamente los valores de <strong>Tipo de Servicio</strong> y <strong>Cuenta Matriz de Cargo</strong> desde la cabecera de tu archivo. Los campos del formulario son de referencia para verificar que coincidan con la información del archivo.
        </p>
      </div>



      <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        <summary className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-50 select-none flex items-center gap-2">

          <FileText className="w-4 h-4" /> Formato Requerido del Archivo (CSV/TXT)

        </summary>

        <div className="px-6 pb-6 space-y-4 text-sm text-gray-700">

          <p className="text-xs text-gray-500">El archivo debe contener exactamente tres bloques estructurados:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">

              <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">1. Cabecera (1 línea · prefijo H)</p>

              <ul className="text-xs space-y-1 text-gray-600">

                <li>RUC Emisora</li>

                <li>Tipo de Servicio (NOM / PRV)</li>

                <li>Fecha/Hora Generación</li>

                <li>Cuenta Matriz de Cargo</li>

                <li>Total de Registros</li>

                <li>Monto Total de Control</li>

              </ul>

            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">

              <p className="text-[10px] font-bold text-green-600 uppercase mb-2">2. Detalle (N líneas · prefijo D)</p>

              <ul className="text-xs space-y-1 text-gray-600">

                <li>Secuencial</li>

                <li>Identificación Beneficiario</li>

                <li>Nombre Beneficiario</li>

                <li>Cuenta Destino</li>

                <li>Monto a Transferir</li>

                <li>Referencia / Concepto</li>

                <li>Correo de Notificación</li>

              </ul>

            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">

              <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">3. Pie de Control (1 línea · prefijo P)</p>

              <ul className="text-xs space-y-1 text-gray-600">

                <li>Hash / Código de Seguridad</li>

                <li>Suma de Verificación (montos + registros)</li>

              </ul>

            </div>

          </div>

        </div>

      </details>



      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">

            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Servicio del Lote</label>

            <div className="flex flex-col gap-2">

              {serviceTypes.map((type) => (

                <label key={type.codigo} className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${

                  selectedService === type.codigo ? 'border-[#C9A84C] bg-amber-50' : 'border-gray-100 hover:border-gray-300'

                }`}>

                  <div className="flex items-center gap-3">

                    <input 

                      type="radio" 

                      name="service" 

                      value={type.codigo} 

                      checked={selectedService === type.codigo}

                      onChange={(e) => setSelectedService(e.target.value)}

                      className="accent-[#0D1B4B]"

                    />

                    <div>

                      <p className="text-sm font-bold text-[#0D1B4B]">

                        {type.codigo === 'NOM' ? 'Pago de Nómina' : 

                         type.codigo === 'PRV' ? 'Pago a Proveedores' : type.nombre}

                      </p>

                      <p className="text-[10px] text-gray-500">

                        {type.codigo === 'NOM' ? 'Dispersión masiva de sueldos y beneficios a empleados.' : 

                         type.codigo === 'PRV' ? 'Liquidación masiva de obligaciones comerciales a proveedores.' : type.descripcion}

                      </p>

                    </div>

                  </div>

                </label>

              ))}

            </div>

          </div>



          <div className="space-y-6">

            <div className="space-y-4">

              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Cuenta de Cargo</label>

              <input

                type="text"

                value={accountNumber}

                onChange={(e) => setAccountNumber(e.target.value)}

                placeholder="0010001234567890"

                className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0D1B4B] transition-all font-mono text-sm"

                required

              />

            </div>



            <div className="space-y-4">

              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Archivo (CSV/TXT)</label>

              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${

                file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#0D1B4B]'

              }`}>

                <input type="file" accept=".txt,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-green-600' : 'text-gray-300'}`} />

                <p className="text-sm text-gray-600">

                  {file ? <span className="font-bold text-green-700">{file.name}</span> : 'Arrastre su archivo aquí o haga clic'}

                </p>

              </div>

            </div>

          </div>

        </div>



        <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">

          <button type="button" onClick={() => navigate('/batches')} className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>

          <button 

            type="submit" 

            disabled={!file || !accountNumber || isUploading}

            className="px-10 py-3 bg-[#0D1B4B] text-white rounded-lg font-bold shadow-lg hover:bg-[#1e3a8a] disabled:opacity-20 transition-all flex items-center gap-3"

          >

            {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}

            {isUploading ? 'Procesando...' : 'Cargar Lote'}

          </button>

        </div>

      </form>

    </div>

  );

}

