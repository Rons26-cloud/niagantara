import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
  StatusBadge,
  Switch,
  useTranslation,
} from '@niagantara/ui';
import type { Language, Theme } from '@niagantara/ui';
import { getLanguage, getTheme, setLanguage, setTheme } from '@niagantara/ui';
import type { OrgCtx } from '../enhancements';

export function SettingsPage({
  ctx,
  companyName,
  token,
}: {
  ctx: OrgCtx;
  companyName: string;
  token: string;
}) {
  const { t, language, setLanguage: setLang } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const [plan, setPlan] = useState<any>(null);
  const [planState, setPlanState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    api(`/companies/${ctx.active_company}/plan`, token, ctx.active_company)
      .then((value) => { if (active) { setPlan(value); setPlanState('ready'); } })
      .catch(() => { if (active) setPlanState('error'); });
    return () => { active = false; };
  }, [ctx.active_company, token]);

  return (
    <>
      <Card title={t('settings.profile')}>
        <dl className="def-grid">
          <dt>{t('settings.userId')}</dt>
          <dd>{ctx.user.id}</dd>
          <dt>{t('settings.fullName')}</dt>
          <dd>{ctx.profile?.full_name ?? '—'}</dd>
          <dt>{t('settings.email')}</dt>
          <dd>{ctx.profile?.email ?? '—'}</dd>
        </dl>
      </Card>

      <Card title={t('settings.appearance')}>
        <div className="setting-row">
          <span>{t('settings.themeLight')}</span>
          <Switch
            label={t('settings.appearance')}
            checked={theme === 'blue'}
            onChange={(on) => {
              const next: Theme = on ? 'blue' : 'light';
              setTheme(next);
              setThemeState(next);
            }}
          />
          <span>{t('settings.themeBlue')}</span>
        </div>
        <div className="setting-row" style={{ marginTop: 12 }}>
          <span>{t('settings.language')}</span>
          <div className="ng-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={language === 'id'}
              className={language === 'id' ? 'active' : ''}
              onClick={() => {
                setLang('id');
                setLanguage('id');
              }}
            >
              {t('settings.languageId')}
            </button>
            <button
              role="tab"
              aria-selected={language === 'en'}
              className={language === 'en' ? 'active' : ''}
              onClick={() => {
                setLang('en');
                setLanguage('en');
              }}
            >
              {t('settings.languageEn')}
            </button>
          </div>
        </div>
      </Card>

      <Card title={t('settings.workspace')}>
        <dl className="def-grid">
          <dt>{t('settings.activeCompany')}</dt>
          <dd>{companyName}</dd>
          <dt>{t('settings.yourRole')}</dt>
          <dd>
            {ctx.roles.map((r) => (
              <span key={r} className="ng-badge ng-badge--info" style={{ marginRight: 6 }}>
                {r}
              </span>
            ))}
          </dd>
        </dl>
        <details>
          <summary>
            {t('settings.permissionsGranted')} ({ctx.permissions.length})
          </summary>
          <div className="perm-cloud">
            {ctx.permissions.map((p) => (
              <code key={p}>{p}</code>
            ))}
          </div>
        </details>
      </Card>

      <Card title={t('settings.subscription')}>
        {planState === 'loading' && <p className="muted">Memuat paket dan batas penggunaan…</p>}
        {planState === 'error' && <div className="ng-alert ng-alert--warning" role="alert">Paket belum dapat dimuat.</div>}
        {planState === 'ready' && <dl className="def-grid">
          <dt>Paket</dt><dd>{plan?.plan ?? '—'}</dd>
          <dt>Batas</dt><dd>{plan?.plan_limits ? JSON.stringify(plan.plan_limits) : '—'}</dd>
        </dl>}
      </Card>

      <Card title="Keamanan Sesi">
        <p className="muted">
          Sesi Anda disimpan secara lokal dan berakhir bersama token saat masuk.
        </p>
      </Card>

      <Card title={t('settings.dangerZone')}>
        <Button
          variant="danger"
          onClick={() => {
            localStorage.removeItem('niagantara.dashboard.session.v1');
            sessionStorage.clear();
            location.assign('/auth/login');
          }}
        >
          {t('settings.signOutAll')}
        </Button>
      </Card>
    </>
  );
}
