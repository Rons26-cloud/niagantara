import React from 'react';
import { useTranslation, Language } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
}

export function LanguageSwitcher({
  className = '',
  ariaLabel = 'Switch language',
  compact = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'id', label: 'ID', native: 'Bahasa Indonesia' },
    { code: 'en', label: 'EN', native: 'English' },
  ];

  if (compact) {
    return (
      <div className={`language-switcher compact ${className}`.trim()}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={language === lang.code ? 'active' : ''}
            onClick={() => setLanguage(lang.code)}
            aria-label={ariaLabel}
            title={lang.native}
          >
            {lang.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-switcher ${className}`.trim()}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={ariaLabel}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native}
          </option>
        ))}
      </select>
    </div>
  );
}
