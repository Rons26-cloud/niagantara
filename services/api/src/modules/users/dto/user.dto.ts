export type CompanyMemberStatus = 'active' | 'invited' | 'suspended';

export type BranchMembershipInput = {
  branchId: string;
  roleKey: string;
  status?: CompanyMemberStatus;
};

export type UpdateCompanyUserInput = {
  roleKey?: string;
  status?: CompanyMemberStatus;
  branches?: BranchMembershipInput[];
};
