import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from './api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  StatusBadge,
  useTranslation,
} from '@niagantara/ui';

type Props = {
  company: string;
  token: string;
  canManage: boolean;
};

function GoogleSheetsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 87.3 78"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.6 66.85H23.8V78H6.6a6.6 6.6 0 0 1-6.6-6.6V73.4a6.6 6.6 0 0 1 6.6-6.55z"
        fill="#0066DA"
      />
      <path d="M23.8 66.85h24.9v11.15H23.8V66.85z" fill="#00AC47" />
      <path
        d="M48.7 66.85H66a6.6 6.6 0 0 0 6.6-6.6v-2.95a6.6 6.6 0 0 0-6.6-6.55H48.7v16.1z"
        fill="#EA4335"
      />
      <path d="M48.7 50.75H23.8V39.6h24.9v11.15z" fill="#00832D" />
      <path
        d="M23.8 50.75H6.6a6.6 6.6 0 0 1-6.6-6.6v-2.95a6.6 6.6 0 0 1 6.6-6.55h17.2v16.1z"
        fill="#2684FC"
      />
      <path
        d="M48.7 34.6H66a6.6 6.6 0 0 0 6.6-6.6v-2.95A6.6 6.6 0 0 0 66 18.5H48.7v16.1z"
        fill="#FFBA00"
      />
      <path d="M48.7 18.5H23.8V7.35h24.9V18.5z" fill="#00AC47" />
      <path
        d="M23.8 18.5H6.6A6.6 6.6 0 0 1 0 11.9V8.95A6.6 6.6 0 0 1 6.6 2.4h17.2v16.1z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSheetsPage({ company, token, canManage }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api<any>('/google-sheets', token, company),
      api<any[]>('/google-sheets/history', token, company),
      canManage
        ? api<any[]>('/google-sheets/recovery', token, company)
        : Promise.resolve([]),
    ])
      .then(([s, h, f]) => {
        setState(s);
        setHistory(h);
        setFailures(f);
      })
      .catch(() => setMessage('Google Sheets status tidak dapat dimuat.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function action(path: string, body?: unknown) {
    setMessage('Memproses...');
    try {
      const result: any = await api(path, token, company, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      });
      if (result.authorizationUrl) {
        location.assign(result.authorizationUrl);
        return;
      }
      setMessage('Permintaan berhasil.');
      await load();
    } catch (e) {
      setMessage(
        e instanceof ApiError && e.code === 'GOOGLE_OAUTH_NOT_CONFIGURED'
          ? 'Google OAuth belum dikonfigurasi oleh administrator.'
          : 'Permintaan gagal.',
      );
    }
  }

  if (loading) return <LoadingState label={t('common.loading')} />;

  if (!state)
    return (
      <section className="panel">
        <h2>Google Sheets</h2>
        <p className="muted">{message || 'Memuat...'}</p>
      </section>
    );

  const isConnected = state.connection?.status === 'connected';
  const sampleData = [
    {
      date: '22 Agu',
      sales: 'Rp 8.420.000',
      profit: 'Rp 2.840.000',
      branch: 'Toko Pusat',
    },
    {
      date: '21 Agu',
      sales: 'Rp 7.980.000',
      profit: 'Rp 2.510.000',
      branch: 'Selatan',
    },
  ];

  return (
    <div className="sheets-page">
      <section className="sheets-header">
        <div className="sheets-header-brand">
          <GoogleSheetsLogo size={40} />
          <div className="sheets-header-text">
            <h1>NIAGANTARA Reporting</h1>
            <span
              className={`sheets-status ${isConnected ? 'connected' : 'offline'}`}
            >
              <span className="sheets-status-dot" />
              {isConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>
        {state.connection && (
          <div className="sheets-header-account">
            <span className="sheets-account-email">
              {state.connection.google_email}
            </span>
            {canManage && (
              <Button
                variant="secondary"
                onClick={() =>
                  action('/google-sheets/oauth/start', { replace: true })
                }
              >
                Ganti Akun
              </Button>
            )}
          </div>
        )}
      </section>

      {!state.connection && (
        <section className="sheets-connect">
          <GoogleSheetsLogo size={48} />
          <h2>Hubungkan Google Sheets</h2>
          <p>
            Sinkronkan data bisnis Anda ke Google Sheets untuk laporan yang
            lebih detail.
          </p>
          {canManage ? (
            <Button onClick={() => action('/google-sheets/oauth/start')}>
              Hubungkan Akun Google
            </Button>
          ) : (
            <p className="muted">
              Hubungi admin untuk menghubungkan akun Google.
            </p>
          )}
        </section>
      )}

      {message && <Alert tone="info">{message}</Alert>}

      {state.workbook && (
        <section className="sheets-workbook">
          <div className="sheets-workbook-header">
            <div>
              <h2>Spreadsheet Aktif</h2>
              <p className="muted">{state.workbook.title}</p>
            </div>
            {canManage && (
              <Button
                variant="secondary"
                onClick={() => action('/google-sheets/sync')}
              >
                Sync Sekarang
              </Button>
            )}
          </div>
          <div className="sheets-workbook-meta">
            <div className="sheets-meta-item">
              <small>Spreadsheet ID</small>
              <span>{state.workbook.spreadsheet_id}</span>
            </div>
            <div className="sheets-meta-item">
              <small>Terakhir Sync</small>
              <span>
                {state.workbook.last_sync_at
                  ? new Date(state.workbook.last_sync_at).toLocaleString(
                      'id-ID',
                    )
                  : '—'}
              </span>
            </div>
          </div>
        </section>
      )}

      {!state.workbook && canManage && (
        <WorkbookForm submit={(v) => action('/google-sheets/workbooks', v)} />
      )}

      <section className="sheets-preview">
        <div className="sheets-preview-header">
          <h2>Preview Data</h2>
          <span className="sheets-preview-badge">Laporan Penjualan</span>
        </div>
        <div className="sheets-preview-filename">
          <GoogleSheetsLogo size={18} />
          <span>Q3_Business_Report</span>
        </div>
        <table className="sheets-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Penjualan</th>
              <th>Laba</th>
              <th>Cabang</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, i) => (
              <tr key={i}>
                <td>{row.date}</td>
                <td className="sheets-amount">{row.sales}</td>
                <td className="sheets-amount sheets-profit">{row.profit}</td>
                <td>{row.branch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {state.definitions?.length > 0 && (
        <section className="sheets-definitions">
          <h2>Sheet Definitions</h2>
          {state.definitions.map((def: any) => (
            <Definition
              key={def.id}
              value={def}
              company={company}
              token={token}
              canManage={canManage}
              reload={load}
            />
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section className="sheets-history">
          <h2>Riwayat Sync</h2>
          <div className="sheets-history-list">
            {history.slice(0, 10).map((h: any) => (
              <div className="sheets-history-item" key={h.id}>
                <div className="sheets-history-info">
                  <span className="sheets-history-type">
                    {h.job_type ?? '—'}
                  </span>
                  <span className="sheets-history-date">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString('id-ID')
                      : '—'}
                  </span>
                </div>
                <StatusBadge status={h.status ?? '—'} />
              </div>
            ))}
          </div>
        </section>
      )}

      {failures.length > 0 && canManage && (
        <section className="sheets-recovery">
          <div className="sheets-recovery-header">
            <h2>Recovery Center</h2>
            <Button onClick={() => action('/google-sheets/recovery/retry')}>
              Retry All Failed
            </Button>
          </div>
          <div className="sheets-history-list">
            {failures.map((f: any) => (
              <div
                className="sheets-history-item sheets-history-error"
                key={f.id}
              >
                <div className="sheets-history-info">
                  <span className="sheets-history-type">
                    {f.job_type ?? '—'}
                  </span>
                  <span className="sheets-history-error-msg">
                    {f.error_message ?? '—'}
                  </span>
                </div>
                <span className="sheets-history-date">
                  {f.created_at
                    ? new Date(f.created_at).toLocaleString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sheets-tutorial">
        <Button variant="ghost" onClick={() => (location.hash = 'tutorial')}>
          Buka Tutorial →
        </Button>
      </section>
    </div>
  );
}

function WorkbookForm({ submit }: { submit: (v: any) => void }) {
  const [title, setTitle] = useState('NIAGANTARA Business Report');

  function go(e: FormEvent) {
    e.preventDefault();
    submit({ title, timezone: 'Asia/Jakarta' });
  }

  return (
    <section className="sheets-create">
      <h2>Buat Spreadsheet Laporan</h2>
      <form className="sheets-create-form" onSubmit={go}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
        <button type="submit">Buat</button>
      </form>
    </section>
  );
}

function Definition({
  value,
  company,
  token,
  canManage,
  reload,
}: {
  value: any;
  company: string;
  token: string;
  canManage: boolean;
  reload: () => unknown;
}) {
  const [title, setTitle] = useState(value.title);

  async function patch(path: string, body: any) {
    await api(path, token, company, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await reload();
  }

  return (
    <div className="sheets-def">
      <div className="sheets-def-header">
        <div>
          <b>{value.dataset}</b>
          <small>
            {value.monthly ? 'Monthly sheets' : 'Single sheet'} · {value.status}
          </small>
        </div>
        {canManage && (
          <div className="sheets-def-actions">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <button
              onClick={() =>
                patch(`/google-sheets/definitions/${value.id}`, { title })
              }
            >
              Rename
            </button>
            <button
              onClick={() =>
                patch(`/google-sheets/definitions/${value.id}`, {
                  status: value.status === 'active' ? 'archived' : 'active',
                })
              }
            >
              {value.status === 'active' ? 'Archive' : 'Restore'}
            </button>
          </div>
        )}
      </div>
      <div className="sheets-def-columns">
        {(value.columns ?? []).map((c: any) => (
          <span key={c.id} className="sheets-def-col">
            {c.label}
            <small>{c.data_type}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SheetsTutorial() {
  const steps = [
    'Ask an Owner or Company Admin to connect a dedicated Google account.',
    'Create the reporting spreadsheet. NIAGANTARA creates monthly Sales, Inventory, Purchases, and Finance sheets.',
    'POS and operational changes enter a durable sync queue automatically.',
    'Use Sheet Builder to rename, reorder, archive, or restore reporting columns.',
    'Use Recovery Center to retry failed jobs; rebuild always reads authoritative data from Supabase.',
    'Never edit Supabase business data from Google Sheets. Sheet edits are reporting-only.',
  ];

  return (
    <section className="panel tutorial">
      <h2>Google Sheets integration tutorial</h2>
      <ol>
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </section>
  );
}
