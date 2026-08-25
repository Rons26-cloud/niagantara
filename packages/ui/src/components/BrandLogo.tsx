/**
 * BrandLogo / BrandMark Components
 * Render the OFFICIAL NIAGANTARA brand assets — single source of truth:
 * assets/brand/niagantara-logo.png (shipped per app as /logo.png).
 * BrandMark uses the compact symbol derivative cropped from that same
 * official file (shipped as /brand-mark.png). The artwork itself is never
 * redrawn, recolored, stretched, or cropped: height is fixed and width
 * stays automatic (object-fit: contain), so the intrinsic aspect ratio of
 * the official PNG always holds. Surrounding surfaces provide contrast in
 * light and dark themes via theme-aware image swapping.
 */

import { useTheme } from '../theme';

interface BrandProps {
  className?: string;
  href?: string;
  ariaLabel?: string;
  /** Path or URL of the official logo asset. Full lockup defaults to /logo.png */
  src?: string;
  /** Dark-theme variant of the full lockup logo. */
  darkSrc?: string;
  /** Loading behavior for the underlying image. */
  loading?: 'eager' | 'lazy';
}

/** Compact official symbol. Derived from the official logo — never recreated. */
export function BrandMark({
  size = 30,
  className = '',
  src = '/brand-mark.png',
  darkSrc = '/niagantara-mark-dark.png',
  loading = 'eager',
}: {
  size?: number;
  className?: string;
  src?: string;
  darkSrc?: string;
  loading?: 'eager' | 'lazy';
}) {
  const { theme } = useTheme();
  const resolved = theme === 'blue' && darkSrc ? darkSrc : src;
  return (
    <img
      className={`brand-logo-img ${className}`.trim()}
      src={resolved}
      alt=""
      style={{ height: size }}
      loading={loading}
      decoding="async"
      draggable={false}
    />
  );
}

/**
 * Full brand lockup from the official asset. `compact` swaps the complete
 * horizontal logo for the official mark wherever space is tight (collapsed
 * sidebars, mobile headers) — the wordmark is never squeezed into tiny areas.
 */
export function BrandLogo({
  compact = false,
  className = '',
  href = '/',
  ariaLabel = 'NIAGANTARA — Business Control Platform',
  src = '/logo.png',
  darkSrc = '/niagantara-logo-dark.png',
  loading = 'eager',
}: BrandProps & { compact?: boolean }) {
  const { theme } = useTheme();
  const resolved = theme === 'blue' && darkSrc ? darkSrc : src;
  return (
    <a
      className={`brand${compact ? ' brand--compact' : ''} ${className}`.trim()}
      href={href}
      aria-label={ariaLabel}
    >
      {compact ? (
        <BrandMark size={30} loading={loading} />
      ) : (
        <>
          <img
            className="brand-logo-img"
            src={resolved}
            alt="NIAGANTARA"
            style={{ height: 34 }}
            loading={loading}
            decoding="async"
            draggable={false}
          />
          <span className="brand-copy">
            <small>BUSINESS CONTROL PLATFORM</small>
          </span>
        </>
      )}
    </a>
  );
}
