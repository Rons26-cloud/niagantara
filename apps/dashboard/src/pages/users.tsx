import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import type { OrgCtx } from '../enhancements';
import { Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, LoadingState, Modal, Pagination, Select, StatusBadge, usePaged } from '@niagantara/ui';
import { UsersRound } from 'lucide-react';

type BranchMembership = { branch_id: string; role_key: string; status: string; branch?: { id: string; name: string } };
type CompanyUser = { id: string; user_id: string; role_key: string; status: string; created_at: string; profile?: { full_name?: string; avatar_url?: string }; branches?: BranchMembership[] };
const companyRoles = ['owner', 'company_admin', 'finance', 'accountant', 'hr'];
const branchRoles = ['manager', 'supervisor', 'cashier', 'warehouse', 'employee'];

export function UsersPage({ company, token, ctx }: { company: string; token: string; ctx: OrgCtx }) {
  const [rows, setRows] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CompanyUser | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<CompanyUser | null>(null);
  const [form, setForm] = useState({ roleKey: '', status: 'active', branches: {} as Record<string, { selected: boolean; roleKey: string }> });
  const load = () => { setLoading(true); setError(null); api<CompanyUser[]>('/users', token, company).then(setRows).catch((value) => setError(value instanceof ApiError ? `${value.status} · ${value.code}` : 'Pengguna gagal dimuat.')).finally(() => setLoading(false)); };
  useEffect(() => void load(), [company, token]);
  const filtered = rows.filter((row) => `${row.profile?.full_name ?? ''} ${row.user_id} ${row.role_key}`.toLowerCase().includes(search.trim().toLowerCase()));
  const { page, pageCount, setPage, slice } = usePaged(filtered);
  const canManage = ctx.permissions.includes('user.manage') && ['owner', 'company_admin'].some((role) => ctx.roles.includes(role));

  function openEdit(row: CompanyUser) {
    const assigned = new Map((row.branches ?? []).map((item) => [item.branch_id, item]));
    setForm({ roleKey: row.role_key, status: row.status, branches: Object.fromEntries(ctx.accessible_branches.map((branch) => { const membership = assigned.get(branch.id); return [branch.id, { selected: membership?.status === 'active', roleKey: membership?.role_key ?? 'employee' }]; })) });
    setEditing(row);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setMessage('Menyimpan...');
    try {
      await api(`/users/${editing.user_id}`, token, company, { method: 'PATCH', body: JSON.stringify({ roleKey: form.roleKey, status: form.status, branches: Object.entries(form.branches).filter(([, value]) => value.selected).map(([branchId, value]) => ({ branchId, roleKey: value.roleKey })) }) });
      setEditing(null); setMessage('Pengguna berhasil diperbarui.'); load();
    } catch (value) { setMessage(value instanceof ApiError ? `${value.status} · ${value.code}` : 'Pengguna tidak dapat diperbarui.'); }
  }
  async function suspend(row: CompanyUser) {
    setMessage('Menyimpan...');
    try { await api(`/users/${row.user_id}`, token, company, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) }); setMessage('Akses pengguna dinonaktifkan.'); load(); }
    catch (value) { setMessage(value instanceof ApiError ? `${value.status} · ${value.code}` : 'Akses pengguna tidak dapat dinonaktifkan.'); }
  }
  if (loading) return <LoadingState label="Memuat pengguna" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  return <>
    <div className="ng-filterbar"><Field label="Cari pengguna"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama, ID, atau peran" /></Field></div>
    {message && <p className="muted" role="status">{message}</p>}
    <section className="panel"><div className="panel-head"><h2>Pengguna</h2><span>{filtered.length} anggota</span></div>
      {rows.length === 0 ? <EmptyState icon={<UsersRound size={28} />} title="Belum ada pengguna" description="Undangan akun belum tersedia pada API saat ini." /> : filtered.length === 0 ? <EmptyState icon={<UsersRound size={28} />} title="Tidak ada hasil" description="Coba pencarian lain." /> : <div className="table user-management-table"><div className="tr head"><span>Pengguna</span><span>Peran</span><span>Cabang</span><span>Status</span><span>Aksi</span></div>{slice.map((row) => <div className="tr" key={row.id}><span><b>{row.profile?.full_name ?? 'Tanpa nama'}</b><small>{row.user_id}</small></span><span>{row.role_key}</span><span>{(row.branches ?? []).filter((item) => item.status === 'active').map((item) => item.branch?.name ?? item.branch_id).join(', ') || '—'}</span><span><StatusBadge status={row.status} /></span><span className="table-actions">{canManage && <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button>}{canManage && row.status === 'active' && <Button variant="ghost" onClick={() => setConfirmSuspend(row)}>Nonaktifkan</Button>}</span></div>)}</div>}
      <Pagination page={page} pageCount={pageCount} onPage={setPage} />
    </section>
    <Modal open={!!editing} onClose={() => setEditing(null)} title={`Kelola ${editing?.profile?.full_name ?? 'pengguna'}`} footer={<Button type="submit" form="user-edit-form">Simpan</Button>}><form id="user-edit-form" className="inline-form" onSubmit={save}><Field label="Peran perusahaan"><Select value={form.roleKey} onChange={(event) => setForm({ ...form, roleKey: event.target.value })}>{companyRoles.map((role) => <option key={role}>{role}</option>)}</Select></Field><Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">active</option><option value="suspended">suspended</option></Select></Field><fieldset className="branch-role-grid"><legend>Akses cabang</legend>{ctx.accessible_branches.map((branch) => { const value = form.branches[branch.id] ?? { selected: false, roleKey: 'employee' }; return <div className="branch-role-row" key={branch.id}><label><input type="checkbox" checked={value.selected} onChange={(event) => setForm({ ...form, branches: { ...form.branches, [branch.id]: { ...value, selected: event.target.checked } } })} /> {branch.name}</label><Select disabled={!value.selected} value={value.roleKey} onChange={(event) => setForm({ ...form, branches: { ...form.branches, [branch.id]: { ...value, roleKey: event.target.value } } })}>{branchRoles.map((role) => <option key={role}>{role}</option>)}</Select></div>; })}</fieldset></form></Modal>
    <ConfirmDialog open={!!confirmSuspend} title="Nonaktifkan pengguna?" message="Pengguna akan kehilangan akses ke perusahaan ini." confirmLabel="Nonaktifkan" danger onCancel={() => setConfirmSuspend(null)} onConfirm={() => confirmSuspend && void suspend(confirmSuspend)} />
  </>;
}
