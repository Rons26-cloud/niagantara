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

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Google connection</h2>
            <p className="muted">
              Supabase tetap menjadi sumber data utama. Sheets hanya lapisan
              laporan.
            </p>
          </div>
          <span
            className={`sync-pill ${state.connection?.status ?? 'offline'}`}
          >
            {state.connection?.status ?? 'not connected'}
          </span>
        </div>
        {state.connection ? (
          <>
            <p>
              Account: <b>{state.connection.google_email}</b>
            </p>
            {canManage && (
              <Button
                variant="secondary"
                onClick={() =>
                  action('/google-sheets/oauth/start', { replace: true })
                }
              >
                Replace Google account
              </Button>
            )}
          </>
        ) : canManage ? (
          <Button onClick={() => action('/google-sheets/oauth/start')}>
            Connect Google account
          </Button>
        ) : (
          <p className="muted">Belum terhubung.</p>
        )}
        {message && <p className="muted">{message}</p>}
      </section>

      {!state.workbook && canManage && (
        <WorkbookForm submit={(v) => action('/google-sheets/workbooks', v)} />
      )}

      {state.workbook && (
        <section className="panel">
          <div className="panel-head">
            <h2>Active workbook</h2>
            {canManage && (
              <Button
                variant="secondary"
                onClick={() => action('/google-sheets/sync')}
              >
                Sync now
              </Button>
            )}
          </div>
          <dl className="def-grid">
            <dt>Title</dt>
            <dd>{state.workbook.title}</dd>
            <dt>Spreadsheet ID</dt>
            <dd>{state.workbook.spreadsheet_id}</dd>
            <dt>Last sync</dt>
            <dd>
              {state.workbook.last_sync_at
                ? new Date(state.workbook.last_sync_at).toLocaleString('id-ID')
                : '—'}
            </dd>
          </dl>
        </section>
      )}

      {state.definitions?.length > 0 && (
        <section className="panel">
          <h2>Sheet definitions</h2>
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
        <section className="panel">
          <h2>Sync history</h2>
          <div className="table">
            <div className="tr head">
              {['Type', 'Status', 'Date'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {history.slice(0, 20).map((h: any) => (
              <div className="tr" key={h.id}>
                <span>{h.job_type ?? '—'}</span>
                <span>
                  <StatusBadge status={h.status ?? '—'} />
                </span>
                <span>
                  {h.created_at
                    ? new Date(h.created_at).toLocaleString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {failures.length > 0 && canManage && (
        <section className="panel">
          <div className="panel-head">
            <h2>Recovery center</h2>
            <Button onClick={() => action('/google-sheets/recovery/retry')}>
              Retry all failed
            </Button>
          </div>
          <div className="table">
            <div className="tr head">
              {['Type', 'Error', 'Date'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {failures.map((f: any) => (
              <div className="tr" key={f.id}>
                <span>{f.job_type ?? '—'}</span>
                <span>{f.error_message ?? '—'}</span>
                <span>
                  {f.created_at
                    ? new Date(f.created_at).toLocaleString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Card title="Tutorial">
        <Button variant="ghost" onClick={() => (location.hash = 'tutorial')}>
          Buka tutorial →
        </Button>
      </Card>
    </>
  );
}

function WorkbookForm({
  submit,
}: {
  submit: (v: any) => void;
}) {
  const [title, setTitle] = useState('NIAGANTARA Business Report');

  function go(e: FormEvent) {
    e.preventDefault();
    submit({ title, timezone: 'Asia/Jakarta' });
  }

  return (
    <section className="panel">
      <h2>Create reporting spreadsheet</h2>
      <form className="search" onSubmit={go}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
        <button>Create</button>
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
  const [column, setColumn] = useState({
    columnKey: '',
    label: '',
    dataType: 'text',
  });

  async function patch(path: string, body: any) {
    await api(path, token, company, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await reload();
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    await api(
      `/google-sheets/definitions/${value.id}/columns`,
      token,
      company,
      {
        method: 'POST',
        body: JSON.stringify({
          ...column,
          position: (value.columns ?? []).length,
        }),
      },
    );
    setColumn({ columnKey: '', label: '', dataType: 'text' });
    await reload();
  }

  return (
    <div className="sheet-definition">
      <div className="panel-head">
        <div>
          <b>{value.dataset}</b>
          <small>
            {value.monthly ? 'Monthly sheets' : 'Single sheet'} · {value.status}
          </small>
        </div>
        {canManage && (
          <>
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
          </>
        )}
      </div>
      <ol>
        {(value.columns ?? []).map((c: any) => (
          <li key={c.id}>
            <span>
              {c.label}{' '}
              <small>
                {c.column_key} · {c.data_type}
              </small>
            </span>
            {canManage && (
              <>
                <button
                  onClick={() =>
                    patch(`/google-sheets/columns/${c.id}`, {
                      position: Math.max(0, c.position - 1),
                    })
                  }
                >
                  ↑
                </button>
                <button
                  onClick={() =>
                    patch(`/google-sheets/columns/${c.id}`, {
                      position: c.position + 1,
                    })
                  }
                >
                  ↓
                </button>
                <button
                  onClick={() =>
                    patch(`/google-sheets/columns/${c.id}`, {
                      status: c.status === 'active' ? 'archived' : 'active',
                    })
                  }
                >
                  {c.status === 'active' ? 'Archive' : 'Restore'}
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      {canManage && (
        <form className="search" onSubmit={add}>
          <input
            placeholder="column_key"
            pattern="[a-z][a-z0-9_]*"
            required
            value={column.columnKey}
            onChange={(e) =>
              setColumn({ ...column, columnKey: e.target.value })
            }
          />
          <input
            placeholder="Label"
            required
            value={column.label}
            onChange={(e) =>
              setColumn({ ...column, label: e.target.value })
            }
          />
          <button>Add column</button>
        </form>
      )}
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
