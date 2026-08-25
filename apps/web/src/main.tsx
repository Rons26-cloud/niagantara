import { StrictMode, Suspense, lazy, useEffect } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@niagantara/ui/theme';
import { BrandLogo, getLanguage } from '@niagantara/ui';
import { NavigateProvider, usePath, Seo, navigate } from './router';
import { HomePage } from './pages';
import './styles.css';
import './theme-overrides.css';

initTheme();
document.documentElement.lang = getLanguage();

const FeaturesPage = lazy(() => import('./pages').then((m) => ({ default: m.FeaturesPage })));
const SolutionsPage = lazy(() => import('./pages').then((m) => ({ default: m.SolutionsPage })));
const PricingPage = lazy(() => import('./pages').then((m) => ({ default: m.PricingPage })));
const AboutPage = lazy(() => import('./pages').then((m) => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('./pages').then((m) => ({ default: m.FaqPage })));
const ContactPage = lazy(() => import('./pages').then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('./legal').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./legal').then((m) => ({ default: m.TermsPage })));
const DemoApp = lazy(() =>
  import('./demo/demo-app').then((m) => ({ default: m.DemoApp })),
);

const lazyRoutes: Record<string, ComponentType> = {
  '/fitur': FeaturesPage,
  '/solusi': SolutionsPage,
  '/harga': PricingPage,
  '/tentang': AboutPage,
  '/faq': FaqPage,
  '/kontak': ContactPage,
  '/privacy': PrivacyPage,
  '/terms': TermsPage,
};

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

  if (path.startsWith('/demo')) {
    return (
      <NavigateProvider value={navigate}>
        <Seo path={path} />
        <DemoRoute />
      </NavigateProvider>
    );
  }

  if (path === '/' || path === '/index.html') {
    return (
      <NavigateProvider value={navigate}>
        <Seo path={path} />
        <HomePage />
      </NavigateProvider>
    );
  }

  const LazyPage = lazyRoutes[path];
  if (LazyPage) {
    return (
      <NavigateProvider value={navigate}>
        <Seo path={path} />
        <Suspense fallback={<PageFallback />}>
          <LazyPage />
        </Suspense>
      </NavigateProvider>
    );
  }

  return (
    <NavigateProvider value={navigate}>
      <Seo path={path} />
      <NotFound />
    </NavigateProvider>
  );
}

function PageFallback() {
  return (
    <div className="site">
      <main className="legal">
        <div className="container" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BrandLogo />
        </div>
      </main>
    </div>
  );
}

function DemoRoute() {
  return (
    <Suspense
      fallback={
        <div className="site">
          <main className="legal">
            <div className="container" style={{ textAlign: 'center' }}>
              <BrandLogo />
              <p style={{ marginTop: 24 }}>…</p>
            </div>
          </main>
        </div>
      }
    >
      <DemoApp />
    </Suspense>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = 'Halaman Tidak Ditemukan — NIAGANTARA';
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';
    return () => { robots!.content = 'index, follow'; };
  }, []);

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
