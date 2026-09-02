import { useEffect, useState } from 'react';
import { api } from './api';
import { Receipt } from './pos-page';
import { useDialogFocus } from './dialog-focus';

type Sale = {
  id: string;
  transaction_number?: string;
  created_at: string;
  grand_total: number;
  status: string;
  payment?: { method?: string }[];
  items?: { quantity: number; product_name?: string }[];
  customer?: { name?: string };
};
export function PosHistory({
  company,
  token,
  branchId,
}: {
  company: string;
  token: string;
  branchId: string;
}) {
  const [rows, setRows] = useState<Sale[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  const detailDialog = useDialogFocus(Boolean(selected), () =>
    setSelected(null),
  );
  const load = () => {
    const params = new URLSearchParams({
      branchId,
      limit: '50',
      offset: String(page * 50),
    });
    if (query) params.set('search', query);
    if (status) params.set('status', status);
    if (method) params.set('paymentMethod', method);
    return api<Sale[]>(`/sales?${params}`, token, company, {
      headers: { 'x-branch-id': branchId },
    })
      .then(setRows)
      .catch(() => setError('Riwayat transaksi gagal dimuat.'));
  };
  useEffect(() => {
    void load();
  }, [company, token, branchId, page, status, method]);
  const openDetail = async (row: Sale) => {
    try {
      setSelected(
        await api<Sale>(`/sales/${row.id}`, token, company, {
          headers: { 'x-branch-id': branchId },
        }),
      );
    } catch {
      setError('Detail transaksi tidak tersedia.');
    }
  };
  return (
    <section className="pos-history" aria-labelledby="pos-history-title">
      <h1 id="pos-history-title">Riwayat Transaksi</h1>
      <div className="pos-history-filters">
        <input
          aria-label="Cari nomor struk"
          placeholder="Cari nomor struk"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setPage(0);
              void load();
            }
          }}
        />
        <select
          aria-label="Filter status"
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value);
          }}
        >
          <option value="">Semua Status</option>
          <option value="PAID">PAID</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <select
          aria-label="Filter pembayaran"
          value={method}
          onChange={(event) => {
            setPage(0);
            setMethod(event.target.value);
          }}
        >
          <option value="">Semua Pembayaran</option>
          <option value="QRIS">QRIS</option>
          <option value="CASH">CASH</option>
          <option value="BANK_TRANSFER">TRANSFER</option>
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="pos-history-list">
        {rows.length === 0 ? (
          <p>Belum ada transaksi.</p>
        ) : (
          rows.map((row) => (
            <button
              type="button"
              key={row.id}
              className="pos-history-row"
              onClick={() => void openDetail(row)}
            >
              <b>{row.transaction_number ?? row.id.slice(0, 8)}</b>
              <span>{new Date(row.created_at).toLocaleString('id-ID')}</span>
              <span>{row.payment?.[0]?.method ?? '—'}</span>
              <strong>
                Rp {Number(row.grand_total).toLocaleString('id-ID')}
              </strong>
              <small>{row.status}</small>
            </button>
          ))
        )}
      </div>
      <div className="pos-history-pagination">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>
          Sebelumnya
        </button>
        <span>Halaman {page + 1}</span>
        <button disabled={rows.length < 50} onClick={() => setPage(page + 1)}>
          Berikutnya
        </button>
      </div>
      {selected && (
        <div className="pos-modal-overlay">
          <div
            ref={detailDialog.dialogRef}
            onKeyDown={detailDialog.onKeyDown}
            className="pos-modal pos-receipt"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            tabIndex={-1}
          >
            <Receipt sale={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </section>
  );
}
