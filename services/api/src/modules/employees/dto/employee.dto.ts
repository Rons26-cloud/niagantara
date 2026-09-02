import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EmployeeInput {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeCode!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'terminated'])
  employmentStatus?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsUUID()
  primaryBranchId?: string;
}

export class AssignmentInput {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class WorkShiftInput {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  branchId!: string;

  @IsDateString()
  scheduledStart!: string;

  @IsDateString()
  scheduledEnd!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
