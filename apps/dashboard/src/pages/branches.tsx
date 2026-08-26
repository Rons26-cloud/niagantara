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
import { GitBranch, Plus, MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';

type Branch = {
  id: string;
  name: string;
  code?: string;
  storeId?: string;
  store_id?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  description?: string;
  status?: string;
  employeeCount?: number;
  warehouseCount?: number;
  stockSummary?: { totalStock: number; lowStock: number };
  salesSummary?: { todaySales: number; monthSales: number };
  operationalHours?: string;
  created_at?: string;
};

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const defaultHours = () =>
  WEEKDAYS.map((d) => ({ day: d, open: '08:00', close: '17:00', closed: d === 'Minggu' }));

export function BranchesPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Branch | null>(null);
  const [detailRow, setDetailRow] = useState<Branch | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    storeId: ctx.stores[0]?.id ?? '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    description: '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    api<Branch[]>('/branches', token, company)
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
      r.code?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  const totalEmployees = rows.reduce((n, r) => n + (r.employeeCount ?? 0), 0);
  const totalSales = rows.reduce((n, r) => n + (r.salesSummary?.todaySales ?? 0), 0);
  const activeBranches = rows.filter((r) => r.status !== 'INACTIVE').length;

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/branches', token, company, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      resetForm();
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setMsg(t('common.saving'));
    try {
      await api('/branches/' + editRow.id, token, company, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setEditRow(null);
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function toggleStatus(r: Branch) {
    const next = r.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await api('/branches/' + r.id, token, company, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      load();
    } catch {
      setMsg('Gagal mengubah status');
    }
  }

  function resetForm() {
    setForm({
      name: '',
      code: '',
      storeId: ctx.stores[0]?.id ?? '',
      address: '',
      city: '',
      province: '',
      phone: '',
      email: '',
      description: '',
    });
  }

  function openEdit(r: Branch) {
    setForm({
      name: r.name,
      code: r.code ?? '',
      storeId: r.storeId ?? r.store_id ?? '',
      address: r.address ?? '',
      city: r.city ?? '',
      province: r.province ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      description: r.description ?? '',
    });
    setEditRow(r);
  }

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="branch-summary-row">
        <div className="branch-stat">
          <Building2 size={20} />
          <div>
            <b>{rows.length}</b>
            <small>Total Cabang</small>
          </div>
        </div>
        <div className="branch-stat">
          <GitBranch size={20} />
          <div>
            <b>{activeBranches}</b>
            <small>Aktif</small>
          </div>
        </div>
        <div className="branch-stat">
          <Clock size={20} />
          <div>
            <b>{totalEmployees}</b>
            <small>Karyawan</small>
          </div>
        </div>
        <div className="branch-stat">
          <MapPin size={20} />
          <div>
            <b>{fmtRp(totalSales)}</b>
            <small>Penjualan Hari Ini</small>
          </div>
        </div>
      </div>

      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder="Cari nama, kode, atau kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        {ctx.permissions.includes('branch.manage') && (
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus size={14} /> {t('common.add')} {t('common.branch')}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.branches')}</h2>
          <span>{filtered.length} cabang</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<GitBranch size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada cabang terdaftar. Klik tombol tambah untuk membuat cabang baru."
            action={
              ctx.permissions.includes('branch.manage') ? (
                <Button onClick={() => { resetForm(); setShowCreate(true); }}>
                  <Plus size={14} /> {t('common.add')} {t('common.branch')}
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<GitBranch size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="branch-grid">
            {slice.map((r) => (
              <div
                className="branch-card"
                key={r.id}
                onClick={() => setDetailRow(r)}
              >
                <div className="branch-card-header">
                  <div className="branch-card-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="branch-card-info">
                    <b>{r.name}</b>
                    <small>{r.code ?? '—'}</small>
                  </div>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </div>

                {r.address && (
                  <div className="branch-card-row">
                    <MapPin size={13} />
                    <span>{[r.address, r.city, r.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {r.phone && (
                  <div className="branch-card-row">
                    <Phone size={13} />
                    <span>{r.phone}</span>
                  </div>
                )}
                {r.email && (
                  <div className="branch-card-row">
                    <Mail size={13} />
                    <span>{r.email}</span>
                  </div>
                )}
                {r.operationalHours && (
                  <div className="branch-card-row">
                    <Clock size={13} />
                    <span>{r.operationalHours}</span>
                  </div>
                )}

                <div className="branch-card-stats">
                  <div>
                    <b>{r.employeeCount ?? 0}</b>
                    <small>Karyawan</small>
                  </div>
                  <div>
                    <b>{r.warehouseCount ?? 0}</b>
                    <small>Gudang</small>
                  </div>
                  <div>
                    <b>{fmtRp(r.salesSummary?.todaySales ?? 0)}</b>
                    <small>Hari Ini</small>
                  </div>
                </div>

                <div className="branch-card-footer" onClick={(e) => e.stopPropagation()}>
                  {ctx.permissions.includes('branch.manage') && (
                    <>
                      <Button variant="ghost" onClick={() => openEdit(r)}>
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        className={r.status === 'INACTIVE' ? 'text-success' : 'text-warning'}
                        onClick={() => toggleStatus(r)}
                      >
                        {r.status === 'INACTIVE' ? 'Aktifkan' : 'Nonaktifkan'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${t('common.branch')}`}
        footer={
          <Button type="submit" form="branch-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="branch-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Kantor Pusat"
            />
          </Field>
          <Field label="Kode Cabang">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Contoh: HO, BR-01"
            />
          </Field>
          <Field label={t('context.store')}>
            <Select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              {ctx.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alamat">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat lengkap"
            />
          </Field>
          <div className="inline-form-two-col">
            <Field label="Kota">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Provinsi">
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </Field>
          </div>
          <div className="inline-form-two-col">
            <Field label="Telepon">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+62..."
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="cabang@perusahaan.com"
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea
              className="settings-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi singkat tentang cabang ini..."
              rows={3}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={`${t('common.edit')} ${editRow?.name ?? ''}`}
        footer={
          <Button type="submit" form="branch-edit-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="branch-edit-form" className="inline-form" onSubmit={update}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Kode Cabang">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label={t('context.store')}>
            <Select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              {ctx.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alamat">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="inline-form-two-col">
            <Field label="Kota">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Provinsi">
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </Field>
          </div>
          <div className="inline-form-two-col">
            <Field label="Telepon">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea
              className="settings-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>

      {/* Detail Panel */}
      {detailRow && (
        <Modal
          open
          onClose={() => setDetailRow(null)}
          title={detailRow.name}
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {ctx.permissions.includes('branch.manage') && (
                <Button variant="ghost" onClick={() => { openEdit(detailRow); setDetailRow(null); }}>
                  {t('common.edit')}
                </Button>
              )}
              <Button onClick={() => setDetailRow(null)}>Tutup</Button>
            </div>
          }
        >
          <div className="branch-detail">
            <div className="branch-detail-section">
              <h4>Informasi Umum</h4>
              <div className="branch-detail-grid">
                <div className="branch-detail-item">
                  <span className="branch-detail-label">Kode</span>
                  <span className="branch-detail-value">{detailRow.code ?? '—'}</span>
                </div>
                <div className="branch-detail-item">
                  <span className="branch-detail-label">Status</span>
                  <span className="branch-detail-value">
                    <StatusBadge status={detailRow.status ?? 'ACTIVE'} />
                  </span>
                </div>
                <div className="branch-detail-item">
                  <span className="branch-detail-label">Toko</span>
                  <span className="branch-detail-value">
                    {ctx.stores.find((s) => s.id === (detailRow.storeId ?? detailRow.store_id))?.name ?? '—'}
                  </span>
                </div>
                <div className="branch-detail-item">
                  <span className="branch-detail-label">Dibuat</span>
                  <span className="branch-detail-value">
                    {detailRow.created_at ? new Date(detailRow.created_at).toLocaleDateString('id-ID') : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="branch-detail-section">
              <h4>Lokasi & Kontak</h4>
              <div className="branch-detail-list">
                {detailRow.address && (
                  <div className="branch-detail-row">
                    <MapPin size={14} />
                    <span>{[detailRow.address, detailRow.city, detailRow.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {detailRow.phone && (
                  <div className="branch-detail-row">
                    <Phone size={14} />
                    <span>{detailRow.phone}</span>
                  </div>
                )}
                {detailRow.email && (
                  <div className="branch-detail-row">
                    <Mail size={14} />
                    <span>{detailRow.email}</span>
                  </div>
                )}
              </div>
            </div>

            {detailRow.description && (
              <div className="branch-detail-section">
                <h4>Deskripsi</h4>
                <p className="branch-detail-desc">{detailRow.description}</p>
              </div>
            )}

            <div className="branch-detail-section">
              <h4>Statistik</h4>
              <div className="branch-detail-stats">
                <div className="branch-detail-stat-card">
                  <b>{detailRow.employeeCount ?? 0}</b>
                  <small>Karyawan</small>
                </div>
                <div className="branch-detail-stat-card">
                  <b>{detailRow.warehouseCount ?? 0}</b>
                  <small>Gudang</small>
                </div>
                <div className="branch-detail-stat-card">
                  <b>{detailRow.stockSummary?.totalStock ?? 0}</b>
                  <small>Total Stok</small>
                </div>
                <div className="branch-detail-stat-card">
                  <b>{detailRow.stockSummary?.lowStock ?? 0}</b>
                  <small>Stok Rendah</small>
                </div>
                <div className="branch-detail-stat-card">
                  <b>{fmtRp(detailRow.salesSummary?.todaySales ?? 0)}</b>
                  <small>Penjualan Hari Ini</small>
                </div>
                <div className="branch-detail-stat-card">
                  <b>{fmtRp(detailRow.salesSummary?.monthSales ?? 0)}</b>
                  <small>Penjualan Bulan Ini</small>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
