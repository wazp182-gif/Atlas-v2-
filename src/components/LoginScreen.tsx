import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/operaciones';

export function LoginScreen() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [selectedRol, setSelectedRol] = useState<UserRole>('operador');
  const [sucursal, setSucursal] = useState('suc-central');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!nombre.trim()) throw new Error('Ingresa tu nombre completo.');
        await registerWithEmail(email, password, nombre, selectedRol, sucursal);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.code === 'auth/user-not-found'
          ? 'No existe usuario con este correo.'
          : err.code === 'auth/wrong-password'
          ? 'Contraseña incorrecta.'
          : err.code === 'auth/email-already-in-use'
          ? 'El correo ya está registrado en Operaciones LCT.'
          : err.message || 'Error en autenticación segura.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType: UserRole, demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const demoPass = 'OperacionesLCT2026!';
      const roleNames: Record<string, string> = {
        super_admin: 'Dirección General (SuperAdmin)',
        admin_zona: 'Gerente Regional Norte',
        operador: 'Capitán de Turno Operativo',
        operador_cocina: 'Chef Líder de Cocina',
        operador_produccion: 'Supervisor de Producción',
      };
      
      try {
        await loginWithEmail(demoEmail, demoPass);
      } catch (loginErr) {
        await registerWithEmail(demoEmail, demoPass, roleNames[roleType] || 'Usuario Operaciones', roleType, 'suc-central');
      }
    } catch (err: any) {
      console.warn('Quick login notice:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Background visual geometry */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
        {/* Security Badge Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OPERACIONES LCT • SISTEMA BLINDADO RBAC</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Control Operativo Central
          </h1>
          <p className="text-xs text-zinc-400">
            {isRegister
              ? 'Alta de personal y asignación de permisos de sucursal'
              : 'Acceso seguro con cifrado y bitácora de auditoría inmutable'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre Completo:
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Ing. Carlos Valencia"
                className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@operaciones-lct.com"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Contraseña de Acceso:
            </label>
            <div className="relative">
              <KeyRound className="h-4 w-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs pl-9 pr-9 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Rol Operativo (RBAC):
                </label>
                <select
                  value={selectedRol}
                  onChange={(e) => setSelectedRol(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="operador">Capitán / Operador de Sucursal</option>
                  <option value="operador_cocina">Operador de Cocina</option>
                  <option value="operador_produccion">Operador de Producción</option>
                  <option value="admin_zona">Administrador de Zona / Regional</option>
                  <option value="admin_zona_cocina">Admin de Zona Cocina</option>
                  <option value="admin_zona_produccion">Admin de Zona Producción</option>
                  <option value="admin">Administrador General</option>
                  <option value="super_admin">Super Administrador (Acceso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Sucursal Base:
                </label>
                <select
                  value={sucursal}
                  onChange={(e) => setSucursal(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="suc-central">Sucursal Central - Matriz</option>
                  <option value="suc-norte">Sucursal Zona Norte</option>
                  <option value="suc-sur">Sucursal Zona Sur</option>
                  <option value="suc-oriente">Sucursal Oriente</option>
                  <option value="suc-poniente">Sucursal Poniente</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Registrar Usuario Seguro' : 'Ingresar al Sistema'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            O autenticación corporativa
          </span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.54 0 2.93.56 4.01 1.48l3.01-3.01C17.2 1.8 14.77 1 12 1 7.42 1 3.52 3.61 1.63 7.37l3.66 2.84C6.18 7.31 8.84 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.28c0-.8-.07-1.57-.2-2.28H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.86c2.15-1.99 3.74-4.91 3.74-8.67z"
            />
            <path
              fill="#FBBC05"
              d="M5.29 14.79c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.63 7.55C.59 9.64 0 11.99 0 14.5s.59 4.86 1.63 6.95l3.66-2.84z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.92l-3.68-2.86c-1.08.73-2.46 1.16-4.25 1.16-3.16 0-5.82-2.31-6.71-5.21L1.63 15.99C3.52 19.76 7.42 23 12 23z"
            />
          </svg>
          <span>Acceder con Google Workspace</span>
        </button>

        {/* Quick Demo Role Switcher for instant testing */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Acceso Rápido por Perfil (Entorno de Demostración):
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('super_admin', 'superadmin@operaciones-lct.com')}
              className="px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-cyan-950 border border-zinc-700/60 hover:border-cyan-500/40 text-[11px] text-zinc-300 text-left transition-colors cursor-pointer"
            >
              👑 <span className="font-semibold text-cyan-300">Super Admin</span> (Matriz)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin_zona', 'regional@operaciones-lct.com')}
              className="px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-cyan-950 border border-zinc-700/60 hover:border-cyan-500/40 text-[11px] text-zinc-300 text-left transition-colors cursor-pointer"
            >
              🏢 <span className="font-semibold text-cyan-300">Admin Zona</span> (Multi-sucursal)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('operador', 'capitan@operaciones-lct.com')}
              className="px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-cyan-950 border border-zinc-700/60 hover:border-cyan-500/40 text-[11px] text-zinc-300 text-left transition-colors cursor-pointer"
            >
              🧑‍💼 <span className="font-semibold text-cyan-300">Capitán</span> (Caja & Ventas)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('operador_cocina', 'cocina@operaciones-lct.com')}
              className="px-2 py-1.5 rounded bg-zinc-800/60 hover:bg-cyan-950 border border-zinc-700/60 hover:border-cyan-500/40 text-[11px] text-zinc-300 text-left transition-colors cursor-pointer"
            >
              🍳 <span className="font-semibold text-cyan-300">Cocina</span> (Checklists & PEPS)
            </button>
          </div>
        </div>

        {/* Toggle Login/Register */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {isRegister
              ? '¿Ya tienes credenciales? Iniciar sesión'
              : '¿Crear nuevo usuario operativo? Registrar aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
