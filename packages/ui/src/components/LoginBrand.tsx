export function LoginBrand({
  appLabel,
  className = '',
}: {
  appLabel: string;
  className?: string;
}) {
  return (
    <div className={`login-brand ${className}`.trim()}>
      <img
        className="login-brand__logo"
        src="/logo.png"
        alt="NIAGANTARA"
        loading="eager"
        decoding="async"
        draggable={false}
      />
      <div className="login-brand__text">
        <strong>NIAGANTARA</strong>
        <small>Business Control Platform</small>
      </div>
      <span className="login-brand__app">{appLabel}</span>
    </div>
  );
}
