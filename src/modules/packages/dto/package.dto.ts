import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class PackageServiceItemDto {
  @ApiProperty({ description: 'Service ID to include in the package' })
  @IsUUID()
  service_id: string;

  @ApiProperty({ example: 5, description: 'Number of sessions of this service included' })
  @IsNumber()
  @Min(1)
  session_count: number;
}

export class CreatePackageDto {
  @ApiProperty({ example: 'Premium Physio Package' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '12 physio sessions + 4 consultation sessions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 16, description: 'Total sessions (sum of all service sessions)' })
  @IsNumber()
  @Min(1)
  total_sessions: number;

  @ApiPropertyOptional({ example: 90, description: 'Expiry in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_days?: number;

  @ApiPropertyOptional({ example: 2500.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  is_custom?: boolean;

  @ApiPropertyOptional({ type: [PackageServiceItemDto], description: 'Services included in this package' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageServiceItemDto)
  services?: PackageServiceItemDto[];
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}

export class AssignPackageDto {
  @ApiProperty({ description: 'Patient ID to assign the package to' })
  @IsUUID()
  patient_id: string;

  @ApiProperty({ description: 'Package ID to assign' })
  @IsUUID()
  package_id: string;

  @ApiPropertyOptional({ description: 'Type of discount', enum: ['fixed', 'percentage'] })
  @IsOptional()
  @IsEnum(['fixed', 'percentage'])
  discount_type?: 'fixed' | 'percentage';

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
