export type Theme = 'light' | 'blue';

const STORAGE_KEY = 'niagantara-theme';

export function getDefaultTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && (stored === 'light' || stored === 'blue')) {
    return stored;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'blue';
  }
  return 'light';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'blue' ? '#0F172A' : '#F8FAFC');
  }
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
}

export function getTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) || getDefaultTheme();
}

export function initTheme(): void {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'blue' ? '#0F172A' : '#F8FAFC');
  }
}

import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getDefaultTheme());

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);

    const handleThemeChange = (e: CustomEvent) => {
      setThemeState(e.detail.theme);
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'blue' : 'light';
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      setThemeState(newTheme);
    },
    toggleTheme,
  };
}
