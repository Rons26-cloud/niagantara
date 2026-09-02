import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ClockInput {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  branchId!: string;

  @IsIn(['CLOCK_IN', 'CLOCK_OUT'])
  action!: 'CLOCK_IN' | 'CLOCK_OUT';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
