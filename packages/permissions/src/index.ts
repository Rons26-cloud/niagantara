export const PERMISSIONS = ['company.read','company.update','store.read','store.manage','branch.read','branch.manage','user.read','user.manage','role.read','role.manage','product.read','product.create','product.update','product.delete','inventory.read','inventory.adjust','inventory.transfer','pos.checkout','finance.read','finance.create','finance.approve','sheet.read','sheet.manage','report.read','report.export'] as const;
export type PermissionKey = typeof PERMISSIONS[number];
export type PlatformRole = 'super_master'|'master_admin'|'support'|'auditor';
export type CompanyRole = 'owner'|'company_admin'|'finance'|'hr'|'accountant';
export type BranchRole = 'manager'|'supervisor'|'cashier'|'warehouse'|'employee';