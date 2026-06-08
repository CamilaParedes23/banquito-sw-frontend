import { AlertCircle } from 'lucide-react';



interface BatchActionsProps {

  estado?: string;

  userRole?: string;

  isLoading?: boolean;

  successfulLinesCount?: number;

  onAnnul: () => void;

}



export function BatchActions({ estado, userRole, isLoading = false, successfulLinesCount = 0, onAnnul }: BatchActionsProps) {

  const canAnnul = userRole === 'OPERADOR' || userRole === 'ADMIN';



  const handleAnnul = () => {

    if (!isLoading) onAnnul();

  };



  const hasAnyAction = canAnnul;

  

  if (!hasAnyAction) return null;

  

  return (

    <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-6">

      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">

        <AlertCircle className="w-4 h-4" /> Acciones de Control Operativo

      </h3>

      <div className="flex flex-wrap gap-4">

        {['RECIBIDO', 'VALIDADO', 'ENCOLADO', 'VALIDANDO', 'RECHAZADO'].includes(estado || '') && canAnnul && (

          <button

            onClick={handleAnnul}

            disabled={isLoading}

            className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"

          >

            {isLoading ? (

              <>

                <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                </svg>

                Anulando...

              </>

            ) : (

              <>

                <AlertCircle className="w-5 h-5" /> Anular Operación

              </>

            )}

          </button>

        )}

      </div>

    </div>

  );

}

