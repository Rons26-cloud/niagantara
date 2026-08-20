insert into public.roles (scope, role_key, display_name)
values
  ('platform', 'super_master', 'Super Master'),
  ('platform', 'master_admin', 'Master Admin'),
  ('platform', 'support', 'Support'),
  ('platform', 'auditor', 'Auditor'),
  ('company', 'owner', 'Owner'),
  ('company', 'company_admin', 'Company Admin'),
  ('company', 'finance', 'Finance'),
  ('company', 'hr', 'HR'),
  ('company', 'accountant', 'Accountant'),
  ('branch', 'manager', 'Manager'),
  ('branch', 'supervisor', 'Supervisor'),
  ('branch', 'cashier', 'Cashier'),
  ('branch', 'warehouse', 'Warehouse'),
  ('branch', 'employee', 'Employee')
on conflict (scope, role_key)
do update set display_name = excluded.display_name;

insert into public.permissions (permission_key, display_name)
values
  ('company.read', 'Read company'),
  ('company.update', 'Update company'),
  ('store.read', 'Read store'),
  ('store.manage', 'Manage store'),
  ('branch.read', 'Read branch'),
  ('branch.manage', 'Manage branch'),
  ('user.read', 'Read users'),
  ('user.manage', 'Manage users'),
  ('role.read', 'Read roles'),
  ('role.manage', 'Manage roles'),
  ('product.read', 'Read products'),
  ('product.create', 'Create products'),
  ('product.update', 'Update products'),
  ('product.delete', 'Delete products'),
  ('inventory.read', 'Read inventory'),
  ('inventory.adjust', 'Adjust inventory'),
  ('inventory.transfer', 'Transfer inventory'),
  ('pos.checkout', 'Checkout POS'),
  ('finance.read', 'Read finance'),
  ('finance.create', 'Create finance'),
  ('finance.approve', 'Approve finance'),
  ('sheet.read', 'Read sheets'),
  ('sheet.manage', 'Manage sheets'),
  ('report.read', 'Read reports'),
  ('report.export', 'Export reports')
on conflict (permission_key)
do update set display_name = excluded.display_name;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
cross join public.permissions as permission
where role.scope = 'company'
  and role.role_key = 'owner'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
join public.permissions as permission
  on permission.permission_key in (
    'company.read', 'company.update', 'store.read', 'store.manage',
    'branch.read', 'branch.manage', 'user.read', 'user.manage',
    'role.read', 'role.manage', 'report.read', 'report.export'
  )
where role.scope = 'company'
  and role.role_key = 'company_admin'
on conflict (role_id, permission_id) do nothing;
