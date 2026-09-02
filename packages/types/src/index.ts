export type TenantScope = {
  companyId: string;
  storeId?: string;
  branchId?: string;
};
export type Permission = `${string}.${string}`;
