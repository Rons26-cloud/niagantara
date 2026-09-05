import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../api';
import type { OrgCtx } from '../enhancements';
import { Button, ConfirmDialog, EmptyState, Field, Input, LoadingState, Select, StatusBadge } from '@niagantara/ui';
import { Copy, KeyRound, Plus, Trash2, UserRound } from 'lucide-react';

type Cashier = { user_id: string; role_key: string; status: string; profile?: { full_name?: string; email?: string }; branches?: { branch_id: string; role_key: string; status: string; branch?: { name?: string } }[] };

export function PosCashiersPage({ company, token, ctx }: { company: string; token: string; ctx: OrgCtx }) {
  const [rows, setRows] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string; posPath: string } | null>(null);
  const [confirm, setConfirm] = useState<Cashier | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', branchId: ctx.accessible_branches[0]?.id ?? '' });
  const canManage = ctx.permissions.includes('user.manage') && ['owner', 'company_admin'].some((role) => ctx.roles.includes(role));
  const branches = ctx.accessible_branches;

  const load = () => {
    setLoading(true); setError('');
    api<Cashier[]>('/users', token, company).then((users) => setRows(users.filter((user) => user.branches?.some((branch) => branch.role_key === 'cashier')))).catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'Kasir gagal dimuat.')).finally(() => setLoading(false));
  };
  useEffect(() => { void load(); }, [company, token]);
  useEffect(() => { if (!form.branchId && branches[0]) setForm((value) => ({ ...value, branchId: branches[0].id })); }, [branches, form.branchId]);

  const activeCount = useMemo(() => rows.filter((row) => row.branches?.some((branch) => branch.role_key === 'cashier' && branch.status === 'active')).length, [rows]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(''); setError('');
    try {
      const result = await api<{ email: string; password?: string; posPath: string }>('/users/cashiers', token, company, { method: 'POST', body: JSON.stringify(form) });
      setCreated({ email: result.email, password: form.password, posPath: result.posPath });
      setOpen(false); setForm({ fullName: '', email: '', password: '', branchId: branches[0]?.id ?? '' }); setMessage('Kasir berhasil ditambahkan. Simpan kredensial ini untuk pegawai.'); load();
    } catch (e) { setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'Kasir gagal ditambahkan.'); }
  }
  async function remove(row: Cashier) {
    try { await api(`/users/cashiers/${row.user_id}`, token, company, { method: 'DELETE' }); setConfirm(null); setMessage('Akses POS kasir dihapus.'); load(); }
    catch (e) { setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'Akses POS gagal dihapus.'); }
  }
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setMessage('Tersalin ke clipboard.'); } catch { setMessage('Gagal menyalin. Silakan salin manual.'); } }
  if (loading) return <LoadingState label="Memuat kasir POS" />;
  return <>
    <section className="panel" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div><p className="eyebrow">AKSES POS</p><h2 style={{ margin: 0 }}>Kasir POS</h2><p className="muted">Kelola akun pegawai yang boleh menggunakan kasir di setiap cabang.</p></div>
        {canManage && <Button onClick={() => { setCreated(null); setOpen(true); }}><Plus size={15} /> Tambah Kasir</Button>}
      </div>
      <div className="metrics" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}><article className="user-stat-card"><span>Kasir terdaftar</span><strong>{rows.length}</strong></article><article className="user-stat-card"><span>Akses aktif</span><strong>{activeCount}</strong></article></div>
    </section>
    {message && <p className="muted" role="status">{message}</p>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {created && <section className="panel" style={{ borderColor: 'var(--accent-primary,#2563eb)' }}><h3 style={{ marginTop: 0 }}>Akun kasir siap digunakan</h3><p className="muted">Bagikan data ini melalui kanal internal yang aman. Kata sandi hanya ditampilkan sekali.</p><div style={{ display: 'grid', gap: '.6rem' }}><label>Email<input readOnly value={created.email} onFocus={(e) => e.currentTarget.select()} /></label><label>Kata sandi<input readOnly value={created.password} onFocus={(e) => e.currentTarget.select()} /></label><label>Link POS<input readOnly value={`${window.location.origin}${created.posPath}`} onFocus={(e) => e.currentTarget.select()} /></label></div><div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.75rem' }}><Button variant="secondary" onClick={() => void copy(`${created.email}\n${created.password}\n${window.location.origin}${created.posPath}`)}><Copy size={14} /> Salin kredensial</Button><Button variant="ghost" onClick={() => setCreated(null)}>Tutup</Button></div></section>}
    {rows.length === 0 ? <EmptyState icon={<UserRound />} title="Belum ada kasir POS" description="Tambahkan akun kasir agar pegawai bisa masuk ke POS." /> : <section className="panel"><div className="data-table"><div className="tr th"><span>Kasir</span><span>Cabang</span><span>Status</span><span>Aksi</span></div>{rows.map((row) => { const branch = row.branches?.find((item) => item.role_key === 'cashier'); return <div className="tr" key={row.user_id}><span><b>{row.profile?.full_name ?? 'Kasir'}</b><small>{row.profile?.email ?? row.user_id}</small></span><span>{branch?.branch?.name ?? branch?.branch_id ?? '—'}</span><span><StatusBadge status={branch?.status ?? row.status} /></span><span className="table-actions">{canManage && <Button variant="ghost" onClick={() => setConfirm(row)} style={{ color: 'var(--danger,#dc2626)' }}><Trash2 size={14} /> Hapus akses</Button>}</span></div>; })}</div></section>}
    <ConfirmDialog open={!!confirm} title="Hapus akses POS?" message="Kasir tidak dapat masuk ke POS cabang ini lagi. Akun pengguna tetap dipertahankan." confirmLabel="Hapus akses" danger onCancel={() => setConfirm(null)} onConfirm={() => confirm && void remove(confirm)} />
    {open && <div className="pos-modal-overlay"><div className="pos-modal" role="dialog" aria-modal="true"><div className="pos-modal-header"><div><KeyRound size={18} /><h3>Tambah kasir POS</h3></div><button type="button" onClick={() => setOpen(false)} aria-label="Tutup">×</button></div><form onSubmit={submit} className="inline-form"><Field label="Nama lengkap"><Input required minLength={2} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field><Field label="Gmail / email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Kata sandi sementara"><Input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" /></Field><Field label="Cabang POS"><Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></Field><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit">Buat akun kasir</Button></div></form></div></div>}
  </>;
}
