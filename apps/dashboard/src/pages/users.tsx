import { FormEvent, useEffect, useState, useMemo } from 'react';
import { ApiError, api } from '../api';
import type { OrgCtx } from '../enhancements';
import {
  Button,
  ConfirmDialog,
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
} from '@niagantara/ui';
import {
  UsersRound,
  UserPlus,
  Download,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

type BranchMembership = {
  branch_id: string;
  role_key: string;
  status: string;
  branch?: { id: string; name: string };
};
type CompanyUser = {
  id: string;
  user_id: string;
  role_key: string;
  status: string;
  created_at: string;
  last_login?: string;
  profile?: { full_name?: string; email?: string; avatar_url?: string };
  branches?: BranchMembership[];
};

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
const companyRoles = ['owner', 'company_admin', 'finance', 'accountant', 'hr'];
const branchRoles = [
  'manager',
  'supervisor',
  'cashier',
  'warehouse',
  'employee',
];

const roleColorMap: Record<string, string> = {
  owner: 'var(--accent-primary, #2563EB)',
  company_admin: '#7C3AED',
  finance: '#059669',
  accountant: '#059669',
  hr: '#D97706',
};

const activityStatusMap: Record<string, { label: string; color: string }> = {
  online: { label: 'Online', color: '#10B981' },
  away: { label: 'Away', color: '#F59E0B' },
  offline: { label: 'Offline', color: '#94A3B8' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}j lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}h lalu`;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getActivityStatus(lastLogin?: string): string {
  if (!lastLogin) return 'offline';
  const diffMs = Date.now() - new Date(lastLogin).getTime();
  const diffMin = diffMs / 60000;
  if (diffMin < 30) return 'online';
  if (diffMin < 240) return 'away';
  return 'offline';
}

function exportUsersCSV(rows: CompanyUser[]) {
  const headers = ['Nama', 'Email', 'Peran', 'Status', 'Cabang', 'Dibuat'];
  const csvRows = rows.map((r) => [
    r.profile?.full_name ?? '',
    r.profile?.email ?? r.user_id,
    r.role_key,
    r.status,
    (r.branches ?? [])
      .filter((b) => b.status === 'active')
      .map((b) => b.branch?.name ?? '')
      .join('; '),
    new Date(r.created_at).toLocaleDateString('id-ID'),
  ]);
  const csv = [headers, ...csvRows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function UsersPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: OrgCtx;
}) {
  const [rows, setRows] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CompanyUser | null>(null);
  const [viewing, setViewing] = useState<CompanyUser | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<CompanyUser | null>(
    null,
  );
  const [form, setForm] = useState({
    roleKey: '',
    status: 'active',
    branches: {} as Record<string, { selected: boolean; roleKey: string }>,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [showBulkBar, setShowBulkBar] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api<CompanyUser[]>('/users', token, company)
      .then(setRows)
      .catch((value) =>
        setError(
          value instanceof ApiError
            ? `${value.status} · ${value.code}`
            : 'Pengguna gagal dimuat.',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => void load(), [company, token]);

  const filtered = rows.filter((row) =>
    `${row.profile?.full_name ?? ''} ${row.user_id} ${row.role_key} ${row.profile?.email ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);
  const canManage =
    ctx.permissions.includes('user.manage') &&
    ['owner', 'company_admin'].some((role) => ctx.roles.includes(role));

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      admins: rows.filter((r) =>
        ['owner', 'company_admin'].includes(r.role_key),
      ).length,
      online: rows.filter((r) => getActivityStatus(r.last_login) === 'online')
        .length,
    }),
    [rows],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === slice.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(slice.map((r) => r.id)));
    }
  };

  const bulkChangeRole = async () => {
    if (!bulkRole || selected.size === 0) return;
    setMessage('Mengubah peran...');
    try {
      for (const id of selected) {
        const user = rows.find((r) => r.id === id);
        if (user) {
          await api(`/users/${user.user_id}`, token, company, {
            method: 'PATCH',
            body: JSON.stringify({ roleKey: bulkRole }),
          });
        }
      }
      setMessage(`${selected.size} pengguna diperbarui.`);
      setSelected(new Set());
      setBulkRole('');
      setShowBulkBar(false);
      load();
    } catch (value) {
      setMessage(
        value instanceof ApiError
          ? `${value.status} · ${value.code}`
          : 'Gagal memperbarui pengguna.',
      );
    }
  };

  const bulkDeactivate = async () => {
    if (selected.size === 0) return;
    setMessage('Menonaktifkan pengguna...');
    try {
      for (const id of selected) {
        const user = rows.find((r) => r.id === id);
        if (user) {
          await api(`/users/${user.user_id}`, token, company, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'suspended' }),
          });
        }
      }
      setMessage(`${selected.size} pengguna dinonaktifkan.`);
      setSelected(new Set());
      setShowBulkBar(false);
      load();
    } catch (value) {
      setMessage(
        value instanceof ApiError
          ? `${value.status} · ${value.code}`
          : 'Gagal menonaktifkan pengguna.',
      );
    }
  };

  function openEdit(row: CompanyUser) {
    const assigned = new Map(
      (row.branches ?? []).map((item) => [item.branch_id, item]),
    );
    setForm({
      roleKey: row.role_key,
      status: row.status,
      branches: Object.fromEntries(
        ctx.accessible_branches.map((branch) => {
          const membership = assigned.get(branch.id);
          return [
            branch.id,
            {
              selected: membership?.status === 'active',
              roleKey: membership?.role_key ?? 'employee',
            },
          ];
        }),
      ),
    });
    setEditing(row);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setMessage('Menyimpan...');
    try {
      await api(`/users/${editing.user_id}`, token, company, {
        method: 'PATCH',
        body: JSON.stringify({
          roleKey: form.roleKey,
          status: form.status,
          branches: Object.entries(form.branches)
            .filter(([, value]) => value.selected)
            .map(([branchId, value]) => ({ branchId, roleKey: value.roleKey })),
        }),
      });
      setEditing(null);
      setMessage('Pengguna berhasil diperbarui.');
      load();
    } catch (value) {
      setMessage(
        value instanceof ApiError
          ? `${value.status} · ${value.code}`
          : 'Pengguna tidak dapat diperbarui.',
      );
    }
  }

  async function suspend(row: CompanyUser) {
    setMessage('Menyimpan...');
    try {
      await api(`/users/${row.user_id}`, token, company, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'suspended' }),
      });
      setMessage('Akses pengguna dinonaktifkan.');
      load();
    } catch (value) {
      setMessage(
        value instanceof ApiError
          ? `${value.status} · ${value.code}`
          : 'Akses pengguna tidak dapat dinonaktifkan.',
      );
    }
  }

  if (loading) return <LoadingState label="Memuat pengguna" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div
        className="ng-filterbar"
        style={{ alignItems: 'end', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <Field label="Cari pengguna">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama, email, ID, atau peran"
          />
        </Field>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          {canManage && (
            <Button
              variant="secondary"
              onClick={() => alert('Invite user - fitur segera hadir')}
            >
              <UserPlus size={14} /> Undang Pengguna
            </Button>
          )}
          <Button variant="ghost" onClick={() => exportUsersCSV(filtered)}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {message && (
        <p className="muted" role="status" style={{ padding: '0.5rem 0' }}>
          {message}
        </p>
      )}

      <div
        className="metrics"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: '1rem',
        }}
      >
        <article className="user-stat-card">
          <span
            style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6B7280)' }}
          >
            Total Pengguna
          </span>
          <strong
            style={{
              fontSize: '1.5rem',
              margin: '0.4rem 0',
              color: 'var(--text-primary, #111827)',
            }}
          >
            {stats.total}
          </strong>
        </article>
        <article className="user-stat-card">
          <span
            style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6B7280)' }}
          >
            Aktif
          </span>
          <strong
            style={{ fontSize: '1.5rem', margin: '0.4rem 0', color: '#10B981' }}
          >
            {stats.active}
          </strong>
        </article>
        <article className="user-stat-card">
          <span
            style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6B7280)' }}
          >
            Admin
          </span>
          <strong
            style={{
              fontSize: '1.5rem',
              margin: '0.4rem 0',
              color: 'var(--accent-primary, #2563EB)',
            }}
          >
            {stats.admins}
          </strong>
        </article>
        <article className="user-stat-card">
          <span
            style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6B7280)' }}
          >
            Online
          </span>
          <strong
            style={{ fontSize: '1.5rem', margin: '0.4rem 0', color: '#10B981' }}
          >
            {stats.online}
          </strong>
        </article>
      </div>

      {selected.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: '10px',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary, #111827)',
            }}
          >
            {selected.size} dipilih
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setShowBulkBar(!showBulkBar);
            }}
          >
            <ShieldCheck size={14} /> Ubah Peran
          </Button>
          <Button
            variant="ghost"
            onClick={bulkDeactivate}
            style={{ color: 'var(--danger, #DC2626)' }}
          >
            <Trash2 size={14} /> Nonaktifkan
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>
            Batal
          </Button>
        </div>
      )}

      {showBulkBar && selected.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: '10px',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary, #4B5563)',
            }}
          >
            Peran baru:
          </span>
          <Select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="">Pilih peran</option>
            {companyRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Button onClick={bulkChangeRole} disabled={!bulkRole}>
            Terapkan
          </Button>
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Pengguna</h2>
          <span
            style={{ color: 'var(--text-muted, #6B7280)', fontSize: '0.85rem' }}
          >
            {filtered.length} anggota
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--bg-primary, #F3F4F6)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <UsersRound
                size={28}
                style={{ color: 'var(--text-muted, #94A3B8)' }}
              />
            </div>
            <h3
              style={{
                margin: '0 0 0.5rem',
                color: 'var(--text-primary, #111827)',
              }}
            >
              Belum ada pengguna
            </h3>
            <p
              style={{
                color: 'var(--text-muted, #6B7280)',
                maxWidth: 360,
                margin: '0 auto 1.5rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              Undang anggota tim untuk mulai bekerja sama. Mereka akan melihat
              dashboard sesuai peran yang diberikan.
            </p>
            {canManage && (
              <Button onClick={() => alert('Invite user - fitur segera hadir')}>
                <UserPlus size={14} /> Undang Pengguna Pertama
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p
              style={{
                color: 'var(--text-muted, #6B7280)',
                fontSize: '0.9rem',
              }}
            >
              Tidak ada pengguna yang cocok dengan pencarian "{search}"
            </p>
            <Button
              variant="ghost"
              onClick={() => setSearch('')}
              style={{ marginTop: '0.5rem' }}
            >
              Reset pencarian
            </Button>
          </div>
        ) : (
          <div className="table user-management-table">
            <div className="tr head">
              <span>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.size === slice.length && slice.length > 0}
                    onChange={toggleSelectAll}
                    style={{ accentColor: 'var(--accent-primary, #2563EB)' }}
                  />
                  Pengguna
                </label>
              </span>
              <span>Peran</span>
              <span>Cabang</span>
              <span>Status</span>
              <span>Aktivitas</span>
              <span>Aksi</span>
            </div>
            {slice.map((row) => {
              const activityStatus = getActivityStatus(row.last_login);
              const activityInfo = activityStatusMap[activityStatus];
              const roleColor =
                roleColorMap[row.role_key] ?? 'var(--text-muted, #6B7280)';
              const userName = row.profile?.full_name ?? 'Tanpa nama';
              const avatarUrl = safeImageUrl(row.profile?.avatar_url);
              return (
                <div className="tr" key={row.id}>
                  <span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        style={{
                          accentColor: 'var(--accent-primary, #2563EB)',
                        }}
                      />
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `color-mix(in srgb, ${roleColor} 12%, transparent)`,
                          color: roleColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          flexShrink: 0,
                          border: `1.5px solid color-mix(in srgb, ${roleColor} 25%, transparent)`,
                        }}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          getInitials(userName)
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <b
                          style={{
                            display: 'block',
                            color: 'var(--text-primary, #111827)',
                            fontSize: '0.88rem',
                          }}
                        >
                          {userName}
                        </b>
                        <small
                          style={{
                            display: 'block',
                            color: 'var(--text-muted, #6B7280)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {row.profile?.email ?? row.user_id}
                        </small>
                      </div>
                    </div>
                  </span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: `color-mix(in srgb, ${roleColor} 10%, transparent)`,
                        color: roleColor,
                      }}
                    >
                      {row.role_key}
                    </span>
                  </span>
                  <span
                    style={{
                      color: 'var(--text-secondary, #4B5563)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {(row.branches ?? [])
                      .filter((item) => item.status === 'active')
                      .map((item) => item.branch?.name ?? item.branch_id)
                      .join(', ') || '—'}
                  </span>
                  <span>
                    <StatusBadge status={row.status} />
                  </span>
                  <span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: activityInfo.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted, #6B7280)',
                        }}
                      >
                        {formatTimestamp(row.last_login)}
                      </span>
                    </div>
                  </span>
                  <span className="table-actions">
                    <Button
                      variant="ghost"
                      onClick={() => setViewing(row)}
                      style={{ fontSize: '0.82rem' }}
                    >
                      Lihat
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        onClick={() => openEdit(row)}
                        style={{ fontSize: '0.82rem' }}
                      >
                        Edit
                      </Button>
                    )}
                    {canManage && row.status === 'active' && (
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmSuspend(row)}
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--danger, #DC2626)',
                        }}
                      >
                        Nonaktifkan
                      </Button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Detail Pengguna"
      >
        {viewing && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `color-mix(in srgb, ${roleColorMap[viewing.role_key] ?? '#6B7280'} 12%, transparent)`,
                  color: roleColorMap[viewing.role_key] ?? '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  border: `2px solid color-mix(in srgb, ${roleColorMap[viewing.role_key] ?? '#6B7280'} 25%, transparent)`,
                }}
              >
                {getInitials(viewing.profile?.full_name ?? 'TN')}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: 'var(--text-primary, #111827)',
                    fontSize: '1.1rem',
                  }}
                >
                  {viewing.profile?.full_name ?? 'Tanpa nama'}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-muted, #6B7280)',
                    fontSize: '0.85rem',
                  }}
                >
                  {viewing.profile?.email ?? viewing.user_id}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-muted, #6B7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Peran
                </span>
                <p style={{ margin: '0.25rem 0 0' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: `color-mix(in srgb, ${roleColorMap[viewing.role_key] ?? '#6B7280'} 10%, transparent)`,
                      color: roleColorMap[viewing.role_key] ?? '#6B7280',
                    }}
                  >
                    {viewing.role_key}
                  </span>
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-muted, #6B7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Status
                </span>
                <p style={{ margin: '0.25rem 0 0' }}>
                  <StatusBadge status={viewing.status} />
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-muted, #6B7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Dibuat
                </span>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: 'var(--text-primary, #111827)',
                    fontSize: '0.88rem',
                  }}
                >
                  {new Date(viewing.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-muted, #6B7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Login Terakhir
                </span>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: 'var(--text-primary, #111827)',
                    fontSize: '0.88rem',
                  }}
                >
                  {viewing.last_login
                    ? new Date(viewing.last_login).toLocaleString('id-ID')
                    : '—'}
                </p>
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Cabang
              </span>
              <div
                style={{
                  marginTop: '0.4rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                }}
              >
                {(viewing.branches ?? []).filter((b) => b.status === 'active')
                  .length > 0 ? (
                  (viewing.branches ?? [])
                    .filter((b) => b.status === 'active')
                    .map((b) => (
                      <span
                        key={b.branch_id}
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          background: 'var(--bg-primary, #F3F4F6)',
                          color: 'var(--text-secondary, #4B5563)',
                          border: '1px solid var(--border-color, #E5E7EB)',
                        }}
                      >
                        {b.branch?.name ?? b.branch_id} · {b.role_key}
                      </span>
                    ))
                ) : (
                  <span
                    style={{
                      color: 'var(--text-muted, #94A3B8)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Tidak ada cabang
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Kelola ${editing?.profile?.full_name ?? 'pengguna'}`}
        footer={
          <Button type="submit" form="user-edit-form">
            Simpan
          </Button>
        }
      >
        <form id="user-edit-form" className="inline-form" onSubmit={save}>
          <Field label="Peran perusahaan">
            <Select
              value={form.roleKey}
              onChange={(event) =>
                setForm({ ...form, roleKey: event.target.value })
              }
            >
              {companyRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="active">active</option>
              <option value="suspended">suspended</option>
            </Select>
          </Field>
          <fieldset className="branch-role-grid">
            <legend>Akses cabang</legend>
            {ctx.accessible_branches.map((branch) => {
              const value = form.branches[branch.id] ?? {
                selected: false,
                roleKey: 'employee',
              };
              return (
                <div className="branch-role-row" key={branch.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={value.selected}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          branches: {
                            ...form.branches,
                            [branch.id]: {
                              ...value,
                              selected: event.target.checked,
                            },
                          },
                        })
                      }
                    />{' '}
                    {branch.name}
                  </label>
                  <Select
                    disabled={!value.selected}
                    value={value.roleKey}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        branches: {
                          ...form.branches,
                          [branch.id]: {
                            ...value,
                            roleKey: event.target.value,
                          },
                        },
                      })
                    }
                  >
                    {branchRoles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </Select>
                </div>
              );
            })}
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmSuspend}
        title="Nonaktifkan pengguna?"
        message="Pengguna akan kehilangan akses ke perusahaan ini."
        confirmLabel="Nonaktifkan"
        danger
        onCancel={() => setConfirmSuspend(null)}
        onConfirm={() => confirmSuspend && void suspend(confirmSuspend)}
      />
    </>
  );
}
