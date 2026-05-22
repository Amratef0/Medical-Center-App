import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMedicalHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chronic_diseases?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicalHistoryDto extends PartialType(CreateMedicalHistoryDto) {}
