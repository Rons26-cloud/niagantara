# Owner Dashboard completeness matrix

Data source: `services/api` (API-first). The dashboard does not use a service
role or direct privileged Supabase access. Permissions are UI filtering only;
NestJS guards and Supabase/RPC policies remain authoritative.

| Module | Route | API / permission | Status | Notes |
|---|---|---|---|---|
| Beranda | `#dashboard` | `/sales`, `/inventory/low-stock`, `/finance/reports`, `/google-sheets`; read permissions | PARTIAL | Real KPIs, charts, low-stock and Sheets status; financial truth is the backend basic cash summary. |
| POS / Kasir | `#pos` | `/pos/*`; `pos.access`, `pos.checkout` | PARTIAL | Shared POS flow is integrated; branch/warehouse context required. |
| Produk | `#products` | `/products`, `/categories`; product permissions | PARTIAL | Real list/create/detail; edit/archive and server pagination still need UI completion. |
| Kategori | `#categories` | `/categories`; `category.read/manage` | PARTIAL | Real CRUD surface; needs final edit/archive interaction QA. |
| Barcode | `#barcode` | `/barcodes/lookup`, `/barcodes`; barcode permissions | PARTIAL | Lookup is real; generation UI is not exposed as a fake action. |
| Stok | `#inventory` | `/inventory`, `/inventory/movements`, RPC adjustments/transfers | PARTIAL | Real summaries, movements, adjustment and transfer; location filters need final QA. |
| Penjualan | `#sales` | `/sales`, cancel/refund RPCs; sale permissions | PARTIAL | Real filtering/detail/refund/cancel; receipt and confirmation UX remain refinement work. |
| Shift Kasir | `#shifts` | `/shifts`, open/close RPCs; shift permissions | PARTIAL | Loading/error/empty and guarded actions implemented; needs richer table fields. |
| Pelanggan | `#customers` | `/customers`; customer permissions | PARTIAL | Real list/create/detail; update UX needs completion. |
| Pembelian | `#purchases` | `/purchases`, receive/cancel RPCs; purchase permissions | PARTIAL | Real list/detail/create/receive; cancel and richer filters need completion. |
| Supplier | `#suppliers` | `/suppliers`; supplier permissions | PARTIAL | Real list/create/detail; edit UX needs completion. |
| Pengeluaran | `#expenses` | `/expenses`; expense permissions | PARTIAL | Real list/create/category data; backend has no edit/delete route. |
| Hutang | `#payables` | `/finance/payables`, payment RPC; payable permissions | PARTIAL | Real data/payment flow; confirmation and detail UI need refinement. |
| Piutang | `#receivables` | `/finance/receivables`, payment RPC; receivable permissions | PARTIAL | Real data/payment flow; confirmation and detail UI need refinement. |
| Laporan Keuangan | `#reports` | `/finance/reports`; `finance.read` | PARTIAL | Uses backend-calculated basic operating cash summary, not audited accounting profit. |
| Google Sheets | `#sheets` | `/google-sheets/*`; sheet permissions | PARTIAL | Existing OAuth/workbook/definitions/history/recovery integration; final responsive polish pending. |
| Gudang | `#warehouses` | `/warehouses`; warehouse permissions | PARTIAL | Real list/create/edit; stock summary fields depend on API response. |
| Cabang | `#branches` | `/branches`; branch permissions | PARTIAL | Real list/create/edit and access filtering; plan-limit UI needs API integration. |
| Manajemen Toko | `#stores` | `/stores`; store permissions | PARTIAL | Real list/create/edit; plan-limit UI needs API integration. |
| Karyawan | `#employees` | `/employees`, assignments; employee permissions | PARTIAL | Real employee CRUD and branch assignment surface. |
| Absensi | `#attendance` | `/attendance`, `/attendance/clock`; attendance permissions | PARTIAL | Real records and clock actions; filters and richer duration/status presentation needed. |
| Pengguna | `#users` | `/users`; `user.read/manage` | PARTIAL | Real company/branch-scoped listing, role/status management, branch assignments, last-owner protection and audit logging. Account invitation remains unavailable. |
| Pengaturan | `#settings` | `/auth/me`, `/companies/:id/plan` | PARTIAL | Profile/theme/language/security and real plan lookup. |
| Bantuan | `#help` | Static localized support guidance | COMPLETE | No ticket backend is implied; support email uses the existing project address. |

## Shared acceptance checks

- Sidebar groups, permission filtering, route-derived active state, desktop
  collapse, mobile drawer, footer controls, and branch context propagation are
  implemented.
- Shared UI primitives provide loading, error, empty, modal, pagination, status,
  and responsive table patterns.
- `x-company-id` and the selected `x-branch-id` are sent through the central API
  client. Frontend IDs are still validated by the API guards.
- No production data is fabricated. Missing backend capabilities are shown as
  `BACKEND_GAP` or omitted from actions.

## Validation

Dashboard lint, typecheck, and production build pass. Full repository validation
must still be run after any follow-up page refinements; no commit, push, or deploy
was performed.
