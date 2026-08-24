import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@niagantara/ui/theme';
import {
  BrandLogo,
  ThemeSwitcher,
  LanguageSwitcher,
  useTranslation,
} from '@niagantara/ui';
import './styles.css';
import './theme-overrides.css';

initTheme();

function App() {
  const { t } = useTranslation();
  return (
    <div className="pos">
      <div className="pos-header">
        <BrandLogo />
        <div className="pos-controls">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
        </div>
      </div>
      <main className="pos-body">
        <div className="badge" aria-hidden="true">▦</div>
        <p className="eyebrow">{t('pages.pos')}</p>
        <h1>{t('pos.title')}</h1>
        <p className="tagline">{t('pos.tagline')}</p>
        <button type="button">{t('pos.startShift')}</button>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
