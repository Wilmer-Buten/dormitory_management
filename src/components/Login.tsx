import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { LogIn } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 relative ${isLoading ? 'select-none' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-200 animate-[spin_1.5s_linear_infinite]" />
              <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_1.2s_linear_infinite] absolute inset-0" />
              <div className="w-12 h-12 rounded-full border-4 border-transparent border-l-blue-300 animate-[spin_2s_linear_infinite] absolute inset-0" />
            </div>
          </div>
        )}
        <div className="flex justify-center items-center gap-8 mb-6">
          <img
            src={ouLogo}
            alt="Oakwood University Logo"
            className="h-auto w-auto max-h-28 max-w-28 object-contain"
            loading="lazy"
          />
          <img
            src={tempLogo}
            alt="University Building Logo"
            className="h-auto w-auto max-h-32 max-w-32 object-contain"
            loading="lazy"
          />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.auth.signIn}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t.auth.email}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder={t.auth.email}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t.auth.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder={t.auth.password}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                isLoading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className={`h-5 w-5 text-blue-500 transition-colors duration-200 ${
                  isLoading ? 'opacity-0' : 'group-hover:text-blue-400'
                }`} aria-hidden="true" />
              </span>
              {t.auth.signIn}
            </button>
          </div>
        </form>
        <div className="absolute bottom left-0 right-0">
          <CopyrightText />
        </div>
      </div>
    </div>
  );
}

export default Login;