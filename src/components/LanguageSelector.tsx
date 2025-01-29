import React from 'react';
import { Languages } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Language } from '../types';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useStore();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ];

  return (
    <div className="relative">
      <Languages
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-white"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};