import { useState } from 'react';
import type { ReactNode } from 'react';
import { BrandLogo, ThemeSwitcher, LanguageSwitcher, useTranslation } from '@niagantara/ui';
import { Link, usePath } from './router';

export function Navbar() {
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);
  const { t } = useTranslation();
  const path = usePath();
  const items: [string, string][] = [
    ['/', t('nav.home')],
    ['/fitur', t('nav.features')],
    ['/solusi', t('nav.solutions')],
    ['/harga', t('nav.pricing')],
    ['/tentang', t('nav.about')],
    ['/faq', t('nav.faq')],
    ['/kontak', t('nav.contact')],
  ];
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <BrandLogo href="/" />
        <nav className={menu ? 'nav-open' : ''} aria-label={t('nav.primary')}>
          {items.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              onClick={close}
              ariaCurrent={path === to ? 'page' : undefined}
              className={path === to ? 'active' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
          <a className="login" href="https://niagantara-app.pages.dev">
            {t('auth.login')}
          </a>
          <Link className="nav-cta" to="/harga">
            {t('nav.trial')} <span>→</span>
          </Link>
        </div>
        <button
          className="menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-label={t('nav.menu')}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <BrandLogo />
          <p>{t('website.footer.tagline')}</p>
          <small>{t('website.footer.rights')}</small>
        </div>
        <div>
          <h4>{t('website.footer.productsHeading')}</h4>
          <Link to="/solusi">{t('website.footer.pos')}</Link>
          <Link to="/solusi">{t('website.footer.inventory')}</Link>
          <Link to="/fitur">{t('website.footer.finance')}</Link>
          <Link to="/fitur">{t('website.footer.reports')}</Link>
          <Link to="/solusi">{t('website.footer.sheets')}</Link>
        </div>
        <div>
          <h4>{t('website.footer.companyHeading')}</h4>
          <Link to="/tentang">{t('website.footer.about')}</Link>
          <Link to="/kontak">{t('website.footer.contact')}</Link>
        </div>
        <div>
          <h4>{t('website.footer.helpHeading')}</h4>
          <Link to="/faq">{t('website.footer.faq')}</Link>
          <a href="mailto:support@niagantara.com">{t('website.footer.helpCenter')}</a>
        </div>
        <div>
          <h4>{t('website.footer.legalHeading')}</h4>
          <Link to="/privacy">{t('website.footer.privacy')}</Link>
          <Link to="/terms">{t('website.footer.terms')}</Link>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="site">
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Button({
  children,
  secondary = false,
  to = '/contact',
}: {
  children: ReactNode;
  secondary?: boolean;
  to?: string;
}) {
  return (
    <Link className={`button${secondary ? ' button-secondary' : ''}`} to={to}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker">{children}</div>;
}

export function Heading({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="heading">
      <Kicker>{kicker}</Kicker>
      <h2 dangerouslySetInnerHTML={{ __html: title }} />
      {text && <p>{text}</p>}
    </div>
  );
}
