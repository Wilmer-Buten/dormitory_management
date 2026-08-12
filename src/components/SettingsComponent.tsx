import React from 'react';
import { useStore } from '../store/useStore';
import { Globe, Moon, Sun } from 'lucide-react';

export function SettingsComponent() {
  const { getTranslation, language, setLanguage } = useStore();
  const [theme, setTheme] = React.useState('light');
  const t = getTranslation();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.settings.title}</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">{t.settings.subtitle}</p>
      </div>

      <div className="grid gap-5 max-w-2xl">
        {/* Language Settings */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Globe size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{t.settings.language}</h2>
              <p className="text-slate-500 text-sm">{t.settings.languageDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['en', 'es', 'fr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as 'en' | 'es' | 'fr')}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  language === lang
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {t.settings.languages[lang as keyof typeof t.settings.languages]}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              {theme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{t.settings.theme}</h2>
              <p className="text-slate-500 text-sm">{t.settings.themeDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t.settings.light}
            </button>
            <button
              disabled
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t.settings.dark}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
