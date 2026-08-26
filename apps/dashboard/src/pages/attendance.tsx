import { FormEvent, useEffect, useRef, useState } from 'react';
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
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import {
  CalendarCheck,
  Clock,
  Fingerprint,
  LogIn,
  LogOut,
  Monitor,
  ScanBarcode,
  User,
  Video,
  VideoOff,
} from 'lucide-react';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

type AttendanceRecord = {
  id: string;
  employee_id: string;
  branch_id: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
  employee?: { id: string; name: string; employee_code?: string; job_title?: string };
  branch?: { id: string; name: string; code?: string };
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
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState('');
  const [msg, setMsg] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [showKiosk, setShowKiosk] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api<AttendanceRecord[]>('/attendance', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const resources = (event as CustomEvent<{ resources?: string[] }>).detail?.resources ?? [];
      if (resources.includes('attendance')) load();
    };
    window.addEventListener('niagantara:realtime', onRealtime);
    return () => window.removeEventListener('niagantara:realtime', onRealtime);
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
  const filteredRows = filterDate
    ? rows.filter((r) => r.clock_in_at?.slice(0, 10) === filterDate)
    : rows;
  const todayRows = rows.filter((r) => r.clock_in_at?.slice(0, 10) === today);
  const present = todayRows.filter((r) => r.status === 'PRESENT').length;
  const late = todayRows.filter((r) => r.status === 'LATE').length;
  const absent = todayRows.filter((r) => r.status === 'ABSENT').length;
  const clockedOut = todayRows.filter((r) => r.clock_out_at != null).length;
  const stillIn = todayRows.filter((r) => r.clock_out_at == null).length;

  const { page, pageCount, setPage, slice } = usePaged(filteredRows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (showKiosk) {
    return (
      <KioskMode
        company={company}
        token={token}
        branch={ctx.accessible_branches[0]}
        onExit={() => setShowKiosk(false)}
        onClocked={() => load()}
      />
    );
  }

  return (
    <>
      <div className="metrics">
        <StatCard label="Hadir Hari Ini" value={String(present)} tone="success" />
        <StatCard label="Terlambat" value={String(late)} tone={late > 0 ? 'warning' : 'default'} />
        <StatCard label="Sedang Bekerja" value={String(stillIn)} tone={stillIn > 0 ? 'success' : 'default'} />
        <StatCard label="Sudah Pulang" value={String(clockedOut)} />
      </div>

      {ctx.permissions.includes('attendance.clock') && (
        <section className="panel">
          <div className="panel-head">
            <h2>Clock In / Clock Out Manual</h2>
            <Button onClick={() => setShowKiosk(true)}>
              <Monitor size={14} /> Buka Mode Layar
            </Button>
          </div>
          <div className="ng-filterbar">
            <Field label="Employee ID">
              <Input
                placeholder="Masukkan ID karyawan atau scan barcode"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    clock('CLOCK_IN');
                  }
                }}
              />
            </Field>
            <Button onClick={() => clock('CLOCK_IN')}>
              <LogIn size={14} /> Clock In
            </Button>
            <Button variant="secondary" onClick={() => clock('CLOCK_OUT')}>
              <LogOut size={14} /> Clock Out
            </Button>
          </div>
          {msg && <p className="muted" role="status">{msg}</p>}
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.attendance')}</h2>
          <Field label="Tanggal">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </Field>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada data absensi pada tanggal ini."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Karyawan', 'Kode', 'Cabang', 'Tanggal', 'Clock In', 'Clock Out', 'Durasi', 'Status'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any) => {
              const clockIn = r.clock_in_at ? new Date(r.clock_in_at) : null;
              const clockOut = r.clock_out_at ? new Date(r.clock_out_at) : null;
              const duration =
                clockIn && clockOut
                  ? `${Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000)}m`
                  : clockIn
                    ? '—'
                    : '—';
              return (
                <div className="tr" key={r.id}>
                  <span>
                    <span className="att-employee">
                      <span className="att-employee-avatar">
                        {(r.employee?.name ?? '?')[0]?.toUpperCase()}
                      </span>
                      <span>
                        <b>{r.employee?.name ?? r.employee_id ?? '—'}</b>
                        <small>{r.employee?.job_title ?? ''}</small>
                      </span>
                    </span>
                  </span>
                  <span>{r.employee?.employee_code ?? '—'}</span>
                  <span>{r.branch?.name ?? '—'}</span>
                  <span>
                    {r.clock_in_at
                      ? new Date(r.clock_in_at).toLocaleDateString('id-ID')
                      : '—'}
                  </span>
                  <span>
                    {clockIn
                      ? clockIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                  <span>
                    {clockOut
                      ? clockOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : r.clock_in_at
                        ? <span className="att-still-in">● Masuk</span>
                        : '—'}
                  </span>
                  <span>{duration}</span>
                  <span>
                    <StatusBadge status={r.status ?? '—'} />
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>
    </>
  );
}

function KioskMode({
  company,
  token,
  branch,
  onExit,
  onClocked,
}: {
  company: string;
  token: string;
  branch: any;
  onExit: () => void;
  onClocked: () => void;
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'confirming' | 'success' | 'error'>('idle');
  const [employeeName, setEmployeeName] = useState('');
  const [action, setAction] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN');
  const [msg, setMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setStatus('scanning');
    } catch {
      setMsg('Kamera tidak tersedia. Gunakan input manual.');
      setStatus('idle');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function lookupEmployee(id: string) {
    if (!id.trim()) return;
    setStatus('confirming');
    setEmployeeId(id.trim());
    try {
      const result = await api<any>(`/employees?search=${encodeURIComponent(id.trim())}`, token, company);
      const emp = Array.isArray(result) ? result.find((e: any) => e.employee_code === id.trim() || e.id === id.trim()) : null;
      if (emp) {
        setEmployeeName(emp.name);
      } else {
        setEmployeeName('Karyawan tidak dikenali');
      }
    } catch {
      setEmployeeName('Karyawan tidak dikenali');
    }
  }

  async function confirmClock() {
    setStatus('success');
    setMsg('');
    try {
      await api('/attendance/clock', token, company, {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employeeId,
          branchId: branch?.id,
          action,
        }),
      });
      setMsg(action === 'CLOCK_IN' ? '✓ Clock in berhasil!' : '✓ Clock out berhasil!');
      onClocked();
    } catch {
      setMsg('Gagal melakukan clock. Silakan coba lagi.');
      setStatus('error');
    }
    setTimeout(() => {
      setStatus('idle');
      setEmployeeId('');
      setEmployeeName('');
      setMsg('');
      setAction('CLOCK_IN');
      inputRef.current?.focus();
    }, 3000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && status === 'idle' && employeeId.trim()) {
      e.preventDefault();
      lookupEmployee(employeeId);
    }
  }

  const timeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="kiosk-mode">
      <div className="kiosk-header">
        <div className="kiosk-branch">
          <Monitor size={20} />
          <span>{branch?.name ?? 'Cabang'}</span>
        </div>
        <button className="kiosk-exit" onClick={() => { stopCamera(); onExit(); }}>
          ✕ Keluar Mode Layar
        </button>
      </div>

      <div className="kiosk-clock">
        <div className="kiosk-time">{timeStr}</div>
        <div className="kiosk-date">{dateStr}</div>
      </div>

      {status === 'idle' && (
        <div className="kiosk-input-area">
          <div className="kiosk-instruction">
            <ScanBarcode size={40} />
            <h2>Scan Barcode atau Ketik ID Karyawan</h2>
            <p>Arahkan barcode ke kamera atau ketik ID secara manual</p>
          </div>
          <input
            ref={inputRef}
            className="kiosk-field"
            type="text"
            placeholder="ID Karyawan..."
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="kiosk-actions">
            <Button onClick={() => startCamera()}>
              <Video size={16} /> Aktifkan Kamera
            </Button>
            <Button onClick={() => lookupEmployee(employeeId)} disabled={!employeeId.trim()}>
              Cari Karyawan
            </Button>
          </div>
          {cameraActive && (
            <div className="kiosk-camera">
              <video ref={videoRef} autoPlay playsInline muted />
              <button onClick={stopCamera}>
                <VideoOff size={14} /> Matikan Kamera
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'scanning' && (
        <div className="kiosk-input-area">
          <div className="kiosk-camera">
            <video ref={videoRef} autoPlay playsInline muted />
            <p>Posisikan barcode di depan kamera</p>
          </div>
          <Button variant="secondary" onClick={() => { stopCamera(); setStatus('idle'); }}>
            Batal
          </Button>
        </div>
      )}

      {status === 'confirming' && (
        <div className="kiosk-confirm">
          <div className="kiosk-confirm-card">
            <div className="kiosk-avatar">
              <User size={48} />
            </div>
            <h2>{employeeName}</h2>
            <p className="muted">ID: {employeeId}</p>
            <div className="kiosk-action-picker">
              <button
                className={action === 'CLOCK_IN' ? 'selected' : ''}
                onClick={() => setAction('CLOCK_IN')}
              >
                <LogIn size={24} />
                <span>Clock In</span>
              </button>
              <button
                className={action === 'CLOCK_OUT' ? 'selected' : ''}
                onClick={() => setAction('CLOCK_OUT')}
              >
                <LogOut size={24} />
                <span>Clock Out</span>
              </button>
            </div>
            <div className="kiosk-confirm-actions">
              <Button variant="secondary" onClick={() => { setStatus('idle'); setEmployeeId(''); setEmployeeName(''); }}>
                Batal
              </Button>
              <Button onClick={confirmClock}>
                <Fingerprint size={16} /> Konfirmasi {action === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="kiosk-success">
          <div className="kiosk-success-icon">✓</div>
          <h2>{msg}</h2>
        </div>
      )}

      {status === 'error' && (
        <div className="kiosk-error">
          <div className="kiosk-error-icon">✕</div>
          <h2>{msg}</h2>
          <Button onClick={() => { setStatus('idle'); setMsg(''); }}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
