/**
 * Theme Management for NIAGANTARA
 * Handles theme switching (light/blue-dark) and persistence
 */

export type Theme = 'light' | 'blue';

const STORAGE_KEY = 'niagantara-theme';

/**
 * Get default theme based on browser preference or default to light
 */
export function getDefaultTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && (stored === 'light' || stored === 'blue')) {
    return stored;
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'blue';
  }

  return 'light'; // Default to light theme
}

/**
 * Set theme preference
 */
export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'blue' ? '#0F172A' : '#F8FAFC');
  }
  
  // Dispatch event for components to react
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
}

/**
 * Get current theme
 */
export function getTheme(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) || getDefaultTheme();
}

/**
 * Initialize theme on app load
 */
export function initTheme(): void {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'blue' ? '#0F172A' : '#F8FAFC');
  }
}

/**
 * React hook for theme
 */
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

// Import React for the hook
import { useState, useEffect } from 'react';