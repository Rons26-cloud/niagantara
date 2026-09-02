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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const { t, language } = useTranslation();
  const en = language === 'en';
  const path = usePath();
  const items: [string, string][] = [
    ['/', en ? 'Home' : 'Beranda'],
    ['/fitur', en ? 'Features' : 'Fitur'],
    ['/demo/pos', 'POS'],
    ['/demo/dashboard', 'Dashboard'],
    ['/solusi', en ? 'Solutions' : 'Solusi'],
    ['/tentang', en ? 'Security' : 'Keamanan'],
    ['/kontak', en ? 'Contact' : 'Kontak'],
  ];

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),select:not([disabled])',
          ),
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      menuButtonRef.current?.focus();
    };
  }, [menu]);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link
          to="/"
          className="brand nav-brand-full"
          ariaLabel={t('brand.name')}
        >
          <ThemeImage
            lightSrc="/logo-280.webp"
            alt="NIAGANTARA"
            className="brand-logo-img"
            width={280}
            height={108}
            loading="eager"
          />
          <span className="brand-copy">
            <small>BUSINESS CONTROL PLATFORM</small>
          </span>
        </Link>
        <Link to="/" className="brand navbar-brand" ariaLabel={t('brand.name')}>
          <ThemeImage
            lightSrc="/brand-mark-144.webp"
            alt=""
            className="navbar-mark"
            width={144}
            height={157}
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
          <Link className="nav-cta" to="/kontak">
            {en ? 'Get Started' : 'Mulai Sekarang'} <span>→</span>
          </Link>
        </div>
        <button
          type="button"
          ref={menuButtonRef}
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
          ref={drawerRef}
          id="site-drawer"
          className="drawer"
          role="dialog"
          aria-modal={menu || undefined}
          aria-label={t('nav.primary')}
          inert={!menu}
        >
          <div className="drawer-head">
            <ThemeImage
              lightSrc="/brand-mark-144.webp"
              alt=""
              className="drawer-mark"
              width={144}
              height={157}
              loading="eager"
            />
            <strong className="drawer-title">NIAGANTARA</strong>
            <button
              type="button"
              ref={closeButtonRef}
              className="drawer-close"
              onClick={close}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <span className="drawer-section-label">
            {en ? 'Navigation' : 'Navigasi'}
          </span>
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
            <Link className="button drawer-cta" to="/kontak" onClick={close}>
              {en ? 'Get Started' : 'Mulai Sekarang'}
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
  const { language, translations } = useTranslation();
  const en = language === 'en';
  const f = translations.website.footer;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="fbrand">
          <Link to="/" className="fbrand-logo" ariaLabel="NIAGANTARA">
            <ThemeImage
              lightSrc="/logo-280.webp"
              alt="NIAGANTARA"
              className="fbrand-img"
              width={280}
              height={108}
              loading="lazy"
            />
          </Link>
          <strong className="fbrand-tag">{f.tagline}</strong>
          <p>{f.description}</p>
        </div>

        <nav className="fcol" aria-label={f.productsHeading}>
          <h4>{f.productsHeading}</h4>
          <Link to="/demo/pos">POS</Link>
          <Link to="/demo/dashboard">Dashboard</Link>
          <Link to="/demo/inventory">Inventory</Link>
          <Link to="/demo/purchases">Purchasing</Link>
        </nav>

        <nav className="fcol" aria-label="Platform">
          <h4>Platform</h4>
          <Link to="/fitur">{f.features}</Link>
          <Link to="/tentang">{f.security}</Link>
          <Link to="/solusi">{en ? 'Integrations' : 'Integrasi'}</Link>
        </nav>

        <nav className="fcol" aria-label={f.companyHeading}>
          <h4>{f.companyHeading}</h4>
          <Link to="/tentang">{f.about}</Link>
          <Link to="/kontak">{f.contact}</Link>
          <a href="mailto:support@niagantara.com">{en ? 'Support' : 'Dukungan'}</a>
        </nav>

        <nav className="fcol flegal" aria-label="Legal">
          <h4>Legal</h4>
          <Link to="/privacy">{f.privacy}</Link>
          <Link to="/terms">{f.terms}</Link>
          <Link to="/security">{f.security}</Link>
        </nav>
      </div>

      <div className="container fbottom">
        <small>{f.rights}</small>
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

export function LazySection({
  children,
  rootMargin = '200px 0px',
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div className="lazy-section-placeholder" />}
    </div>
  );
}
