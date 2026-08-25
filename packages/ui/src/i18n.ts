import { en } from './locales/en';
import { id } from './locales/id';

export type Language = 'id' | 'en';
export type TranslationKey = keyof typeof en;

const translations = { id, en };
const STORAGE_KEY = 'niagantara-language';

export function getDefaultLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && (stored === 'id' || stored === 'en')) {
    return stored;
  }
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'id';
}

export function setLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent('language-change', { detail: { language: lang } }));
}

export function getLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY) as Language || getDefaultLanguage();
}

export function getTranslations(lang: Language = getLanguage()) {
  return translations[lang];
}

export function t(key: string, lang: Language = getLanguage()): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  return value ?? key;
}

import { useState, useEffect } from 'react';

export function useTranslation(lang?: Language) {
  const [language, setLanguageState] = useState<Language>(getDefaultLanguage());

  useEffect(() => {
    const currentLang = lang ?? getLanguage();
    setLanguageState(currentLang);

    const handleLanguageChange = (e: CustomEvent) => {
      setLanguageState(e.detail.language);
    };

    window.addEventListener('language-change', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('language-change', handleLanguageChange as EventListener);
    };
  }, [lang]);

  const translations = getTranslations(language);
  const translate = (key: string) => t(key, language);

  return {
    language,
    translations,
    t: translate,
    setLanguage: (newLang: Language) => {
      setLanguage(newLang);
      setLanguageState(newLang);
    },
  };
}
