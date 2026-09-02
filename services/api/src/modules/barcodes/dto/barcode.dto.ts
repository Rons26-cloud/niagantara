import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class BarcodeInput {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsIn(['manufacturer', 'manual', 'internal'])
  source?: 'manufacturer' | 'manual' | 'internal';

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
