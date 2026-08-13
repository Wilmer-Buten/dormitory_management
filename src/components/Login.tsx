import React, { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import ouLogo from "../assets/ou_logo.webp";
import tempLogo from "../assets/temp_logo.webp";
import CopyrightText from "./CopyrightText";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, getTranslation, isLoading, setIsLoading } = useStore();
  const t = getTranslation();

  useEffect(() => {
    isLoading && setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans">
      {/* Brand panel — desktop */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-oakwood-blue-dark px-12 xl:px-16 py-12 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 20%, rgba(212,165,116,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(30,91,198,0.55), transparent 50%), linear-gradient(160deg, #001F5B 0%, #003DA5 55%, #001842 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -bottom-24 w-[28rem] h-[28rem] rounded-full border border-oakwood-gold/20" />
        <div className="pointer-events-none absolute -right-8 -bottom-8 w-[18rem] h-[18rem] rounded-full border border-oakwood-gold/15" />

        <div className="relative z-10 flex items-center gap-4 animate-fade-in">
          <img
            src={ouLogo}
            alt="Oakwood University"
            className="h-14 w-14 object-contain drop-shadow-md"
            loading="eager"
          />
          <div className="w-px h-10 bg-white/25" />
          <img
            src={tempLogo}
            alt="DormControl"
            className="h-16 w-16 object-contain drop-shadow-md"
            loading="eager"
          />
        </div>

        <div className="relative z-10 max-w-md animate-slide-up">
          <p className="text-oakwood-gold-light text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            Oakwood University
          </p>
          <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight text-white">
            DormControl
          </h1>
          <div className="mt-5 h-0.5 w-16 bg-oakwood-gold rounded-full" />
          <p className="mt-6 text-lg text-white/75 leading-relaxed">
            Residence life management — attendance, clean checks, and dorm operations in one place.
          </p>
        </div>

        <div className="relative z-10 text-white/45 text-sm animate-fade-in">
          <p>© {new Date().getFullYear()} Wilmer Buten · All rights reserved</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col justify-center px-5 sm:px-8 md:px-12 py-10 sm:py-14 bg-[#F4F7FB]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0,61,165,0.07), transparent 55%), radial-gradient(ellipse 50% 35% at 0% 100%, rgba(212,165,116,0.12), transparent 50%)",
          }}
        />

        <div className={`relative z-10 w-full max-w-[26rem] mx-auto ${isLoading ? "select-none" : ""}`}>
          {/* Mobile brand */}
          <div className="lg:hidden mb-10 text-center animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-5">
              <img src={ouLogo} alt="Oakwood University" className="h-12 w-12 object-contain" loading="eager" />
              <div className="w-px h-10 bg-slate-200" />
              <img src={tempLogo} alt="DormControl" className="h-14 w-14 object-contain" loading="eager" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-oakwood-blue-dark tracking-tight">
              DormControl
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Oakwood University · Residence Life</p>
          </div>

          <div className="relative animate-slide-up">
            {isLoading && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-full border-[3px] border-oakwood-gold-200 animate-[spin_1.5s_linear_infinite]" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-oakwood-gold border-t-transparent animate-[spin_1.1s_linear_infinite]" />
                </div>
              </div>
            )}

            <div className="hidden lg:block mb-8">
              <h2 className="font-display text-3xl font-semibold text-oakwood-blue-dark tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-slate-500 text-[0.95rem]">{t.auth.signIn}</p>
            </div>

            <div className="lg:hidden mb-6 text-center">
              <h2 className="text-lg font-semibold text-slate-800">{t.auth.signIn}</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="label text-slate-700">
                  {t.auth.emailOrUsername}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden />
                  <input
                    id="email-address"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-icon h-12 bg-white border-slate-200/90 shadow-sm focus:border-oakwood-blue/40 focus:ring-oakwood-blue/20"
                    placeholder={t.auth.emailOrUsername}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label text-slate-700">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-icon h-12 pr-11 bg-white border-slate-200/90 shadow-sm focus:border-oakwood-blue/40 focus:ring-oakwood-blue/20"
                    placeholder={t.auth.password}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3.5 py-3 animate-fade-in"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`btn-primary btn-md w-full h-12 mt-1 text-[0.95rem] bg-oakwood-blue hover:bg-oakwood-blue-dark shadow-md shadow-oakwood-blue/20 ${
                  isLoading ? "cursor-not-allowed" : ""
                }`}
              >
                <LogIn size={18} className={isLoading ? "opacity-0" : ""} aria-hidden />
                {t.auth.signIn}
              </button>
            </form>
          </div>

          <div className="mt-10 lg:mt-12">
            <CopyrightText className="text-slate-400" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
