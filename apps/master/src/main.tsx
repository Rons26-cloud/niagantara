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
    <div className="master">
      <div className="master-header">
        <BrandLogo />
        <div className="master-controls">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
        </div>
      </div>
      <main className="master-body">
        <div className="badge" aria-hidden="true">N</div>
        <p className="eyebrow">{t('master.control')}</p>
        <h1>NIAGANTARA</h1>
        <p className="tagline">{t('master.tagline')}</p>
        <div className="status">{t('master.phaseStatus')}</div>
        <section className="integration">
          <h2>{t('master.sheets.title')}</h2>
          <p>{t('master.sheets.text')}</p>
          <span>{t('master.sheets.note')}</span>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
