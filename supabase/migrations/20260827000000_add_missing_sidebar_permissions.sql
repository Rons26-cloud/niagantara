-- Add permissions referenced in frontend sidebar/nav code but missing from seed.
-- Idempotent: ON CONFLICT DO UPDATE keeps existing rows safe.

insert into public.permissions (permission_key, display_name)
values
  -- POS
  ('pos.access', 'Access POS'),
  -- Sales
  ('sale.read', 'Read sales'),
  ('sale.create', 'Create sales'),
  ('sale.refund', 'Refund sales'),
  -- Shifts
  ('shift.read', 'Read shifts'),
  ('shift.open', 'Open shifts'),
  ('shift.close', 'Close shifts'),
  -- Customers
  ('customer.read', 'Read customers'),
  ('customer.create', 'Create customers'),
  ('customer.update', 'Update customers'),
  -- Purchases
  ('purchase.read', 'Read purchases'),
  ('purchase.create', 'Create purchases'),
  ('purchase.receive', 'Receive purchases'),
  -- Suppliers
  ('supplier.read', 'Read suppliers'),
  ('supplier.create', 'Create suppliers'),
  ('supplier.update', 'Update suppliers'),
  -- Expenses
  ('expense.read', 'Read expenses'),
  ('expense.create', 'Create expenses'),
  -- Payables / Receivables
  ('payable.read', 'Read payables'),
  ('payable.create', 'Create payables'),
  ('receivable.read', 'Read receivables'),
  ('receivable.create', 'Create receivables'),
  -- Warehouse
  ('warehouse.read', 'Read warehouses'),
  ('warehouse.manage', 'Manage warehouses'),
  -- Barcode
  ('barcode.read', 'Read barcodes'),
  ('barcode.manage', 'Manage barcodes'),
  -- Employees
  ('employee.read', 'Read employees'),
  ('employee.create', 'Create employees'),
  ('employee.update', 'Update employees'),
  -- Attendance
  ('attendance.read', 'Read attendance'),
  ('attendance.clock_in', 'Clock in'),
  ('attendance.clock_out', 'Clock out')
on conflict (permission_key)
do update set display_name = excluded.display_name;

-- Grant all new company-scoped permissions to the owner role automatically.

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
cross join public.permissions as permission
where role.scope = 'company'
  and role.role_key = 'owner'
  and permission.permission_key in (
    'pos.access', 'sale.read', 'sale.create', 'sale.refund',
    'shift.read', 'shift.open', 'shift.close',
    'customer.read', 'customer.create', 'customer.update',
    'purchase.read', 'purchase.create', 'purchase.receive',
    'supplier.read', 'supplier.create', 'supplier.update',
    'expense.read', 'expense.create',
    'payable.read', 'payable.create',
    'receivable.read', 'receivable.create',
    'warehouse.read', 'warehouse.manage',
    'barcode.read', 'barcode.manage',
    'employee.read', 'employee.create', 'employee.update',
    'attendance.read', 'attendance.clock_in', 'attendance.clock_out'
  )
on conflict (role_id, permission_id) do nothing;
