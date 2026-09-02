import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
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
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Clock3, Plus, User } from 'lucide-react';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

type Employee = {
  id: string;
  name: string;
  employee_code?: string;
  job_title?: string;
};

type Shift = {
  id: string;
  cashier_id: string;
  branch_id: string;
  store_id?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  status: string;
  opened_at: string;
  closed_at?: string;
  cashier?: { id: string; name: string; employee_code?: string };
  branch?: { id: string; name: string };
};

export function ShiftPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const branch = ctx.accessible_branches[0];
  const store = ctx.stores.find((x: any) => x.id === branch?.store_id);
  const [rows, setRows] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState<Shift | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    cashierId: '',
    openingCash: '500000',
    branchId: branch?.id ?? '',
  });
  const [closeCash, setCloseCash] = useState('0');

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<Shift[]>('/shifts', token, company),
      api<Employee[]>('/employees', token, company).catch(() => []),
    ])
      .then(([shifts, emps]) => {
        setRows(shifts);
        setEmployees(Array.isArray(emps) ? emps : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const resources =
        (event as CustomEvent<{ resources?: string[] }>).detail?.resources ??
        [];
      if (resources.includes('shifts')) load();
    };
    window.addEventListener('niagantara:realtime', onRealtime);
    return () => window.removeEventListener('niagantara:realtime', onRealtime);
  }, [company, token]);

  async function openShift(e: FormEvent) {
    e.preventDefault();
    if (!form.branchId) return;
    setMsg('Membuka shift...');
    try {
      const targetBranch =
        ctx.accessible_branches.find((b: any) => b.id === form.branchId) ??
        branch;
      const targetStore =
        ctx.stores.find((s: any) => s.id === targetBranch?.store_id) ?? store;
      await api('/shifts/open', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': form.branchId },
        body: JSON.stringify({
          storeId: targetStore?.id,
          branchId: form.branchId,
          cashierId: form.cashierId || undefined,
          openingCash: Number(form.openingCash),
        }),
      });
      setMsg('✓ Shift berhasil dibuka.');
      setShowOpen(false);
      setForm({
        cashierId: '',
        openingCash: '500000',
        branchId: branch?.id ?? '',
      });
      load();
    } catch {
      setMsg('Gagal membuka shift.');
    }
  }

  async function closeShift(shift: Shift) {
    setMsg('Menutup shift...');
    try {
      await api(`/shifts/${shift.id}/close`, token, company, {
        method: 'POST',
        body: JSON.stringify({ closingCash: Number(closeCash) }),
      });
      setMsg('✓ Shift berhasil ditutup.');
      setShowClose(null);
      setCloseCash('0');
      load();
    } catch {
      setMsg('Gagal menutup shift.');
    }
  }

  const openShifts = rows.filter((x) => x.status === 'OPEN');
  const closedShifts = rows.filter((x) => x.status === 'CLOSED');
  const totalOpening = rows.reduce(
    (n, r) => n + Number(r.opening_cash ?? 0),
    0,
  );
  const totalClosing = closedShifts.reduce(
    (n, r) => n + Number(r.closing_cash ?? 0),
    0,
  );
  const totalDiff = closedShifts.reduce(
    (n, r) => n + Number(r.cash_difference ?? 0),
    0,
  );

  const { page, pageCount, setPage, slice } = usePaged(rows);
  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const canOpenShift = ctx.permissions.includes('shift.open');
  const canCloseShift = ctx.permissions.includes('shift.close');

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Shift Aktif"
          value={String(openShifts.length)}
          tone={openShifts.length > 0 ? 'success' : 'default'}
        />
        <StatCard label="Shift Ditutup" value={String(closedShifts.length)} />
        <StatCard label="Total Kas Awal" value={fmtRp(totalOpening)} />
        <StatCard
          label="Selisih Kas"
          value={fmtRp(totalDiff)}
          tone={
            totalDiff === 0 ? 'default' : totalDiff > 0 ? 'success' : 'danger'
          }
        />
      </div>

      {canOpenShift && (
        <section className="panel">
          <div className="panel-head">
            <h2>Buka Shift Baru</h2>
            <Button onClick={() => setShowOpen(true)}>
              <Plus size={14} /> Buka Shift
            </Button>
          </div>
          {msg && (
            <p className="muted" role="status">
              {msg}
            </p>
          )}
        </section>
      )}

      {openShifts.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Shift Aktif ({openShifts.length})</h2>
          </div>
          <div className="table">
            <div className="tr head">
              {[
                'Kasir',
                'Cabang',
                'Status',
                'Kas Awal',
                'Waktu Buka',
                'Durasi',
                'Aksi',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {openShifts.map((x) => {
              const opened = new Date(x.opened_at);
              const now = new Date();
              const durationMin = Math.floor(
                (now.getTime() - opened.getTime()) / 60000,
              );
              const hours = Math.floor(durationMin / 60);
              const mins = durationMin % 60;
              return (
                <div className="tr" key={x.id}>
                  <span>
                    <span className="shift-cashier">
                      <span className="shift-cashier-avatar">
                        <User size={14} />
                      </span>
                      <span>
                        <b>{x.cashier?.name ?? 'Kasir'}</b>
                        <small>{x.cashier?.employee_code ?? ''}</small>
                      </span>
                    </span>
                  </span>
                  <span>{x.branch?.name ?? '—'}</span>
                  <span>
                    <StatusBadge status={x.status} />
                  </span>
                  <span>{fmtRp(Number(x.opening_cash ?? 0))}</span>
                  <span>
                    {opened.toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  <span>{hours > 0 ? `${hours}j ${mins}m` : `${mins}m`}</span>
                  <span>
                    {canCloseShift && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setShowClose(x);
                          setCloseCash(String(x.opening_cash ?? 0));
                        }}
                      >
                        Tutup
                      </Button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Riwayat Shift</h2>
          <span>{rows.length} total</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Clock3 size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada riwayat shift."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Status',
                'Kasir',
                'Cabang',
                'Kas Awal',
                'Kas Tutup',
                'Selisih',
                'Waktu Buka',
                'Waktu Tutup',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((x) => {
              const diff = Number(x.cash_difference ?? 0);
              return (
                <div className="tr" key={x.id}>
                  <span>
                    <StatusBadge status={x.status} />
                  </span>
                  <span>
                    <span className="shift-cashier">
                      <span className="shift-cashier-avatar">
                        <User size={14} />
                      </span>
                      <span>
                        <b>{x.cashier?.name ?? '—'}</b>
                        <small>{x.cashier?.employee_code ?? ''}</small>
                      </span>
                    </span>
                  </span>
                  <span>{x.branch?.name ?? '—'}</span>
                  <span>{fmtRp(Number(x.opening_cash ?? 0))}</span>
                  <span>
                    {x.closing_cash != null
                      ? fmtRp(Number(x.closing_cash))
                      : '—'}
                  </span>
                  <span
                    className={
                      diff === 0
                        ? ''
                        : diff > 0
                          ? 'shift-diff-positive'
                          : 'shift-diff-negative'
                    }
                  >
                    {x.cash_difference != null ? fmtRp(diff) : '—'}
                  </span>
                  <span>
                    {x.opened_at
                      ? new Date(x.opened_at).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                  <span>
                    {x.closed_at
                      ? new Date(x.closed_at).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      <Modal
        open={showOpen}
        onClose={() => setShowOpen(false)}
        title="Buka Shift Baru"
        footer={
          <Button type="submit" form="shift-open-form">
            <Clock3 size={14} /> Buka Shift
          </Button>
        }
      >
        <form id="shift-open-form" className="inline-form" onSubmit={openShift}>
          <Field label="Kasir (Pilih Karyawan)">
            <Select
              value={form.cashierId}
              onChange={(e) => setForm({ ...form, cashierId: e.target.value })}
            >
              <option value="">— Pilih Kasir —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                  {emp.employee_code ? ` (${emp.employee_code})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cabang">
            <Select
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {ctx.accessible_branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kas Awal (Opening Cash)">
            <Input
              type="number"
              min="0"
              required
              value={form.openingCash}
              onChange={(e) =>
                setForm({ ...form, openingCash: e.target.value })
              }
            />
          </Field>
          <p className="muted">
            Kasir yang dipilih akan menjadi penanggung jawab shift ini.
          </p>
        </form>
      </Modal>

      <Modal
        open={!!showClose}
        onClose={() => setShowClose(null)}
        title={`Tutup Shift — ${showClose?.cashier?.name ?? 'Kasir'}`}
        footer={
          <Button onClick={() => showClose && closeShift(showClose)}>
            Tutup Shift
          </Button>
        }
      >
        {showClose && (
          <div className="shift-close-detail">
            <dl className="def-grid">
              <dt>Kasir</dt>
              <dd>{showClose.cashier?.name ?? '—'}</dd>
              <dt>Cabang</dt>
              <dd>{showClose.branch?.name ?? '—'}</dd>
              <dt>Kas Awal</dt>
              <dd>{fmtRp(Number(showClose.opening_cash ?? 0))}</dd>
              <dt>Waktu Buka</dt>
              <dd>
                {showClose.opened_at
                  ? new Date(showClose.opened_at).toLocaleString('id-ID')
                  : '—'}
              </dd>
            </dl>
            <Field label="Masukkan Jumlah Kas Tutup">
              <Input
                type="number"
                min="0"
                required
                value={closeCash}
                onChange={(e) => setCloseCash(e.target.value)}
              />
            </Field>
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              Selisih:{' '}
              <b>
                {fmtRp(Number(closeCash) - Number(showClose.opening_cash ?? 0))}
              </b>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
