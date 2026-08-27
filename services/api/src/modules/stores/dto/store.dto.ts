import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}

export class UpdateStoreDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
