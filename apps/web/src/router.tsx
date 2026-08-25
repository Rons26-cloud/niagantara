import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SITE_URL, OG_IMAGE, getSeo } from './seo.config';

const NavigateContext = createContext<(to: string) => void>(() => {});
export const NavigateProvider = NavigateContext.Provider;

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function navigate(to: string): void {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function Link({
  to,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: 'page';
  onClick?: () => void;
}) {
  const go = useContext(NavigateContext);
  return (
    <a
      href={to}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onClick?.();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

export function Seo({ path }: { path: string }) {
  useEffect(() => {
    const seo = getSeo(path);
    if (!seo) return;

    document.title = seo.title;

    const url = `${SITE_URL}${path}`;

    setMeta('description', seo.description);
    setMeta('robots', seo.robots);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    setMeta('og:url', url, 'property');
    setMeta('og:title', seo.ogTitle, 'property');
    setMeta('og:description', seo.ogDescription, 'property');
    setMeta('og:image', OG_IMAGE, 'property');

    setMeta('twitter:title', seo.ogTitle);
    setMeta('twitter:description', seo.ogDescription);
    setMeta('twitter:image', OG_IMAGE);

    document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((el) => el.remove());
    if (seo.schema?.length) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.dataset.seo = 'true';
      s.textContent = JSON.stringify(seo.schema.length === 1 ? seo.schema[0] : seo.schema);
      document.head.appendChild(s);
    }

    return () => {
      document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((el) => el.remove());
    };
  }, [path]);

  return null;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return;
  const key = attr === 'property' ? `[property="${name}"]` : `[name="${name}"]`;
  let el = document.querySelector<HTMLMetaElement>(`meta${key}`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
