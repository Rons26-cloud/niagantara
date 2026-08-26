import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Pagination,
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Clock3 } from 'lucide-react';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
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
  const [rows, setRows] = useState<any[]>([]);
  const [cash, setCash] = useState('0');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/shifts', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  const openShift = async () => {
    if (!branch || !store) return;
    setMsg('...');
    try {
      await api('/shifts/open', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': branch.id },
        body: JSON.stringify({
          storeId: store.id,
          branchId: branch.id,
          openingCash: Number(cash),
        }),
      });
      setMsg('Shift berhasil dibuka.');
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  };

  const closeShift = async (id: string) => {
    setMsg('...');
    try {
      await api(`/shifts/${id}/close`, token, company, {
        method: 'POST',
        body: JSON.stringify({ closingCash: Number(cash) }),
      });
      setMsg('Shift berhasil ditutup.');
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  };

  const openShifts = rows.filter((x) => x.status === 'OPEN');
  const closedShifts = rows.filter((x) => x.status === 'CLOSED');

  const { page, pageCount, setPage, slice } = usePaged(rows);

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Shift Aktif" value={String(openShifts.length)} tone={openShifts.length > 0 ? 'success' : 'default'} />
        <StatCard label="Shift Ditutup" value={String(closedShifts.length)} />
        <StatCard label="Total Shift" value={String(rows.length)} />
        <StatCard label="Kas Awal" value={fmtRp(rows.reduce((n: number, r: any) => n + Number(r.opening_cash ?? 0), 0))} />
      </div>

      {ctx.permissions.includes('shift.open') && (
        <section className="panel">
          <h2>Buka Shift Baru</h2>
          <div className="ng-filterbar">
            <Field label={t('common.openingCash')}>
              <Input
                type="number"
                min="0"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
              />
            </Field>
            <Button onClick={openShift}>Buka Shift</Button>
          </div>
          {msg && <p className="muted">{msg}</p>}
        </section>
      )}

      {openShifts.length > 0 && (
        <section className="panel">
          <h2>Shift Aktif</h2>
          <div className="table">
            <div className="tr head">
              {['Kasir', 'Branch', 'Status', 'Kas Awal', 'Waktu Buka', 'Aksi'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {openShifts.map((x: any) => (
              <div className="tr" key={x.id}>
                <span>{x.cashier?.name ?? x.cashier_id ?? '—'}</span>
                <span>{x.branch?.name ?? '—'}</span>
                <span>
                  <StatusBadge status={x.status} />
                </span>
                <span>{fmtRp(Number(x.opening_cash ?? 0))}</span>
                <span>
                  {x.opened_at
                    ? new Date(x.opened_at).toLocaleString('id-ID')
                    : '—'}
                </span>
                <span>
                  {ctx.permissions.includes('shift.close') && (
                    <Button variant="danger" onClick={() => closeShift(x.id)}>
                      Tutup
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Riwayat Shift</h2>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Clock3 size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada riwayat shift."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Status', 'Kasir', 'Kas Awal', 'Kas Tutup', 'Waktu Buka', 'Waktu Tutup'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((x: any) => (
              <div className="tr" key={x.id}>
                <span>
                  <StatusBadge status={x.status} />
                </span>
                <span>{x.cashier?.name ?? x.cashier_id ?? '—'}</span>
                <span>{fmtRp(Number(x.opening_cash ?? 0))}</span>
                <span>
                  {x.closing_cash != null ? fmtRp(Number(x.closing_cash)) : '—'}
                </span>
                <span>
                  {x.opened_at
                    ? new Date(x.opened_at).toLocaleString('id-ID')
                    : '—'}
                </span>
                <span>
                  {x.closed_at
                    ? new Date(x.closed_at).toLocaleString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>
    </>
  );
}
