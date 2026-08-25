import { id } from './locales/id';

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
  en: id as unknown as LocaleData,
};
let enPromise: Promise<LocaleData> | null = null;

function loadEn(): Promise<LocaleData> {
  if (!enPromise) {
    enPromise = import('./locales/en').then((m) => {
      loadedLocales.en = m.en as unknown as LocaleData;
      return m.en as unknown as LocaleData;
    });
  }
  return enPromise;
}

if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')) {
  loadEn();
}

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
  if (lang === 'en') loadEn();
  window.dispatchEvent(new CustomEvent('language-change', { detail: { language: lang } }));
}

export function getLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY) as Language || getDefaultLanguage();
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
  const [language, setLanguageState] = useState<Language>(getDefaultLanguage());
  const [, setTick] = useState(0);

  useEffect(() => {
    const currentLang = lang ?? getLanguage();
    setLanguageState(currentLang);
    if (currentLang === 'en') {
      loadEn().then(() => setTick((t) => t + 1));
    }

    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail.language as Language;
      setLanguageState(newLang);
      if (newLang === 'en') {
        loadEn().then(() => setTick((t) => t + 1));
      }
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
