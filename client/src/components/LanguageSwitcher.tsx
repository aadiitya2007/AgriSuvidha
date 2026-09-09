import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
      <Globe className="w-4 h-4 text-slate-500 ml-1" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'en'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'hi'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          language === 'mr'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        मराठी
      </button>
    </div>
  );
};
