import { useTranslation } from '@niagantara/ui';

const HELP_MODULES = [
  'dashboard',
  'pos',
  'sales',
  'shifts',
  'products',
  'categories',
  'barcode',
  'inventory',
  'purchases',
  'suppliers',
  'customers',
  'employees',
  'attendance',
  'expenses',
  'payables',
  'receivables',
  'reports',
  'sheets',
  'warehouses',
  'branches',
  'stores',
  'settings',
] as const;

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <section className="panel">
      <h2>{t('help.title')}</h2>
      <p className="muted">{t('help.intro')}</p>
      <div className="help-grid">
        {HELP_MODULES.filter(
          (k) => t(`help.items.${k}`) !== `help.items.${k}`,
        ).map((k) => (
          <article key={k}>
            <h3>{t(`pages.${k}`)}</h3>
            <p>{t(`help.items.${k}`)}</p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: 16 }}>
        <a href="mailto:support@niagantara.com">{t('help.contact')} →</a>
      </p>
    </section>
  );
}
