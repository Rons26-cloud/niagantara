# NIAGANTARA Realtime Architecture Audit

## Decision

The HTTP API remains the source of truth. Dashboard and POS write through `services/api`; Supabase Realtime Broadcast only signals that an authoritative API resource should be reloaded.

## Audited tables and event routing

| Table | Event | Topic | Authorization | Resource refreshed |
|---|---|---|---|---|
| `sales` | `sale.created`, `sale.updated`, `sale.cancelled` | company and branch dashboard topics | authenticated company-wide roles or authorized branch access | sales, finance |
| `inventory`, `inventory_movements` | `inventory.updated` | company and branch dashboard topics | same tenant/branch policy | inventory |
| `purchases` | `purchase.created`, `purchase.updated`, `purchase.received` | company and branch dashboard topics | same tenant/branch policy | finance, inventory |
| `expenses` | `expense.created`, `expense.updated` | company and branch dashboard topics | same tenant/branch policy | finance |
| `payments` | `payment.recorded` | company and branch dashboard topics | same tenant/branch policy | finance |
| `attendance_records` | `attendance.updated` | company and branch dashboard topics | same tenant/branch policy | attendance |

Events contain identifiers and tenant scope only. Full business records are refetched through the API.

## Client behavior

`apps/dashboard/src/realtime/` owns one private Supabase client per authenticated company/branch context. It handles status changes, branch-context cleanup, duplicate-free subscriptions, and 350 ms invalidation batching. If Realtime is unavailable or disconnected, normal API loading and manual refresh continue to work.

The migration is additive and has been created but not applied. Production deployment must run the migration through the normal database review process.
