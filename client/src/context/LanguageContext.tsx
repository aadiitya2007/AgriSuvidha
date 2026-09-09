import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';
import { mr } from '../i18n/mr';

type Language = 'en' | 'hi' | 'mr';
type TranslationType = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('agrisuvidha_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrisuvidha_lang', lang);
  };

  const t = language === 'hi' ? hi : language === 'mr' ? mr : en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
