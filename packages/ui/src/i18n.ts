import { id } from './locales/id';
import { en } from './locales/en';

export type Language = 'id' | 'en';
export type TranslationKey = keyof typeof id;

type LocaleData = typeof id;

const STORAGE_KEY = 'niagantara-language';

interface LocaleStore {
  id: LocaleData;
  en: LocaleData;
}

const loadedLocales: LocaleStore = {
  id,
  en: en as unknown as LocaleData,
};

export function getDefaultLanguage(): Language {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && (stored === 'id' || stored === 'en')) {
    return stored;
  }
  const browserLang = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'id';
}

export function setLanguage(lang: Language): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('language-change', { detail: { language: lang } }));
  }
}

export function getLanguage(): Language {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'id' ? stored : getDefaultLanguage();
}

export function getTranslations(lang: Language = getLanguage()): LocaleData {
  return loadedLocales[lang] ?? loadedLocales.id;
}

export function t(key: string, lang: Language = getLanguage()): string {
  const keys = key.split('.');
  let value: any = loadedLocales[lang] ?? loadedLocales.id;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  return value ?? key;
}

import { useState, useEffect, useCallback } from 'react';

export function useTranslation(lang?: Language) {
  const [language, setLanguageState] = useState<Language>(lang ?? getLanguage());

  useEffect(() => {
    if (lang) setLanguageState(lang);

    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail.language as Language;
      if (newLang === 'id' || newLang === 'en') setLanguageState(newLang);
    };

    window.addEventListener('language-change', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('language-change', handleLanguageChange as EventListener);
    };
  }, [lang]);

  const translations = getTranslations(language);
  const translate = useCallback((key: string) => t(key, language), [language]);

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
