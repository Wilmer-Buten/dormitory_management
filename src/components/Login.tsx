import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import ouLogo from '../assets/ou_logo.webp'
import tempLogo from '../assets/temp_logo.webp'
import CopyrightText from './CopyrightText';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, getTranslation, isLoading, setIsLoading } = useStore();
  const t = getTranslation();

  useEffect(() => {
    isLoading && setIsLoading(false);
  },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-oakwood-blue px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className={`relative ${isLoading ? 'select-none' : ''}`}>
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl transition-all duration-300 ease-in-out">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-oakwood-gold-200 animate-[spin_1.5s_linear_infinite]" />
                <div className="w-12 h-12 rounded-full border-4 border-oakwood-gold border-t-transparent animate-[spin_1.2s_linear_infinite] absolute inset-0" />
                <div className="w-12 h-12 rounded-full border-4 border-transparent border-l-oakwood-gold-300 animate-[spin_2s_linear_infinite] absolute inset-0" />
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl border-2 border-oakwood-gold px-6 py-9 sm:px-10 sm:py-10">
            <div className="flex justify-center items-center gap-6 mb-6">
              <img
                src={ouLogo}
                alt="Oakwood University Logo"
                className="h-auto w-auto max-h-16 max-w-16 sm:max-h-20 sm:max-w-20 object-contain"
                loading="lazy"
              />
              <div className="w-px h-12 bg-slate-200" />
              <img
                src={tempLogo}
                alt="University Building Logo"
                className="h-auto w-auto max-h-20 max-w-20 sm:max-h-24 sm:max-w-24 object-contain"
                loading="lazy"
              />
            </div>

            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t.auth.signIn}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">DormControl · Dormitory Management</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  {t.auth.emailOrUsername}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="email-address"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-icon"
                    placeholder={t.auth.emailOrUsername}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-icon"
                    placeholder={t.auth.password}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3.5 py-2.5 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`btn-primary btn-md w-full mt-2 ${isLoading ? 'cursor-not-allowed' : ''}`}
              >
                <LogIn size={18} className={isLoading ? 'opacity-0' : ''} aria-hidden="true" />
                {t.auth.signIn}
              </button>
            </form>
          </div>

          <div className="mt-6">
            <CopyrightText />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
