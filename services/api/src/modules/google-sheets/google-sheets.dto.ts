import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthReplaceDto {
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}

export class CreateWorkbookDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}

export class DefinitionDto {
  @IsString()
  @IsIn(['sales', 'inventory', 'purchases', 'finance'])
  dataset!: 'sales' | 'inventory' | 'purchases' | 'finance';

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsBoolean()
  monthly?: boolean;
}

export class UpdateDefinitionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsBoolean()
  monthly?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';
}

export class ColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  columnKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @IsString()
  @IsIn(['text', 'number', 'currency', 'date', 'datetime', 'boolean', 'formula'])
  dataType!: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean' | 'formula';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  formulaTemplate?: string;

  @IsOptional()
  position?: number;
}

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  columnKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  position?: number;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'number', 'currency', 'date', 'datetime', 'boolean', 'formula'])
  dataType?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean' | 'formula';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  formulaTemplate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';
}
