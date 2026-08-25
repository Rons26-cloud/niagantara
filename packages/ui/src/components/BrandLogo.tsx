interface BrandProps {
  className?: string;
  href?: string;
  ariaLabel?: string;
  src?: string;
  loading?: 'eager' | 'lazy';
}

export function BrandMark({
  size = 30,
  className = '',
  src = '/brand-mark.png',
  loading = 'eager',
}: {
  size?: number;
  className?: string;
  src?: string;
  loading?: 'eager' | 'lazy';
}) {
  return (
    <img
      className={`brand-logo-img ${className}`.trim()}
      src={src}
      alt=""
      style={{ height: size }}
      loading={loading}
      decoding="async"
      draggable={false}
    />
  );
}

export function BrandLogo({
  compact = false,
  className = '',
  href = '/',
  ariaLabel = 'NIAGANTARA — Business Control Platform',
  src = '/logo.png',
  loading = 'eager',
}: BrandProps & { compact?: boolean }) {
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
            src={src}
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
