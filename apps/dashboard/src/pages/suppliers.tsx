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
  Select,
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
  supplier_code?: string;
  contact_person?: string;
  address?: string;
  notes?: string;
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
  const emptyForm = {
    supplierCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    status: 'active',
  };
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    api<Supplier[]>(
      `/suppliers?limit=100${status ? `&status=${status}` : ''}`,
      token,
      company,
    )
      .then(setRows)
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token, status]);

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
          ...form,
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm(emptyForm);
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
      const value = await api<Supplier>('/suppliers/' + r.id, token, company);
      setDetail(value);
      setForm({
        supplierCode: value.supplier_code ?? '',
        name: value.name ?? '',
        contactPerson: value.contact_person ?? '',
        phone: value.phone ?? '',
        email: value.email ?? '',
        address: value.address ?? '',
        notes: value.notes ?? '',
        status: value.status ?? 'active',
      });
    } catch {
      setDetail(r);
    }
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setMsg(t('common.saving'));
    try {
      const updated = await api<Supplier>(
        '/suppliers/' + detail.id,
        token,
        company,
        { method: 'PATCH', body: JSON.stringify(form) },
      );
      setDetail(updated);
      setMsg(t('messages.saveSuccess'));
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError
          ? `${e.status} · ${e.code}`
          : t('messages.saveError'),
      );
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
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak aktif</option>
          </Select>
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
            <dt>Kode</dt>
            <dd>{detail.supplier_code ?? '—'}</dd>
            <dt>Kontak</dt>
            <dd>{detail.contact_person ?? '—'}</dd>
            <dt>Email</dt>
            <dd>{detail.email ?? '—'}</dd>
            <dt>Telepon</dt>
            <dd>{detail.phone ?? '—'}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? 'ACTIVE'} />
            </dd>
            <dt>Alamat</dt>
            <dd>{detail.address ?? '—'}</dd>
            <dt>Catatan</dt>
            <dd>{detail.notes ?? '—'}</dd>
          </dl>
          {ctx.permissions.includes('supplier.update') && (
            <form
              className="inline-form"
              onSubmit={update}
              style={{ marginTop: 16 }}
            >
              <Field label="Kode">
                <Input
                  required
                  value={form.supplierCode}
                  onChange={(e) =>
                    setForm({ ...form, supplierCode: e.target.value })
                  }
                />
              </Field>
              <Field label={t('common.name')}>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Kontak">
                <Input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
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
              <Field label="Alamat">
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </Field>
              <Field label="Catatan">
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak aktif</option>
                </Select>
              </Field>
              <Button type="submit">{t('common.save')}</Button>
            </form>
          )}
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
        <form
          id="supplier-create-form"
          className="inline-form"
          onSubmit={create}
        >
          <Field label="Kode Supplier">
            <Input
              required
              value={form.supplierCode}
              onChange={(e) =>
                setForm({ ...form, supplierCode: e.target.value })
              }
            />
          </Field>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Kontak">
            <Input
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />
          </Field>
          <Field label={t('common.phone')}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Alamat">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Catatan">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
