import React, { useState } from 'react';
import { WindowsLogo } from '../UI/AppIcon';
import {
  signInUser,
  signUpUser,
  resetUserPassword,
  signInWithGoogle,
} from '../../services/firebase';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  onContinueAsGuest?: () => void;
}

type Mode = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onContinueAsGuest }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setIsOperationNotAllowed(false);
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (!err.message?.includes('popup-closed-by-user') && !err.code?.includes('cancelled-popup-request')) {
        setErrorMessage(translateFirebaseError(err.code || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOperationNotAllowed(false);

    if (!email.trim()) {
      setErrorMessage('Por favor ingresa un correo electrónico.');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetUserPassword(email.trim());
        setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      } catch (err: any) {
        console.error(err);
        setErrorMessage(translateFirebaseError(err.code || err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }

      try {
        setLoading(true);
        await signUpUser(email.trim(), password);
        onSuccess();
      } catch (err: any) {
        console.error(err);
        if ((err.code || err.message || '').includes('operation-not-allowed')) {
          setIsOperationNotAllowed(true);
        }
        setErrorMessage(translateFirebaseError(err.code || err.message));
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      try {
        setLoading(true);
        await signInUser(email.trim(), password);
        onSuccess();
      } catch (err: any) {
        console.error(err);
        if ((err.code || err.message || '').includes('operation-not-allowed')) {
          setIsOperationNotAllowed(true);
        }
        setErrorMessage(translateFirebaseError(err.code || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const translateFirebaseError = (code: string): string => {
    if (code.includes('auth/operation-not-allowed')) {
      return 'El proveedor de Correo/Contraseña no está activado en la consola de Firebase. Por favor inicia sesión directamente con el botón "Continuar con Google" de arriba.';
    }
    if (code.includes('auth/invalid-email')) return 'El formato del correo electrónico no es válido.';
    if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    }
    if (code.includes('auth/email-already-in-use')) return 'Este correo ya se encuentra registrado. Inicia sesión.';
    if (code.includes('auth/weak-password')) return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    if (code.includes('auth/too-many-requests')) return 'Demasiados intentos fallidos. Intenta más tarde.';
    return 'Ocurrió un error. Verifica tu conexión e inténtalo de nuevo.';
  };

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md p-8 rounded-3xl win-acrylic-dark border border-white/15 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Subtle accent glow behind logo */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Windows 11 Logo & Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4">
          <WindowsLogo size={28} />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-1">
          {mode === 'login' && 'Iniciar Sesión'}
          {mode === 'register' && 'Crear Escritorio Virtual'}
          {mode === 'forgot' && 'Recuperar Contraseña'}
        </h1>

        <p className="text-xs text-slate-300 max-w-xs mb-5">
          {mode === 'login' && 'Accede a tu escritorio personalizado sincronizado con Firebase.'}
          {mode === 'register' && 'Regístrate para guardar tus archivos, fondos y notas en la nube.'}
          {mode === 'forgot' && 'Ingresa tu correo para recibir las instrucciones de restablecimiento.'}
        </p>

        {/* One-click Google Sign-In Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs shadow-md flex items-center justify-center gap-3 transition-all active:scale-98 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span className="font-semibold text-slate-700">Continuar con Google</span>
        </button>

        <div className="w-full flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">o con correo</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* Error / Feedback */}
        {errorMessage && (
          <div className="w-full mb-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2 text-left animate-in slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>

            {isOperationNotAllowed && (
              <div className="pt-2 border-t border-red-500/20 text-[11px] text-red-300 flex flex-col gap-1.5">
                <span>
                  💡 <strong>Solución rápida:</strong> Haz clic arriba en <strong>"Continuar con Google"</strong> (ya está configurado y habilitado por defecto).
                </span>
                <span className="text-[10.5px] opacity-80">
                  Para usar correo/contraseña, habilita el proveedor en Firebase Console &gt; Authentication &gt; Sign-in method.
                </span>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="w-full mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5 text-left animate-in slide-in-from-top-1">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-xs outline-none focus:border-blue-500 focus:bg-white/15 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Password (if not forgot) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setIsOperationNotAllowed(false);
                    }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-xs outline-none focus:border-blue-500 focus:bg-white/15 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Confirm Password (register mode only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-xs outline-none focus:border-blue-500 focus:bg-white/15 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Procesando...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Entrar al escritorio'}
                  {mode === 'register' && 'Crear cuenta y entrar'}
                  {mode === 'forgot' && 'Enviar enlace'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher & Guest Option */}
        <div className="mt-5 pt-3 border-t border-white/10 w-full flex flex-col gap-2 text-xs">
          {mode === 'login' ? (
            <p className="text-slate-400">
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIsOperationNotAllowed(false);
                }}
                className="text-blue-400 font-semibold hover:underline"
              >
                Regístrate gratis
              </button>
            </p>
          ) : (
            <p className="text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIsOperationNotAllowed(false);
                }}
                className="text-blue-400 font-semibold hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          )}

          {/* Continue as guest fallback */}
          {onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="mt-1 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Continuar como invitado (probar sin iniciar sesión)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
