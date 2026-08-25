import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ThemeSwitcher,
  LanguageSwitcher,
  useTranslation,
} from '@niagantara/ui';
import { Link, usePath } from './router';

export function ThemeImage({
  lightSrc,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}: {
  lightSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'eager' | 'lazy';
}) {
  return (
    <img
      className={className}
      src={lightSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      draggable={false}
    />
  );
}

export function Navbar() {
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menu]);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand nav-brand-full" ariaLabel={t('brand.name')}>
          <ThemeImage
            lightSrc="/logo.png"
            alt="NIAGANTARA"
            className="brand-logo-img"
            width={840}
            height={324}
            loading="eager"
          />
          <span className="brand-copy">
            <small>BUSINESS CONTROL PLATFORM</small>
          </span>
        </Link>
        <Link to="/" className="brand navbar-brand" ariaLabel={t('brand.name')}>
          <ThemeImage
            lightSrc="/brand-mark.png"
            alt=""
            className="navbar-mark"
            width={576}
            height={628}
            loading="eager"
          />
          <span className="brand-word">NIAGANTARA</span>
        </Link>
        <nav aria-label={t('nav.primary')}>
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
          aria-controls="site-drawer"
          aria-label={menu ? t('common.close') : t('nav.menu')}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`drawer-root${menu ? ' open' : ''}`}>
        <div className="drawer-backdrop" onClick={close} aria-hidden="true" />
        <aside
          id="site-drawer"
          className="drawer"
          role="dialog"
          aria-modal={menu || undefined}
          aria-label={t('nav.primary')}
          inert={!menu}
        >
          <div className="drawer-head">
            <ThemeImage
              lightSrc="/brand-mark.png"
              alt=""
              className="drawer-mark"
              width={576}
              height={628}
              loading="eager"
            />
            <strong className="drawer-title">NIAGANTARA</strong>
            <button
              ref={closeButtonRef}
              className="drawer-close"
              onClick={close}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <nav className="drawer-nav" aria-label={t('nav.primary')}>
            {items.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                ariaCurrent={path === to ? 'page' : undefined}
                className={path === to ? 'active' : undefined}
              >
                {label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
          <div className="drawer-foot">
            <a className="drawer-login" href="https://niagantara-app.pages.dev">
              {t('auth.login')}
            </a>
            <Link className="button drawer-cta" to="/harga" onClick={close}>
              {t('nav.trial')}
              <span aria-hidden="true">→</span>
            </Link>
            <div className="drawer-controls">
              <ThemeSwitcher />
              <LanguageSwitcher compact />
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="fbrand">
          <Link to="/" className="fbrand-logo" ariaLabel={t('brand.name')}>
            <ThemeImage
              lightSrc="/logo.png"
              alt="NIAGANTARA"
              className="fbrand-img"
              width={840}
              height={324}
              loading="lazy"
            />
          </Link>
          <strong className="fbrand-tag">{t('website.footer.tagline')}</strong>
          <p>{t('website.footer.description')}</p>
        </div>

        <nav className="fcol" aria-label={t('website.footer.productsHeading')}>
          <h4>{t('website.footer.productsHeading')}</h4>
          <Link to="/fitur">{t('website.footer.features')}</Link>
          <Link to="/solusi">{t('website.footer.solutions')}</Link>
          <Link to="/harga">{t('website.footer.pricing')}</Link>
          <Link to="/solusi">{t('website.footer.pos')}</Link>
          <a href="https://niagantara-app.pages.dev" rel="noopener">
            {t('website.footer.dashboard')}
          </a>
        </nav>

        <nav className="fcol" aria-label={t('website.footer.companyHeading')}>
          <h4>{t('website.footer.companyHeading')}</h4>
          <Link to="/tentang">{t('website.footer.about')}</Link>
          <Link to="/faq">{t('website.footer.faq')}</Link>
          <Link to="/kontak">{t('website.footer.contact')}</Link>
          <a href="mailto:support@niagantara.com">{t('website.footer.helpCenter')}</a>
        </nav>

        <div className="fcol fcontact">
          <h4>{t('website.footer.contactHeading')}</h4>
          <a className="fmail" href="mailto:hello@niagantara.com">
            <b>hello@niagantara.com</b>
            <small>{t('website.footer.contactGeneral')}</small>
          </a>
          <a className="fmail" href="mailto:support@niagantara.com">
            <b>support@niagantara.com</b>
            <small>{t('website.footer.contactSupport')}</small>
          </a>
          <a className="fmail" href="mailto:security@niagantara.com">
            <b>security@niagantara.com</b>
            <small>{t('website.footer.contactSecurity')}</small>
          </a>
          <a className="fmail" href="mailto:billing@niagantara.com">
            <b>billing@niagantara.com</b>
            <small>{t('website.footer.contactBilling')}</small>
          </a>
        </div>

        <nav className="fcol flegal" aria-label={t('website.footer.legalHeading')}>
          <h4>{t('website.footer.legalHeading')}</h4>
          <Link to="/privacy">{t('website.footer.privacy')}</Link>
          <Link to="/terms">{t('website.footer.terms')}</Link>
          <a href="mailto:security@niagantara.com">{t('website.footer.security')}</a>
        </nav>
      </div>

      {/* Secondary system/administration contacts — kept out of the primary block */}
      <div className="container fsystemic">
        <small className="fsystemic-head">{t('website.footer.systemicHeading')}</small>
        <div className="fsystemic-row">
          <a className="fchip" href="mailto:admin@niagantara.com">
            admin@niagantara.com
            <small>{t('website.footer.contactAdmin')}</small>
          </a>
          {/* Automated sender — intentionally NOT a mailto link */}
          <span className="fchip static">
            no-reply@niagantara.com
            <small>{t('website.footer.contactNoreply')}</small>
          </span>
          <a className="fchip" href="mailto:niagantara.official@gmail.com">
            niagantara.official@gmail.com
            <small>{t('website.footer.contactGmail')}</small>
          </a>
        </div>
      </div>

      <div className="container fbottom">
        <small>{t('website.footer.rights')}</small>
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
