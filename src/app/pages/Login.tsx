import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight, Shield, Zap, CheckCircle } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0D1B4B] via-[#1a2d5f] to-[#0D1B4B] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#d4b962] flex items-center justify-center shadow-2xl">
              <span className="text-2xl font-bold text-[#0D1B4B]">BQ</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">BanQuito</h1>
              <p className="text-blue-200 text-sm">Switch de Pagos</p>
            </div>
          </div>

          {/* Título principal */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
              Gestión de<br />Pagos Masivos
            </h2>
            <p className="text-xl text-blue-200">
              Plataforma segura y eficiente para procesar sus transacciones
            </p>
          </div>

          {/* Características */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Seguridad Garantizada</h3>
                <p className="text-blue-200 text-sm">Protección de datos con estándares bancarios</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Procesamiento Rápido</h3>
                <p className="text-blue-200 text-sm">Carga y validación de lotes en tiempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Control Total</h3>
                <p className="text-blue-200 text-sm">Seguimiento completo de sus operaciones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-blue-200 text-sm">
          © 2026 BanQuito. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#d4b962] flex items-center justify-center shadow-xl">
              <span className="text-xl font-bold text-[#0D1B4B]">BQ</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0D1B4B]">BanQuito</h1>
              <p className="text-gray-600 text-sm">Switch de Pagos</p>
            </div>
          </div>

          {/* Card del formulario */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#0D1B4B] mb-2">Bienvenido</h2>
              <p className="text-gray-600">Ingrese sus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10b981] focus:bg-white text-gray-900 placeholder-gray-400 transition-all"
                    placeholder="Ingrese su usuario"
                    required
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10b981] focus:bg-white text-gray-900 placeholder-gray-400 transition-all"
                    placeholder="Ingrese su contraseña"
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info adicional */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Problemas para acceder? Contacte al administrador
          </p>
        </div>
      </div>
    </div>
  );
}
