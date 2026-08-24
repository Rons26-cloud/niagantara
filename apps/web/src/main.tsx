import { StrictMode } from 'react';
import type { JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@niagantara/ui/theme';
import { BrandLogo, getLanguage, useTranslation } from '@niagantara/ui';
import { NavigateProvider, usePath, Seo, navigate } from './router';
import { HomePage, FeaturesPage, SolutionsPage, PricingPage, AboutPage, FaqPage, ContactPage } from './pages';
import { PrivacyPage, TermsPage } from './legal';
import './styles.css';
import './theme-overrides.css';

initTheme();
document.documentElement.lang = getLanguage();

const routes: Record<string, () => JSX.Element> = {
  '/': HomePage,
  '/index.html': HomePage,
  '/fitur': FeaturesPage,
  '/solusi': SolutionsPage,
  '/harga': PricingPage,
  '/tentang': AboutPage,
  '/faq': FaqPage,
  '/kontak': ContactPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
};

/** Legacy English slugs kept working; canonicals point to Indonesian paths. */
const legacyAliases: Record<string, string> = {
  '/features': '/fitur',
  '/solutions': '/solusi',
  '/pricing': '/harga',
  '/about': '/tentang',
  '/contact': '/kontak',
};

function App() {
  const rawPath = usePath();
  const path = legacyAliases[rawPath] ?? rawPath;
  const Page = routes[path] ?? NotFound;
  return (
    <NavigateProvider value={navigate}>
      <Seo path={path} />
      <Page />
    </NavigateProvider>
  );
}

function NotFound() {
  return (
    <div className="site">
      <main className="legal">
        <div className="container" style={{ textAlign: 'center' }}>
          <BrandLogo />
          <h1>404</h1>
          <p>Halaman tidak ditemukan.</p>
          <p><a className="back" href="/">← Kembali ke beranda</a></p>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
