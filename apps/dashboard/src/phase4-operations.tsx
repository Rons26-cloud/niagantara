import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from './api';
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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function PurchasesPage({
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
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const branch = ctx.accessible_branches[0];
  const store = ctx.stores.find((x: any) => x.id === branch?.store_id);
  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    productId: '',
    quantity: '1',
    unitCost: '0',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/purchases', token, company)
      .then(setRows)
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function open(r: any) {
    try {
      setDetail(await api('/purchases/' + r.id, token, company));
    } catch {
      setDetail(r);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!branch || !store) return;
    setMsg('...');
    try {
      await api('/purchases', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': branch.id },
        body: JSON.stringify({
          storeId: store.id,
          branchId: branch.id,
          warehouseId: form.warehouseId,
          supplierId: form.supplierId,
          purchaseDate: new Date().toISOString().slice(0, 10),
          items: [
            {
              productId: form.productId,
              quantity: Number(form.quantity),
              unitCost: Number(form.unitCost),
            },
          ],
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function receive() {
    if (!detail) return;
    const item = detail.items?.find(
      (x: any) => Number(x.received_quantity) < Number(x.quantity),
    );
    if (!item) return;
    try {
      await api('/purchases/' + detail.id + '/receive', token, company, {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          items: [
            {
              purchaseItemId: item.id,
              quantity: Number(item.quantity) - Number(item.received_quantity),
            },
          ],
        }),
      });
      setMsg('Inventory updated.');
      open(detail);
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.purchases')}</h2>
          {ctx.permissions.includes('purchase.create') && (
            <Button onClick={() => setShowCreate(true)}>
              {t('common.create')} Purchase
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingState label={t('common.loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <div className="sale-list">
            {rows.map((x: any) => (
              <button key={x.id} onClick={() => open(x)}>
                <b>{x.purchase_number ?? x.id}</b>
                <span>{x.status ?? '—'}</span>
                <strong>
                  Rp {Number(x.grand_total ?? 0).toLocaleString('id-ID')}
                </strong>
              </button>
            ))}
          </div>
        )}
        {msg && <p className="muted">{msg}</p>}
      </section>

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <h2>{detail.purchase_number ?? detail.id}</h2>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              {t('common.close')}
            </Button>
          </div>
          <dl className="def-grid">
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? '—'} />
            </dd>
            <dt>Supplier</dt>
            <dd>{detail.supplier?.name ?? detail.supplierId ?? '—'}</dd>
            <dt>Total</dt>
            <dd>
              Rp {Number(detail.grand_total ?? 0).toLocaleString('id-ID')}
            </dd>
          </dl>
          {detail.items?.length > 0 && (
            <div className="table" style={{ marginTop: 16 }}>
              <div className="tr head">
                {['Product', 'Qty', 'Received', 'Unit Cost'].map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
              {detail.items.map((item: any) => (
                <div className="tr" key={item.id}>
                  <span>{item.product?.name ?? item.productId ?? '—'}</span>
                  <span>{item.quantity}</span>
                  <span>{item.received_quantity ?? 0}</span>
                  <span>
                    Rp {Number(item.unit_cost ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
          {ctx.permissions.includes('purchase.receive') && (
            <Button onClick={receive} style={{ marginTop: 12 }}>
              Receive remaining
            </Button>
          )}
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Purchase"
        footer={
          <Button type="submit" form="purchase-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form
          id="purchase-create-form"
          className="inline-form"
          onSubmit={create}
        >
          <Field label="Supplier ID">
            <Input
              required
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            />
          </Field>
          <Field label="Warehouse ID">
            <Input
              required
              value={form.warehouseId}
              onChange={(e) =>
                setForm({ ...form, warehouseId: e.target.value })
              }
            />
          </Field>
          <Field label="Product ID">
            <Input
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            />
          </Field>
          <Field label={t('common.quantity')}>
            <Input
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label="Unit cost">
            <Input
              type="number"
              min="0"
              required
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

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

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/attendance', token, company)
      .then(setRows)
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
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
      setMsg(action + ' recorded.');
      setEmployee('');
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  const { page, pageCount, setPage, slice } = usePaged(rows);

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.attendance')}</h2>
          {ctx.permissions.includes('attendance.clock') && (
            <div className="quick-actions">
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
          )}
        </div>

        {loading ? (
          <LoadingState label={t('common.loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Employee',
                'Branch',
                'Date',
                'Clock In',
                'Clock Out',
                'Status',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
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
        {msg && <p className="muted">{msg}</p>}
      </section>
    </>
  );
}
