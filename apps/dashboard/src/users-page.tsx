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
  Select,
  StatusBadge,
  useTranslation,
  usePaged,
  Pagination,
  Modal,
} from '@niagantara/ui';
import { UsersRound, UserPlus } from 'lucide-react';

type User = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  status?: string;
  company_access?: string[];
  store_access?: string[];
  branch_access?: string[];
  created_at?: string;
  last_active?: string;
};

export function UsersPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: { permissions: string[]; stores: any[]; accessible_branches: any[] };
}) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'employee',
  });
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<User | null>(null);

  const canManage = ctx.permissions.includes('user.manage');

  const load = () => {
    setLoading(true);
    setError(null);
    api<User[]>('/users', token, company)
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  async function create(e: FormEvent) {
    e.preventDefault();
    setStatus('...');
    try {
      await api('/users', token, company, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setStatus(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ email: '', full_name: '', role: 'employee' });
      load();
    } catch (e) {
      setStatus(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function openDetail(user: User) {
    try {
      const detail = await api<User>(`/users/${user.id}`, token, company);
      setDetail(detail);
    } catch {
      setDetail(user);
    }
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error)
    return <ErrorState message={error} onRetry={load} />;

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
        {canManage && (
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Tambah Pengguna
          </Button>
        )}
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={28} />}
          title={t('dashboard.noData')}
          description="Belum ada pengguna terdaftar."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={28} />}
          title="Tidak ada hasil"
          description="Coba kata kunci lain."
        />
      ) : (
        <section className="panel">
          <div className="table">
            <div className="tr head">
              {['Nama', 'Email', 'Role', 'Status', 'Terakhir aktif'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((u) => (
              <button
                className="tr"
                key={u.id}
                onClick={() => openDetail(u)}
                style={{ cursor: 'pointer' }}
              >
                <span>{u.full_name ?? '—'}</span>
                <span>{u.email}</span>
                <span>{u.role ?? '—'}</span>
                <span>
                  <StatusBadge status={u.status ?? 'ACTIVE'} />
                </span>
                <span>
                  {u.last_active
                    ? new Date(u.last_active).toLocaleString('id-ID')
                    : '—'}
                </span>
              </button>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Pengguna"
        footer={
          <Button type="submit" form="create-user-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="create-user-form" className="inline-form" onSubmit={create}>
          <Field label="Email" error={status.includes('save') ? status : undefined}>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Nama lengkap">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="employee">Employee</option>
              <option value="cashier">Cashier</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="company_admin">Company Admin</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
            </Select>
          </Field>
          {status && <p className="muted">{status}</p>}
        </form>
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.full_name ?? detail?.email ?? 'Detail'}
      >
        {detail && (
          <dl className="def-grid">
            <dt>ID</dt>
            <dd>{detail.id}</dd>
            <dt>Email</dt>
            <dd>{detail.email}</dd>
            <dt>Nama</dt>
            <dd>{detail.full_name ?? '—'}</dd>
            <dt>Role</dt>
            <dd>{detail.role ?? '—'}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? 'ACTIVE'} />
            </dd>
            <dt>Dibuat</dt>
            <dd>
              {detail.created_at
                ? new Date(detail.created_at).toLocaleString('id-ID')
                : '—'}
            </dd>
            <dt>Terakhir aktif</dt>
            <dd>
              {detail.last_active
                ? new Date(detail.last_active).toLocaleString('id-ID')
                : '—'}
            </dd>
          </dl>
        )}
      </Modal>
    </>
  );
}
