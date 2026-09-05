import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
  IsEmail,
} from 'class-validator';

export type CompanyMemberStatus = 'active' | 'invited' | 'suspended';

export class BranchMembershipInput {
  @IsUUID()
  branchId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roleKey!: string;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended'])
  status?: CompanyMemberStatus;
}

export class UpdateCompanyUserInput {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roleKey?: string;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended'])
  status?: CompanyMemberStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchMembershipInput)
  branches?: BranchMembershipInput[];
}

export class CreatePosCashierInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsUUID()
  branchId!: string;
}
