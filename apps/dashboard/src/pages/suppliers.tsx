import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  Button,
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
import { Truck, Plus } from 'lucide-react';

type Supplier = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
};

type Ctx = {
  permissions: string[];
};

export function SuppliersPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const load = () => {
    setLoading(true);
    setError(null);
    api<Supplier[]>('/suppliers', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/suppliers', token, company, {
        method: 'POST',
        body: JSON.stringify({
          supplierCode: form.phone,
          ...form,
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ name: '', phone: '', email: '' });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function openDetail(r: Supplier) {
    try {
      setDetail(await api<Supplier>('/suppliers/' + r.id, token, company));
    } catch {
      setDetail(r);
    }
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

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
        {ctx.permissions.includes('supplier.create') && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> {t('common.add')} {t('common.supplier')}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.suppliers')}</h2>
          <span>{filtered.length} records</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Truck size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada supplier terdaftar."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Truck size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Nama', 'Email', 'Telepon', 'Status'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => (
              <button
                className="tr"
                key={r.id}
                onClick={() => openDetail(r)}
                style={{ cursor: 'pointer' }}
              >
                <span>{r.name ?? '—'}</span>
                <span>{r.email ?? '—'}</span>
                <span>{r.phone ?? '—'}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
              </button>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
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
            <dt>Email</dt>
            <dd>{detail.email ?? '—'}</dd>
            <dt>Telepon</dt>
            <dd>{detail.phone ?? '—'}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? 'ACTIVE'} />
            </dd>
          </dl>
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${t('common.supplier')}`}
        footer={
          <Button type="submit" form="supplier-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="supplier-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label={t('common.phone')}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label={t('common.email')}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}
