import { IsNumber, IsUUID, Min } from 'class-validator';

export class OpenShiftInput {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  branchId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingCash!: number;
}

export class CloseShiftInput {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  closingCash!: number;
}
