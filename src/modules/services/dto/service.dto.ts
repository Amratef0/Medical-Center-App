import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Physiotherapy Session' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard physiotherapy treatment session' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration_minutes?: number;

  @ApiPropertyOptional({ example: 150.00, description: 'Base price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
