/**
 * BrandLogo Component
 * Renders the OFFICIAL NIAGANTARA logo asset.
 *
 * Drop the official logo file at `/logo.svg` (or /logo.png) in each app's
 * `public/` directory (or pass a custom `src`). Until the official asset is
 * present, the previous interim mark renders as a graceful fallback so no
 * broken image ever shows.
 */

import { useState } from 'react';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  href?: string;
  ariaLabel?: string;
  /** Path or URL of the official logo asset. Defaults to /logo.svg */
  src?: string;
}

export function BrandLogo({
  compact = false,
  className = '',
  href = '/',
  ariaLabel = 'NIAGANTARA — Business Control Platform',
  src = '/logo.svg',
}: BrandLogoProps) {
  const [assetMissing, setAssetMissing] = useState(false);

  return (
    <a
      className={`brand ${className}`.trim()}
      href={href}
      aria-label={ariaLabel}
    >
      <span className="brand-mark" aria-hidden={assetMissing || undefined}>
        {!assetMissing && (
          <img
            className="brand-logo-img"
            src={src}
            alt=""
            width={36}
            height={36}
            loading="eager"
            decoding="async"
            onError={() => setAssetMissing(true)}
          />
        )}
        {assetMissing && (
          <>
            <span>N</span>
            <i />
            <b />
            <em />
          </>
        )}
      </span>
      <span className="brand-copy">
        <strong>NIAGANTARA</strong>
        {!compact && <small>BUSINESS CONTROL PLATFORM</small>}
      </span>
    </a>
  );
}
