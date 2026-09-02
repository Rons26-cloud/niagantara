import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export type DiscountType = 'PERCENT' | 'FIXED';
export type PaymentMethod =
  'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'E_WALLET' | 'OTHER';

export class CheckoutItem {
  @IsUUID()
  productId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED'])
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue?: number;
}

export class CheckoutInput {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsUUID()
  shiftId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  idempotencyKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItem)
  items!: CheckoutItem[];

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED'])
  transactionDiscountType?: DiscountType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  transactionDiscountValue?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  taxRate?: number;

  @IsIn(['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'])
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountReceived?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentReference?: string;
}
