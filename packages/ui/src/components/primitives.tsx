import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useState,
} from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  return (
    <button
      className={`ng-btn ng-btn--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="ng-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      className={`ng-icon-btn ${className}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ng-input" {...props} />;
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea className="ng-input" rows={3} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="ng-field">
      <span className="ng-field__label">{label}</span>
      {children}
      {hint && !error && <small className="ng-field__hint">{hint}</small>}
      {error && (
        <small className="ng-field__error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

export function Select({
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="ng-input ng-select" {...rest}>
      {children}
    </select>
  );
}

export function SearchInput({
  value,
  onValueChange,
  placeholder,
  onSubmit,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  return (
    <form
      className="ng-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
      />
    </form>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ng-switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <i />
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="ng-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function Card({
  title,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ng-card ${className}`.trim()}>
      {(title || actions) && (
        <header className="ng-card__head">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {actions && <div className="ng-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  note,
  tone,
  loading,
  error,
  onRetry,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <article className={`ng-stat${tone && tone !== 'default' ? ` ng-stat--${tone}` : ''}`}>
      <span className="ng-stat__label">{label}</span>
      {loading ? (
        <Skeleton height={28} />
      ) : error ? (
        <>
          <strong className="ng-stat__error">—</strong>
          {onRetry && (
            <button className="ng-retry" onClick={onRetry}>
              ↻
            </button>
          )}
        </>
      ) : (
        <strong>{value}</strong>
      )}
      {note && <small>{note}</small>}
    </article>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return <span className={`ng-badge ng-badge--${tone}`}>{children}</span>;
}

const STATUS_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PAID: 'success',
  OPEN: 'success',
  ACTIVE: 'success',
  COMPLETED: 'success',
  RECEIVED: 'success',
  PARTIALLY_REFUNDED: 'warning',
  PENDING: 'warning',
  LOW: 'warning',
  DRAFT: 'warning',
  REFUNDED: 'danger',
  CANCELLED: 'danger',
  FAILED: 'danger',
  OVERDUE: 'danger',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{status}</Badge>;
}

export function Alert({
  tone = 'info',
  children,
  action,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`ng-alert ng-alert--${tone}`} role="alert">
      <div>{children}</div>
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width }: { height?: number; width?: number | string }) {
  return (
    <span
      className="ng-skeleton"
      style={{ height, width: width ?? '100%' }}
      aria-hidden="true"
    />
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="ng-state" role="status">
      <span className="ng-spinner ng-spinner--lg" />
      {label && <p>{label}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Retry',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="ng-state ng-state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          ↻ {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = '◌',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ng-empty">
      <span aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ng-pagehead">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="ng-pagehead__desc">{description}</p>}
      </div>
      {actions && <div className="ng-pagehead__actions">{actions}</div>}
    </header>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="ng-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ng-modal-overlay" onClick={onClose}>
      <div
        className="ng-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ng-modal__head">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </header>
        <div className="ng-modal__body">{children}</div>
        {footer && <footer className="ng-modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="ng-pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹
      </button>
      <span>
        {page} / {pageCount}
      </span>
      <button disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        ›
      </button>
    </nav>
  );
}

export function usePaged<T>(rows: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  useEffect(() => setPage(1), [rows.length]);
  return {
    page: safePage,
    pageCount,
    setPage,
    slice: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

let toastId = 0;
const TOAST_EVENT = 'ng-toast';

export function toast(message: string, tone: 'info' | 'success' | 'danger' = 'info') {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { id: ++toastId, message, tone } }));
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<{ id: number; message: string; tone: string }[]>([]);
  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToasts((prev) => [...prev.slice(-3), detail]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== detail.id)), 4000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);
  return (
    <div className="ng-toasts" aria-live="polite">
      {toasts.map((toast_) => (
        <div key={toast_.id} className={`ng-toast ng-toast--${toast_.tone}`}>
          {toast_.message}
        </div>
      ))}
    </div>
  );
}
