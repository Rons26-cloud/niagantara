import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from './api';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function CrudPage({
  kind,
  company,
  token,
  ctx,
}: {
  kind: 'suppliers' | 'customers' | 'employees';
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const singular = kind === 'suppliers' ? 'supplier' : kind === 'customers' ? 'customer' : 'employee';

  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const getInitialForm = (): Record<string, string> =>
    kind === 'employees'
      ? { employeeCode: '', name: '', jobTitle: '', primaryBranchId: ctx.accessible_branches[0]?.id ?? '' }
      : { code: '', name: '', phone: '', email: '' };
  const [form, setForm] = useState<Record<string, string>>(getInitialForm);

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/' + kind, token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [kind, company, token]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg('...');
    try {
      const body =
        kind === 'employees'
          ? form
          : { [singular + 'Code']: form.code, name: form.name, phone: form.phone, email: form.email };
      await api('/' + kind, token, company, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm(getInitialForm());
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function open(r: any) {
    try {
      setDetail(await api('/' + kind + '/' + r.id, token, company));
    } catch {
      setDetail(r);
    }
  }

  async function assignBranch() {
    if (!detail) return;
    const branchId = prompt('Branch ID', ctx.accessible_branches[0]?.id);
    if (branchId) {
      try {
        await api('/employees/' + detail.id + '/assignments', token, company, {
          method: 'POST',
          body: JSON.stringify({ branchId, isPrimary: true }),
        });
        setMsg('Branch assigned.');
        open(detail);
      } catch {
        setMsg(t('messages.saveError'));
      }
    }
  }

  return (
    <>
      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        {ctx.permissions.includes(singular + '.create') && (
          <Button onClick={() => setShowCreate(true)}>
            {t('common.create')} {singular}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{kind}</h2>
          <span>{filtered.length} records</span>
        </div>

        {loading ? (
          <LoadingState label={t('common.loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <div className="table">
            <div className="tr head">
              {(kind === 'employees'
                ? ['Name', 'Email', 'Job Title', 'Status']
                : ['Name', 'Email', 'Phone', 'Status']
              ).map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => (
              <button
                className="tr"
                key={r.id}
                onClick={() => open(r)}
                style={{ cursor: 'pointer' }}
              >
                <span>{r.name ?? '—'}</span>
                <span>{r.email ?? '—'}</span>
                <span>{kind === 'employees' ? r.jobTitle ?? '—' : r.phone ?? '—'}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
              </button>
            ))}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        {msg && <p className="muted">{msg}</p>}
      </section>

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <h2>{detail.name}</h2>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              {t('common.close')}
            </Button>
          </div>
          <dl className="def-grid">
            {Object.entries(detail)
              .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
              .slice(0, 10)
              .map(([k, v]) => (
                <span key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{String(v ?? '—')}</dd>
                </span>
              ))}
          </dl>
          {kind === 'customers' && detail.sales?.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Sales history</h3>
              <div className="table">
                <div className="tr head">
                  {['Invoice', 'Total', 'Status'].map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                {detail.sales.map((s: any) => (
                  <div className="tr" key={s.id}>
                    <span>{s.transaction_number ?? s.id}</span>
                    <span>Rp {Number(s.grand_total ?? 0).toLocaleString('id-ID')}</span>
                    <span>
                      <StatusBadge status={s.status ?? '—'} />
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {kind === 'employees' && detail.assignments?.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Assignments</h3>
              <div className="table">
                <div className="tr head">
                  {['Branch', 'Primary'].map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                {detail.assignments.map((a: any) => (
                  <div className="tr" key={a.id}>
                    <span>{a.branch?.name ?? a.branchId}</span>
                    <span>{a.isPrimary ? 'Yes' : 'No'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {kind === 'employees' && ctx.permissions.includes('employee.assign') && (
            <Button variant="secondary" onClick={assignBranch} style={{ marginTop: 12 }}>
              Assign branch
            </Button>
          )}
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${singular}`}
        footer={
          <Button type="submit" form="crud-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="crud-create-form" className="inline-form" onSubmit={submit}>
          {Object.keys(form).map((k) => (
            <Field key={k} label={k}>
              <Input
                required
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </Field>
          ))}
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}
