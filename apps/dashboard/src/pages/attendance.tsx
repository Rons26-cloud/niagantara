import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { CalendarCheck } from 'lucide-react';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function AttendancePage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState('');
  const [msg, setMsg] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/attendance', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function clock(action: string) {
    if (!employee) return;
    try {
      await api('/attendance/clock', token, company, {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employee,
          branchId: ctx.accessible_branches[0]?.id,
          action,
        }),
      });
      setMsg(action === 'CLOCK_IN' ? 'Clock in berhasil.' : 'Clock out berhasil.');
      setEmployee('');
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter(
    (r) => r.clock_in_at?.slice(0, 10) === today,
  );
  const present = todayRows.filter((r) => r.status === 'PRESENT').length;
  const late = todayRows.filter((r) => r.status === 'LATE').length;
  const absent = todayRows.filter((r) => r.status === 'ABSENT').length;

  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Hadir" value={String(present)} tone="success" />
        <StatCard label="Terlambat" value={String(late)} tone="warning" />
        <StatCard label="Tidak Hadir" value={String(absent)} tone="danger" />
        <StatCard label="Total Records" value={String(rows.length)} />
      </div>

      {ctx.permissions.includes('attendance.clock') && (
        <section className="panel">
          <h2>Clock In / Clock Out</h2>
          <div className="ng-filterbar">
            <Field label="Employee ID">
              <Input
                placeholder="Employee ID"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              />
            </Field>
            <Button onClick={() => clock('CLOCK_IN')}>Clock In</Button>
            <Button variant="secondary" onClick={() => clock('CLOCK_OUT')}>
              Clock Out
            </Button>
          </div>
          {msg && <p className="muted">{msg}</p>}
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.attendance')}</h2>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada data absensi."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Karyawan', 'Branch', 'Tanggal', 'Clock In', 'Clock Out', 'Status'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any) => (
              <div className="tr" key={r.id}>
                <span>{r.employee?.name ?? r.employee_id ?? '—'}</span>
                <span>{r.branch?.name ?? '—'}</span>
                <span>
                  {r.clock_in_at
                    ? new Date(r.clock_in_at).toLocaleDateString('id-ID')
                    : '—'}
                </span>
                <span>
                  {r.clock_in_at
                    ? new Date(r.clock_in_at).toLocaleTimeString('id-ID')
                    : '—'}
                </span>
                <span>
                  {r.clock_out_at
                    ? new Date(r.clock_out_at).toLocaleTimeString('id-ID')
                    : '—'}
                </span>
                <span>
                  <StatusBadge status={r.status ?? '—'} />
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
