import React from 'react';
import { useStore } from '../store/useStore';
import { Globe, Moon, Sun } from 'lucide-react';

export function SettingsComponent() {
  const { getTranslation, language, setLanguage } = useStore();
  const [theme, setTheme] = React.useState('light');
  const t = getTranslation();
  console.log(t.settings.languages['en']);
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.settings.title}</h1>
        <p className="text-gray-600">{t.settings.subtitle}</p>
      </div>

      <div className="grid gap-8">
        {/* Language Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <Globe className="text-gray-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold">{t.settings.language}</h2>
              <p className="text-gray-600">{t.settings.languageDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['en', 'es', 'fr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as 'en' | 'es' | 'fr')}
                className={`p-4 rounded-lg border ${
                  language === lang 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:border-blue-500'
                }`}
              >
                {t.settings.languages[lang as keyof typeof t.settings.languages]}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            {theme === 'light' ? (
              <Sun className="text-gray-400" size={24} />
            ) : (
              <Moon className="text-gray-400" size={24} />
            )}
            <div>
              <h2 className="text-xl font-semibold">{t.settings.theme}</h2>
              <p className="text-gray-600">{t.settings.themeDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-blue-500'
              }`}
            >
              {t.settings.light}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-blue-500'
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